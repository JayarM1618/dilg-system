<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Barangay;
use App\Models\BarangayAnnouncement;
use App\Models\BarangayProgram;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Lets a barangay representative publish what citizens see (their own barangay only).
 * Office staff (admin / super admin) may manage any barangay.
 */
class BarangayContentController extends Controller
{
    private function authorizeFor(Request $request, int $barangayId): void
    {
        $user = $request->user();

        abort_unless(
            $user->hasOfficeOversight()
                || ($user->isBarangayRep() && (int) $user->barangay_id === $barangayId),
            403,
            'You can only manage your own barangay.'
        );
    }

    public function updateProfile(Request $request, Barangay $barangay)
    {
        $this->authorizeFor($request, $barangay->id);

        $data = $request->validate([
            'about' => ['nullable', 'string', 'max:2000'],
            'hall_address' => ['nullable', 'string', 'max:255'],
            'hotline' => ['nullable', 'string', 'max:50'],
            'office_hours' => ['nullable', 'string', 'max:255'],
        ]);

        $barangay->update($data);
        ActivityLog::record('barangay.profile.updated', $barangay);

        return $barangay->only(['id', 'name', 'code', 'about', 'hall_address', 'hotline', 'office_hours']);
    }

    /* ---------------- announcements ---------------- */

    public function storeAnnouncement(Request $request, Barangay $barangay)
    {
        $this->authorizeFor($request, $barangay->id);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'body' => ['required', 'string', 'max:5000'],
            'is_pinned' => ['sometimes', 'boolean'],
        ]);

        $announcement = $barangay->announcements()->create($data + [
            'published_at' => now(),
            'created_by' => $request->user()->id,
        ]);

        ActivityLog::record('barangay.announcement.created', $announcement, ['barangay_id' => $barangay->id]);

        return response()->json($announcement, 201);
    }

    public function updateAnnouncement(Request $request, BarangayAnnouncement $announcement)
    {
        $this->authorizeFor($request, $announcement->barangay_id);

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:150'],
            'body' => ['sometimes', 'required', 'string', 'max:5000'],
            'is_pinned' => ['sometimes', 'boolean'],
        ]);

        $announcement->update($data);
        ActivityLog::record('barangay.announcement.updated', $announcement, ['barangay_id' => $announcement->barangay_id]);

        return $announcement;
    }

    public function destroyAnnouncement(Request $request, BarangayAnnouncement $announcement)
    {
        $this->authorizeFor($request, $announcement->barangay_id);

        ActivityLog::record('barangay.announcement.deleted', $announcement, ['barangay_id' => $announcement->barangay_id]);
        $announcement->delete();

        return response()->noContent();
    }

    /* ---------------- programs & events ---------------- */

    private function programRules(bool $creating): array
    {
        $required = $creating ? 'required' : 'sometimes';

        return [
            'kind' => [$required, Rule::in(BarangayProgram::KINDS)],
            'title' => [$required, 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:3000'],
            'category' => ['sometimes', Rule::in(BarangayProgram::CATEGORIES)],
            'venue' => ['nullable', 'string', 'max:150'],
            // A dated event needs a start; an ongoing program does not.
            'starts_at' => [Rule::requiredIf(fn () => request('kind') === 'event' && $creating), 'nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'schedule_note' => ['nullable', 'string', 'max:150'],
        ];
    }

    public function storeProgram(Request $request, Barangay $barangay)
    {
        $this->authorizeFor($request, $barangay->id);

        $data = $request->validate($this->programRules(true));

        $program = $barangay->programs()->create($data + ['created_by' => $request->user()->id]);
        ActivityLog::record('barangay.program.created', $program, ['barangay_id' => $barangay->id, 'kind' => $program->kind]);

        return response()->json($program, 201);
    }

    public function updateProgram(Request $request, BarangayProgram $program)
    {
        $this->authorizeFor($request, $program->barangay_id);

        $program->update($request->validate($this->programRules(false)));
        ActivityLog::record('barangay.program.updated', $program, ['barangay_id' => $program->barangay_id]);

        return $program;
    }

    public function destroyProgram(Request $request, BarangayProgram $program)
    {
        $this->authorizeFor($request, $program->barangay_id);

        ActivityLog::record('barangay.program.deleted', $program, ['barangay_id' => $program->barangay_id]);
        $program->delete();

        return response()->noContent();
    }
}
