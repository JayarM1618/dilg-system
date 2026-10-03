<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Submission;
use App\Models\SubmissionFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * REPOSITORY of the 3 Rs: every barangay report, every uploaded version, per-barangay isolation.
 */
class SubmissionController extends Controller
{
    /**
     * List submissions.
     * - barangay_rep: only their own barangay's rows (per-barangay isolation).
     * - super_admin / office_supervisor: everything, with filters.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Submission::with(['barangay', 'category', 'submitter', 'reviewer', 'latestFile']);

        if ($user->isBarangayRep()) {
            $query->where('barangay_id', $user->barangay_id);
        } else {
            if ($barangayId = $request->query('barangay_id')) {
                $query->where('barangay_id', $barangayId);
            }

            if ($search = trim((string) $request->query('search'))) {
                $query->whereHas('barangay', fn ($q) => $q->where('name', 'like', '%' . $search . '%'));
            }
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($categoryId = $request->query('report_category_id')) {
            $query->where('report_category_id', $categoryId);
        }
        if ($period = $request->query('period_label')) {
            $query->where('period_label', $period);
        }
        if ($request->boolean('has_file')) {
            $query->whereHas('files'); // Repository view: only reports that were actually filed
        }

        $perPage = max(1, min((int) $request->query('per_page', 20), 200));

        return $query->latest('due_date')->orderBy('id')->paginate($perPage);
    }

    public function show(Request $request, Submission $submission)
    {
        $this->authorize('view', $submission);

        return $submission->load(['barangay', 'category', 'submitter', 'reviewer', 'files.uploader:id,name']);
    }

    /** Version history of one submission (newest first). Same access rule as the submission itself. */
    public function files(Request $request, Submission $submission)
    {
        $this->authorize('view', $submission);

        return $submission->files()->with('uploader:id,name')->get();
    }

    /**
     * Barangay rep uploads a report. The period and due date come from the row the office
     * already opened - never from the browser - and each upload is stored as a new version.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Submission::class);

        $data = $request->validate([
            'report_category_id' => ['required', 'exists:report_categories,id'],
            'period_label' => ['required', 'string', 'max:20'],
            'file' => ['required', 'file', 'max:' . config('reporting.max_upload_kb'), 'mimes:' . config('reporting.submission_mimes')],
        ]);

        $user = $request->user();

        $submission = Submission::where([
            'barangay_id' => $user->barangay_id,
            'report_category_id' => $data['report_category_id'],
            'period_label' => $data['period_label'],
        ])->first();

        if (!$submission) {
            return response()->json(['message' => 'That reporting period is not open for your barangay.'], 422);
        }

        // Locked once it is under review or compliant.
        $this->authorize('update', $submission);

        $upload = $request->file('file');
        $sha256 = hash_file('sha256', $upload->getRealPath());
        $path = $upload->store("submissions/{$user->barangay_id}/{$submission->report_category_id}/{$submission->period_label}", 'local');

        $file = DB::transaction(function () use ($submission, $upload, $sha256, $path, $user) {
            $locked = Submission::whereKey($submission->id)->lockForUpdate()->first();

            $file = $locked->files()->create([
                'version' => ((int) $locked->files()->max('version')) + 1,
                'path' => $path,
                'original_filename' => $upload->getClientOriginalName(),
                'mime_type' => $upload->getMimeType(),
                'size_bytes' => $upload->getSize(),
                'sha256' => $sha256,
                'uploaded_by' => $user->id,
            ]);

            // A new upload goes back to the office queue and clears the old review.
            $locked->update([
                'file_path' => $path,
                'original_filename' => $upload->getClientOriginalName(),
                'status' => 'submitted',
                'submitted_by' => $user->id,
                'submitted_at' => now(),
                'reviewed_by' => null,
                'reviewed_at' => null,
                'review_remarks' => null,
            ]);

            return $file;
        });

        ActivityLog::record('submission.uploaded', $submission, ['version' => $file->version, 'sha256' => $sha256]);

        return response()->json($submission->fresh()->load(['category', 'latestFile']), 201);
    }

    /** Office staff marks a submission compliant/non-compliant after review. */
    public function review(Request $request, Submission $submission)
    {
        $this->authorize('review', $submission);

        $data = $request->validate([
            'status' => ['required', 'in:compliant,non_compliant,under_review'],
            'review_remarks' => ['nullable', 'string', 'max:2000', 'required_if:status,non_compliant'],
        ]);

        if ($submission->status === 'pending') {
            return response()->json(['message' => 'Nothing has been submitted yet, so there is nothing to review.'], 422);
        }

        $submission->update([
            ...$data,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        ActivityLog::record('submission.reviewed', $submission, ['status' => $data['status']]);

        return $submission;
    }

    /** Download the latest file. */
    public function download(Request $request, Submission $submission)
    {
        $this->authorize('view', $submission);

        $file = $submission->files()->first();
        abort_unless($file, 404, 'No file has been uploaded for this report yet.');

        return $this->send($submission, $file);
    }

    /** Download one specific version. */
    public function downloadVersion(Request $request, Submission $submission, SubmissionFile $file)
    {
        $this->authorize('view', $submission);
        abort_unless($file->submission_id === $submission->id, 404);

        return $this->send($submission, $file);
    }

    private function send(Submission $submission, SubmissionFile $file)
    {
        abort_unless(Storage::disk('local')->exists($file->path), 404, 'The stored file could not be found.');

        ActivityLog::record('submission.downloaded', $submission, ['version' => $file->version]);

        return Storage::disk('local')->download($file->path, $file->original_filename);
    }
}
