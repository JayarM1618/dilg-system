<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Barangay;
use App\Models\Requirement;
use App\Models\RequirementAssignment;
use App\Models\RequirementFile;
use App\Models\RequirementResponse;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * REQUIREMENTS: DILG (supervisor or super admin) sends files, report requests, complaints or
 * memos to every barangay or to chosen ones. Each barangay receives it, complies, and DILG
 * tracks which barangays have complied.
 *
 *   pending -> received (rep opened/downloaded) -> submitted (rep sent files back)
 *           -> complied (DILG accepted)  or  revision (DILG asks for a fix) -> submitted ...
 */
class RequirementController extends Controller
{
    private function isOffice(Request $request): bool
    {
        return $request->user()->hasOfficeOversight();
    }

    /** The rep's own assignment for a requirement, or 404. */
    private function ownAssignment(Request $request, Requirement $requirement): RequirementAssignment
    {
        $assignment = RequirementAssignment::where('requirement_id', $requirement->id)
            ->where('barangay_id', $request->user()->barangay_id)
            ->first();
        abort_unless($assignment, 404);

        return $assignment;
    }

    private function isOverdue(Requirement $r, string $assignmentStatus): bool
    {
        return $r->due_date !== null
            && $r->due_date->lt(now()->startOfDay())
            && $assignmentStatus !== 'complied';
    }

    /** Office: every requirement sent, with progress counts. Barangay: their own inbox. */
    public function index(Request $request)
    {
        if ($this->isOffice($request)) {
            $rows = Requirement::with(['creator:id,name', 'assignments:id,requirement_id,status'])
                ->withCount('files')
                ->orderByDesc('id')
                ->get()
                ->map(function (Requirement $r) {
                    $by = $r->assignments->countBy('status');
                    $total = $r->assignments->count();
                    $complied = (int) ($by['complied'] ?? 0);
                    $overdue = $r->assignments->filter(fn ($a) => $this->isOverdue($r, $a->status))->count();

                    $out = $r->toArray();
                    unset($out['assignments']);

                    return $out + [
                        'progress' => [
                            'total' => $total,
                            'complied' => $complied,
                            'submitted' => (int) ($by['submitted'] ?? 0),
                            'revision' => (int) ($by['revision'] ?? 0),
                            'waiting' => (int) ($by['pending'] ?? 0) + (int) ($by['received'] ?? 0),
                            'overdue' => $overdue,
                            'percent' => $total ? (int) round($complied / $total * 100) : 0,
                        ],
                    ];
                });

            return response()->json(['data' => $rows]);
        }

        abort_unless($request->user()->barangay_id, 403);

        $rows = RequirementAssignment::with(['requirement.files', 'requirement.creator:id,name'])
            ->withCount('responses')
            ->where('barangay_id', $request->user()->barangay_id)
            ->orderByDesc('id')
            ->get()
            ->map(function (RequirementAssignment $a) {
                $out = $a->toArray();
                $out['is_overdue'] = $this->isOverdue($a->requirement, $a->status);

                return $out;
            });

        return response()->json(['data' => $rows]);
    }

    /** Small counters for badges and dashboard cards. */
    public function summary(Request $request)
    {
        if ($this->isOffice($request)) {
            $open = Requirement::where('status', 'open')->count();
            $awaiting = RequirementAssignment::where('status', 'submitted')->count();
            $overdue = RequirementAssignment::whereIn('status', ['pending', 'received', 'revision', 'submitted'])
                ->whereHas('requirement', fn ($q) => $q->where('status', 'open')->whereDate('due_date', '<', now()->toDateString()))
                ->count();

            return ['open' => $open, 'awaiting_review' => $awaiting, 'overdue' => $overdue];
        }

        $mine = RequirementAssignment::where('barangay_id', $request->user()->barangay_id)
            ->whereHas('requirement', fn ($q) => $q->where('status', 'open'));

        return [
            'to_do' => (clone $mine)->whereIn('status', ['pending', 'received', 'revision'])->count(),
            'new' => (clone $mine)->where('status', 'pending')->count(),
            'overdue' => (clone $mine)->whereIn('status', ['pending', 'received', 'revision'])
                ->whereHas('requirement', fn ($q) => $q->whereDate('due_date', '<', now()->toDateString()))
                ->count(),
        ];
    }

    /** Office: compliance per barangay across everything that was sent. */
    public function tracker(Request $request)
    {
        abort_unless($this->isOffice($request), 403);

        $assignments = RequirementAssignment::with('requirement:id,due_date,status')->get()->groupBy('barangay_id');

        $rows = Barangay::where('is_active', true)->orderBy('name')->get(['id', 'name'])->map(function ($b) use ($assignments) {
            $list = $assignments->get($b->id, collect());
            $by = $list->countBy('status');
            $total = $list->count();
            $complied = (int) ($by['complied'] ?? 0);

            return [
                'barangay_id' => $b->id,
                'barangay' => $b->name,
                'total' => $total,
                'complied' => $complied,
                'submitted' => (int) ($by['submitted'] ?? 0),
                'revision' => (int) ($by['revision'] ?? 0),
                'waiting' => (int) ($by['pending'] ?? 0) + (int) ($by['received'] ?? 0),
                'overdue' => $list->filter(fn ($a) => $this->isOverdue($a->requirement, $a->status))->count(),
                'percent' => $total ? (int) round($complied / $total * 100) : null,
            ];
        })->values();

        return response()->json(['data' => $rows]);
    }

    /** DILG sends something out. */
    public function store(Request $request)
    {
        abort_unless($this->isOffice($request), 403);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'kind' => ['required', 'in:' . implode(',', config('reporting.requirement_kinds'))],
            'description' => ['nullable', 'string', 'max:5000'],
            'due_date' => ['nullable', 'date', 'after_or_equal:today'],
            'requires_response' => ['nullable', 'boolean'],
            'audience' => ['required', 'in:all,selected'],
            'barangay_ids' => ['required_if:audience,selected', 'array'],
            'barangay_ids.*' => ['integer', 'exists:barangays,id'],
            'files' => ['nullable', 'array', 'max:10'],
            'files.*' => ['file', 'max:' . config('reporting.max_upload_kb'), 'mimes:' . config('reporting.requirement_mimes')],
        ]);

        $targets = $data['audience'] === 'all'
            ? Barangay::where('is_active', true)->pluck('id')
            : Barangay::where('is_active', true)->whereIn('id', $data['barangay_ids'] ?? [])->pluck('id');

        if ($targets->isEmpty()) {
            return response()->json(['message' => 'Choose at least one active barangay.', 'errors' => ['barangay_ids' => ['Choose at least one active barangay.']]], 422);
        }

        $requirement = DB::transaction(function () use ($data, $targets, $request) {
            $r = Requirement::create([
                'title' => $data['title'],
                'kind' => $data['kind'],
                'description' => $data['description'] ?? null,
                'due_date' => $data['due_date'] ?? null,
                'requires_response' => $request->has('requires_response') ? $request->boolean('requires_response') : true,
                'audience' => $data['audience'],
                'status' => 'open',
                'created_by' => $request->user()->id,
            ]);

            foreach ($targets as $barangayId) {
                RequirementAssignment::create(['requirement_id' => $r->id, 'barangay_id' => $barangayId, 'status' => 'pending']);
            }

            foreach ($request->file('files', []) as $upload) {
                RequirementFile::create([
                    'requirement_id' => $r->id,
                    'path' => $upload->store('requirements/' . $r->id, 'local'),
                    'original_filename' => $upload->getClientOriginalName(),
                    'mime_type' => $upload->getClientMimeType(),
                    'size_bytes' => $upload->getSize(),
                    'sha256' => hash_file('sha256', $upload->getRealPath()),
                ]);
            }

            return $r;
        });

        ActivityLog::record('requirement.sent', $requirement, [
            'kind' => $requirement->kind,
            'audience' => $requirement->audience,
            'barangays' => $targets->count(),
        ]);

        // ── Notify all targeted barangay reps ──
        $kindLabel = ucfirst(str_replace('_', ' ', $requirement->kind));
        $due = $requirement->due_date ? ' (due ' . $requirement->due_date->format('M j, Y') . ')' : '';
        NotificationService::notifyBarangays(
            $targets->toArray(),
            'requirement.new',
            "New {$kindLabel} from DILG",
            "\"{$requirement->title}\"{$due}",
            '/borms/requirements',
            $request->user(),
        );

        return response()->json($requirement->load('files'), 201);
    }

    /** Office: the full picture. Barangay: only their own copy. */
    public function show(Request $request, Requirement $requirement)
    {
        $requirement->load(['files', 'creator:id,name']);

        if ($this->isOffice($request)) {
            $requirement->load([
                'assignments' => fn ($q) => $q->with(['barangay:id,name', 'responses.uploader:id,name', 'reviewer:id,name'])->orderBy('id'),
            ]);
            $requirement->assignments->each(fn ($a) => $a->is_overdue = $this->isOverdue($requirement, $a->status));

            return $requirement;
        }

        $assignment = $this->ownAssignment($request, $requirement);
        $assignment->load(['responses.uploader:id,name', 'reviewer:id,name']);
        $assignment->is_overdue = $this->isOverdue($requirement, $assignment->status);

        $out = $requirement->toArray();
        $out['assignment'] = $assignment->toArray();

        return response()->json($out);
    }

    /** Barangay sends their compliance back (or acknowledges, when no file is expected). */
    public function respond(Request $request, Requirement $requirement)
    {
        abort_unless($request->user()->isBarangayRep(), 403);
        $assignment = $this->ownAssignment($request, $requirement);

        if ($requirement->status !== 'open') {
            return response()->json(['message' => 'This requirement is closed.'], 422);
        }
        if ($assignment->status === 'complied') {
            return response()->json(['message' => 'This is already marked complied.'], 422);
        }
        if ($assignment->status === 'submitted') {
            return response()->json(['message' => 'Your response is waiting for DILG review.'], 422);
        }

        $data = $request->validate([
            'note' => ['nullable', 'string', 'max:2000'],
            'files' => [$requirement->requires_response ? 'required' : 'nullable', 'array', 'min:' . ($requirement->requires_response ? 1 : 0), 'max:10'],
            'files.*' => ['file', 'max:' . config('reporting.max_upload_kb'), 'mimes:' . config('reporting.requirement_mimes')],
        ]);

        DB::transaction(function () use ($request, $requirement, $assignment, $data) {
            $version = ((int) $assignment->responses()->max('version')) + 1;
            $files = $request->file('files', []);

            if ($files) {
                foreach ($files as $i => $upload) {
                    RequirementResponse::create([
                        'assignment_id' => $assignment->id,
                        'version' => $version,
                        'note' => $i === 0 ? ($data['note'] ?? null) : null,
                        'path' => $upload->store('requirements/' . $requirement->id . '/responses', 'local'),
                        'original_filename' => $upload->getClientOriginalName(),
                        'mime_type' => $upload->getClientMimeType(),
                        'size_bytes' => $upload->getSize(),
                        'sha256' => hash_file('sha256', $upload->getRealPath()),
                        'uploaded_by' => $request->user()->id,
                    ]);
                }
            } else {
                RequirementResponse::create([
                    'assignment_id' => $assignment->id,
                    'version' => $version,
                    'note' => $data['note'] ?? null,
                    'uploaded_by' => $request->user()->id,
                ]);
            }

            $assignment->update([
                'received_at' => $assignment->received_at ?? now(),
                'submitted_at' => now(),
                // Nothing to review when no file was asked for: acknowledging is complying.
                'status' => $requirement->requires_response ? 'submitted' : 'complied',
                'reviewed_at' => $requirement->requires_response ? null : now(),
                'review_notes' => null,
            ]);
        });

        ActivityLog::record(
            $requirement->requires_response ? 'requirement.responded' : 'requirement.acknowledged',
            $requirement,
            ['barangay_id' => $assignment->barangay_id]
        );

        // ── Notify office that a barangay responded ──
        $barangay = $request->user()->barangay;
        $bName = $barangay ? $barangay->name : 'A barangay';
        NotificationService::notifyOffice(
            'requirement.responded',
            "Barangay {$bName} responded",
            "Response submitted for \"{$requirement->title}\"",
            '/borms/requirements',
            $request->user(),
        );

        return $this->show($request, $requirement);
    }

    /** Office: accept the response (complied) or ask the barangay to fix it (revision). */
    public function review(Request $request, RequirementAssignment $assignment)
    {
        abort_unless($this->isOffice($request), 403);

        $data = $request->validate([
            'decision' => ['required', 'in:complied,revision'],
            'notes' => ['nullable', 'required_if:decision,revision', 'string', 'max:2000'],
        ]);

        if ($assignment->status !== 'submitted') {
            return response()->json(['message' => 'Only a submitted response can be reviewed.'], 422);
        }

        $assignment->update([
            'status' => $data['decision'],
            'review_notes' => $data['notes'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        ActivityLog::record('requirement.reviewed', $assignment->requirement, [
            'barangay_id' => $assignment->barangay_id,
            'decision' => $data['decision'],
        ]);

        // ── Notify the barangay rep about the review decision ──
        $requirement = $assignment->requirement;
        $label = $data['decision'] === 'complied' ? 'Complied' : 'Needs revision';
        NotificationService::notifyBarangay(
            $assignment->barangay_id,
            'requirement.reviewed',
            "Requirement marked: {$label}",
            "Your response to \"{$requirement->title}\" was reviewed" . ($data['decision'] === 'revision' ? '. Please check the notes and resubmit.' : '.'),
            '/borms/requirements',
            $request->user(),
        );

        return $assignment->load(['barangay:id,name', 'responses.uploader:id,name', 'reviewer:id,name']);
    }

    public function close(Request $request, Requirement $requirement)
    {
        abort_unless($this->isOffice($request), 403);
        $requirement->update(['status' => 'closed', 'closed_at' => now()]);
        ActivityLog::record('requirement.closed', $requirement);

        return $requirement;
    }

    public function reopen(Request $request, Requirement $requirement)
    {
        abort_unless($this->isOffice($request), 403);
        $requirement->update(['status' => 'open', 'closed_at' => null]);
        ActivityLog::record('requirement.reopened', $requirement);

        return $requirement;
    }

    /** Super admin only: remove a requirement and all its files. */
    public function destroy(Request $request, Requirement $requirement)
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        $paths = $requirement->files()->pluck('path')
            ->merge(RequirementResponse::whereIn('assignment_id', $requirement->assignments()->pluck('id'))->whereNotNull('path')->pluck('path'));

        $title = $requirement->title;
        $requirement->delete(); // assignments, files and responses cascade
        foreach ($paths as $p) {
            Storage::disk('local')->delete($p);
        }

        ActivityLog::record('requirement.deleted', null, ['title' => $title]);

        return response()->noContent();
    }

    /** DILG's attachment. A barangay can only fetch what was sent to them. */
    public function downloadFile(Request $request, Requirement $requirement, RequirementFile $file)
    {
        abort_unless($file->requirement_id === $requirement->id, 404);

        if (!$this->isOffice($request)) {
            $assignment = $this->ownAssignment($request, $requirement);
            if ($assignment->status === 'pending') {
                $assignment->update(['status' => 'received', 'received_at' => now()]);
            }
        }
        abort_unless(Storage::disk('local')->exists($file->path), 404, 'The stored file could not be found.');

        ActivityLog::record('requirement.file_downloaded', $requirement);

        return Storage::disk('local')->download($file->path, $file->original_filename);
    }

    /** A barangay's returned file. DILG, or the barangay that sent it. */
    public function downloadResponse(Request $request, RequirementResponse $response)
    {
        $assignment = $response->assignment;
        if (!$this->isOffice($request)) {
            abort_unless($request->user()->barangay_id && $assignment->barangay_id === $request->user()->barangay_id, 404);
        }
        abort_unless($response->path && Storage::disk('local')->exists($response->path), 404, 'The stored file could not be found.');

        ActivityLog::record('requirement.response_downloaded', $assignment->requirement, ['barangay_id' => $assignment->barangay_id]);

        return Storage::disk('local')->download($response->path, $response->original_filename);
    }

    /** Opening the detail also counts as receiving it. */
    public function markReceived(Request $request, Requirement $requirement)
    {
        abort_unless($request->user()->isBarangayRep(), 403);
        $assignment = $this->ownAssignment($request, $requirement);
        if ($assignment->status === 'pending') {
            $assignment->update(['status' => 'received', 'received_at' => now()]);
            ActivityLog::record('requirement.received', $requirement, ['barangay_id' => $assignment->barangay_id]);
        }

        return $this->show($request, $requirement);
    }
}
