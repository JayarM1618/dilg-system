<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\FormSubmission;
use App\Models\FormTemplate;
use App\Models\RequirementAssignment;
use App\Services\NotificationService;
use Illuminate\Http\Request;

/**
 * FORM SUBMISSIONS: Barangay reps fill out form templates, add an e-signature,
 * and submit. Office reviews submissions.
 */
class FormSubmissionController extends Controller
{
    /** List form submissions. Barangay reps see their own; office sees all. */
    public function index(Request $request)
    {
        $query = FormSubmission::with(['template:id,title,category', 'barangay:id,name', 'submitter:id,name']);

        if ($request->user()->isBarangayRep()) {
            $query->where('barangay_id', $request->user()->barangay_id);
        } else {
            if ($barangayId = $request->query('barangay_id')) {
                $query->where('barangay_id', $barangayId);
            }
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($templateId = $request->query('form_template_id')) {
            $query->where('form_template_id', $templateId);
        }
        if ($reqId = $request->query('requirement_id')) {
            $query->where('requirement_id', $reqId);
        }

        return response()->json([
            'data' => $query->orderByDesc('updated_at')->get(),
        ]);
    }

    /** Show one submission with full data + signature status (not the actual image). */
    public function show(Request $request, FormSubmission $formSubmission)
    {
        $user = $request->user();
        if ($user->isBarangayRep()) {
            abort_unless($formSubmission->barangay_id === $user->barangay_id, 404);
        }

        $formSubmission->load(['template', 'barangay:id,name', 'submitter:id,name', 'reviewer:id,name']);

        // Append a boolean instead of the huge base64
        $formSubmission->has_signature = $formSubmission->isSigned();

        return $formSubmission;
    }

    /** Get the signature image for a submission (authorized users only). */
    public function signature(Request $request, FormSubmission $formSubmission)
    {
        $user = $request->user();
        if ($user->isBarangayRep()) {
            abort_unless($formSubmission->barangay_id === $user->barangay_id, 404);
        }

        abort_unless($formSubmission->signature_data, 404, 'No signature found.');

        return response()->json([
            'signature_data' => $formSubmission->signature_data,
            'signature_name' => $formSubmission->signature_name,
            'signature_position' => $formSubmission->signature_position,
            'signed_at' => $formSubmission->signed_at,
        ]);
    }

    /**
     * Create or save a draft form submission. Barangay reps only.
     * The form data is stored as JSON; the template defines what fields are expected.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isBarangayRep() && $user->barangay_id, 403);

        $data = $request->validate([
            'form_template_id' => ['required', 'exists:form_templates,id'],
            'requirement_id' => ['nullable', 'exists:requirements,id'],
            'data' => ['required', 'array'],
            'status' => ['nullable', 'in:draft,submitted'],
            'signature_data' => ['nullable', 'string', 'max:500000'], // ~375KB base64
            'signature_name' => ['nullable', 'string', 'max:255'],
            'signature_position' => ['nullable', 'string', 'max:255'],
        ]);

        $template = FormTemplate::findOrFail($data['form_template_id']);
        abort_unless($template->is_active, 422, 'This form template is no longer active.');

        $isSubmitting = ($data['status'] ?? 'draft') === 'submitted';

        // Validate required fields if submitting
        if ($isSubmitting) {
            $requiredFields = collect($template->fields)->filter(fn ($f) => $f['required'] ?? false)->pluck('name');
            $missing = $requiredFields->filter(fn ($name) => empty($data['data'][$name]))->values();
            if ($missing->isNotEmpty()) {
                return response()->json([
                    'message' => 'Please fill in all required fields before submitting.',
                    'errors' => ['missing_fields' => $missing],
                ], 422);
            }
        }

        $submission = FormSubmission::create([
            'form_template_id' => $data['form_template_id'],
            'requirement_id' => $data['requirement_id'] ?? null,
            'barangay_id' => $user->barangay_id,
            'data' => $data['data'],
            'status' => $isSubmitting ? 'submitted' : 'draft',
            'submitted_at' => $isSubmitting ? now() : null,
            'submitted_by' => $user->id,
            'signature_data' => $data['signature_data'] ?? null,
            'signature_name' => $data['signature_name'] ?? $user->name,
            'signature_position' => $data['signature_position'] ?? $user->position,
            'signed_at' => isset($data['signature_data']) ? now() : null,
        ]);

        ActivityLog::record('form_submission.' . ($isSubmitting ? 'submitted' : 'drafted'), $submission, [
            'template' => $template->title,
        ]);

        if ($isSubmitting) {
            if ($submission->requirement_id) {
                RequirementAssignment::where('requirement_id', $submission->requirement_id)
                    ->where('barangay_id', $user->barangay_id)
                    ->whereIn('status', ['pending', 'received', 'revision'])
                    ->update(['status' => 'submitted']);
            }

            $bName = $user->barangay?->name ?? 'A barangay';
            NotificationService::notifyOffice(
                'form_submission.submitted',
                "Form submitted by Brgy. {$bName}",
                "\"{$template->title}\" was filled and submitted for review.",
                '/borms/requirements',
                $user,
            );
        }

        return response()->json($submission->load(['template:id,title,category', 'barangay:id,name']), 201);
    }

    /** Update a draft submission. Only drafts can be updated by barangay reps. */
    public function update(Request $request, FormSubmission $formSubmission)
    {
        $user = $request->user();

        if ($user->isBarangayRep()) {
            abort_unless($formSubmission->barangay_id === $user->barangay_id, 403);
            abort_unless(in_array($formSubmission->status, ['draft', 'revision']), 422, 'Only draft or revision forms can be edited.');
        } else {
            abort_unless($user->hasOfficeOversight(), 403);
        }

        $data = $request->validate([
            'data' => ['sometimes', 'array'],
            'status' => ['nullable', 'in:draft,submitted'],
            'signature_data' => ['nullable', 'string', 'max:500000'],
            'signature_name' => ['nullable', 'string', 'max:255'],
            'signature_position' => ['nullable', 'string', 'max:255'],
        ]);

        $isSubmitting = ($data['status'] ?? $formSubmission->status) === 'submitted';

        $updates = [];
        if (isset($data['data'])) {
            $updates['data'] = $data['data'];
        }
        if (isset($data['signature_data'])) {
            $updates['signature_data'] = $data['signature_data'];
            $updates['signature_name'] = $data['signature_name'] ?? $user->name;
            $updates['signature_position'] = $data['signature_position'] ?? $user->position;
            $updates['signed_at'] = now();
        }
        if ($isSubmitting && $formSubmission->status !== 'submitted') {
            // Validate required fields
            $template = $formSubmission->template;
            $formData = $updates['data'] ?? $formSubmission->data;
            $requiredFields = collect($template->fields)->filter(fn ($f) => $f['required'] ?? false)->pluck('name');
            $missing = $requiredFields->filter(fn ($name) => empty($formData[$name]))->values();
            if ($missing->isNotEmpty()) {
                return response()->json([
                    'message' => 'Please fill in all required fields before submitting.',
                    'errors' => ['missing_fields' => $missing],
                ], 422);
            }

            $updates['status'] = 'submitted';
            $updates['submitted_at'] = now();
            $updates['submitted_by'] = $user->id;
            $updates['reviewed_at'] = null;
            $updates['review_notes'] = null;
        }

        $formSubmission->update($updates);

        if ($isSubmitting && $formSubmission->wasChanged('status')) {
            if ($formSubmission->requirement_id) {
                RequirementAssignment::where('requirement_id', $formSubmission->requirement_id)
                    ->where('barangay_id', $user->barangay_id)
                    ->whereIn('status', ['pending', 'received', 'revision'])
                    ->update(['status' => 'submitted']);
            }

            $bName = $user->barangay?->name ?? 'A barangay';
            NotificationService::notifyOffice(
                'form_submission.submitted',
                "Form resubmitted by Brgy. {$bName}",
                "\"{$formSubmission->template->title}\" was updated and resubmitted for review.",
                '/borms/requirements',
                $user,
            );
        }

        ActivityLog::record('form_submission.updated', $formSubmission);

        return $formSubmission->load(['template:id,title,category', 'barangay:id,name']);
    }

    /** Office reviews a form submission: approve or ask for revision. */
    public function review(Request $request, FormSubmission $formSubmission)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $data = $request->validate([
            'decision' => ['required', 'in:approved,revision,rejected'],
            'review_notes' => ['nullable', 'required_if:decision,revision', 'required_if:decision,rejected', 'string', 'max:2000'],
        ]);

        if ($formSubmission->status !== 'submitted') {
            return response()->json(['message' => 'Only submitted forms can be reviewed.'], 422);
        }

        $formSubmission->update([
            'status' => $data['decision'],
            'review_notes' => $data['review_notes'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        if ($formSubmission->requirement_id) {
            $reqStatus = match ($data['decision']) {
                'approved' => 'complied',
                'revision' => 'revision',
                'rejected' => 'revision',
                default => null,
            };
            if ($reqStatus) {
                RequirementAssignment::where('requirement_id', $formSubmission->requirement_id)
                    ->where('barangay_id', $formSubmission->barangay_id)
                    ->update([
                        'status' => $reqStatus,
                        'reviewed_by' => $request->user()->id,
                        'reviewed_at' => now(),
                        'review_notes' => $data['review_notes'] ?? null,
                    ]);
            }
        }

        ActivityLog::record('form_submission.reviewed', $formSubmission, ['decision' => $data['decision']]);

        // Notify the barangay
        $label = match ($data['decision']) {
            'approved' => 'Approved',
            'revision' => 'Needs revision',
            'rejected' => 'Rejected',
        };
        NotificationService::notifyBarangay(
            $formSubmission->barangay_id,
            'form_submission.reviewed',
            "Form marked: {$label}",
            "Your \"{$formSubmission->template->title}\" form was reviewed" .
            ($data['decision'] === 'revision' ? '. Please check the notes and resubmit.' : '.'),
            '/borms/requirements',
            $request->user(),
        );

        return $formSubmission->load(['template:id,title,category', 'barangay:id,name', 'reviewer:id,name']);
    }
}
