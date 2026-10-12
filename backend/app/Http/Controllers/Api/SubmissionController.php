<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ReportCategory;
use App\Models\Submission;
use App\Models\SubmissionFile;
use App\Support\PeriodOpener;
use Carbon\CarbonImmutable;
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
     * What a barangay representative can file right now: every report type with its current
     * (and previous) period, its due date, where it stands and the current DILG form to download.
     * This feeds the "Submit a report" form, so a barangay never has to wait for DILG to open a period.
     */
    public function options(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isBarangayRep() && $user->barangay_id, 403, 'Only barangay representatives file reports.');

        $existing = Submission::where('barangay_id', $user->barangay_id)->get()
            ->keyBy(fn ($s) => $s->report_category_id . '|' . $s->period_label);

        $data = ReportCategory::with('latestResource')->orderBy('name')->get()
            ->map(function (ReportCategory $c) use ($existing) {
                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'cycle' => $c->cycle,
                    'description' => $c->description,
                    'template' => $c->latestResource ? ['id' => $c->latestResource->id, 'version' => $c->latestResource->version] : null,
                    'periods' => collect(PeriodOpener::fileablePeriods($c))->map(function ($p) use ($c, $existing) {
                        $row = $existing->get($c->id . '|' . $p['label']);

                        return [
                            'period_label' => $p['label'],
                            'due_date' => $row?->due_date?->toDateString() ?? $p['due']->toDateString(),
                            'is_current' => $p['current'],
                            'status' => $row?->status ?? 'pending',
                            // same rule as SubmissionPolicy::update: locked once under review or compliant
                            'can_upload' => !$row || in_array($row->status, ['pending', 'submitted', 'non_compliant']),
                        ];
                    })->values(),
                ];
            })->values();

        return response()->json(['data' => $data]);
    }

    /** Office: open a reporting period for every active barangay (optionally one report type). */
    public function openPeriods(Request $request)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $data = $request->validate([
            'report_category_id' => ['nullable', 'exists:report_categories,id'],
            'date' => ['nullable', 'date'],
        ]);

        $created = PeriodOpener::open(
            isset($data['date']) ? CarbonImmutable::parse($data['date']) : null,
            $data['report_category_id'] ?? null,
        );

        ActivityLog::record('report.period_opened', null, ['created' => $created, 'report_category_id' => $data['report_category_id'] ?? null]);

        return response()->json([
            'created' => $created,
            'message' => $created > 0
                ? "Opened {$created} report slot(s) for the barangays."
                : 'Those periods were already open. Nothing new was added.',
        ]);
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

        // Not opened by the office yet? The barangay may still file for the current or previous
        // period of that report: the server works out the dates, never the browser.
        if (!$submission) {
            $category = ReportCategory::findOrFail($data['report_category_id']);
            $period = collect(PeriodOpener::fileablePeriods($category))->firstWhere('label', $data['period_label']);

            if (!$period) {
                return response()->json(['message' => 'That reporting period is not open for your barangay.'], 422);
            }

            $submission = Submission::firstOrCreate(
                [
                    'barangay_id' => $user->barangay_id,
                    'report_category_id' => $category->id,
                    'period_label' => $period['label'],
                ],
                [
                    'period_start' => $period['start']->toDateString(),
                    'period_end' => $period['end']->toDateString(),
                    'due_date' => $period['due']->toDateString(),
                    'status' => 'pending',
                ]
            );
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
