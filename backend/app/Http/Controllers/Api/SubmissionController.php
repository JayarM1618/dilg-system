<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SubmissionController extends Controller
{
    /**
     * List submissions.
     * - barangay_rep: only their own barangay's rows (per-barangay isolation).
     * - super_admin / office_supervisor: everything, for the consolidation dashboard.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Submission::with(['barangay', 'category', 'submitter', 'reviewer']);

        if ($user->isBarangayRep()) {
            $query->where('barangay_id', $user->barangay_id);
        } elseif ($barangayId = $request->query('barangay_id')) {
            // office side can optionally filter to one barangay
            $query->where('barangay_id', $barangayId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return $query->latest('due_date')->paginate(20);
    }

    public function show(Request $request, Submission $submission)
    {
        $this->authorize('view', $submission);

        return $submission->load(['barangay', 'category', 'submitter', 'reviewer']);
    }

    /** Barangay rep uploads/updates their submission file. */
    public function store(Request $request)
    {
        $this->authorize('create', Submission::class);

        $data = $request->validate([
            'report_category_id' => ['required', 'exists:report_categories,id'],
            'period_label' => ['required', 'string'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
            'due_date' => ['required', 'date'],
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,doc,docx,xls,xlsx'],
        ]);

        $path = $request->file('file')->store('submissions/' . $request->user()->barangay_id, 'local');

        $submission = Submission::updateOrCreate(
            [
                'barangay_id' => $request->user()->barangay_id,
                'report_category_id' => $data['report_category_id'],
                'period_label' => $data['period_label'],
            ],
            [
                'period_start' => $data['period_start'],
                'period_end' => $data['period_end'],
                'due_date' => $data['due_date'],
                'file_path' => $path,
                'original_filename' => $request->file('file')->getClientOriginalName(),
                'status' => 'submitted',
                'submitted_by' => $request->user()->id,
                'submitted_at' => now(),
            ]
        );

        ActivityLog::record('submission.uploaded', $submission);

        return response()->json($submission, 201);
    }

    /** Office staff marks a submission compliant/non-compliant after review. */
    public function review(Request $request, Submission $submission)
    {
        $this->authorize('review', $submission);

        $data = $request->validate([
            'status' => ['required', 'in:compliant,non_compliant,under_review'],
            'review_remarks' => ['nullable', 'string'],
        ]);

        $submission->update([
            ...$data,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        ActivityLog::record('submission.reviewed', $submission, ['status' => $data['status']]);

        return $submission;
    }

    public function download(Request $request, Submission $submission)
    {
        $this->authorize('view', $submission);

        abort_unless($submission->file_path, 404);

        ActivityLog::record('submission.downloaded', $submission);

        return Storage::disk('local')->download($submission->file_path, $submission->original_filename);
    }
}
