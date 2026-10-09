<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barangay;
use App\Models\BarangayAnnouncement;
use App\Models\BarangayProgram;
use App\Models\ReportCategory;

/**
 * Read-only data for the "Citizens View" (no login needed).
 * Only information a barangay chooses to publish is exposed: profile, announcements,
 * programs and events. No submissions, files, users, contact persons/emails or compliance results.
 */
class PublicController extends Controller
{
    /** Landing page of the Citizens View. */
    public function overview()
    {
        $barangays = Barangay::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']);
        $ids = $barangays->pluck('id');
        $today = now()->startOfDay();

        $upcoming = BarangayProgram::whereIn('barangay_id', $ids)
            ->where('kind', 'event')
            ->where('starts_at', '>=', $today);

        $published = BarangayAnnouncement::whereIn('barangay_id', $ids)
            ->where('published_at', '<=', now());

        return response()->json([
            'barangays' => $barangays,
            'report_categories' => ReportCategory::orderBy('id')->get(['id', 'name', 'cycle', 'description']),
            'stats' => [
                'upcoming_events' => (clone $upcoming)->count(),
                'announcements' => (clone $published)->count(),
            ],
            'upcoming_events' => (clone $upcoming)
                ->with('barangay:id,name')
                ->orderBy('starts_at')
                ->limit(6)
                ->get()
                ->map(fn (BarangayProgram $p) => $this->programRow($p, true)),
            'latest_announcements' => (clone $published)
                ->with('barangay:id,name')
                ->orderByDesc('is_pinned')
                ->orderByDesc('published_at')
                ->limit(4)
                ->get()
                ->map(fn (BarangayAnnouncement $a) => $this->announcementRow($a, true)),
        ]);
    }

    /** One barangay: profile, announcements, calendar events and programs. */
    public function barangay(int $id)
    {
        $barangay = Barangay::where('is_active', true)->find($id);
        abort_unless($barangay, 404, 'Barangay not found.');

        return response()->json([
            'barangay' => $barangay->only(['id', 'name', 'code', 'about', 'hall_address', 'hotline', 'office_hours']),
            'announcements' => $barangay->announcements()
                ->where('published_at', '<=', now())
                ->orderByDesc('is_pinned')
                ->orderByDesc('published_at')
                ->limit(30)
                ->get()
                ->map(fn (BarangayAnnouncement $a) => $this->announcementRow($a)),
            // From the start of this month, so the calendar can show the whole current month.
            'events' => $barangay->programs()
                ->where('kind', 'event')
                ->where('starts_at', '>=', now()->startOfMonth())
                ->orderBy('starts_at')
                ->limit(200)
                ->get()
                ->map(fn (BarangayProgram $p) => $this->programRow($p)),
            'programs' => $barangay->programs()
                ->where('kind', 'program')
                ->orderBy('title')
                ->get()
                ->map(fn (BarangayProgram $p) => $this->programRow($p)),
        ]);
    }

    private function programRow(BarangayProgram $p, bool $withBarangay = false): array
    {
        $row = [
            'id' => $p->id,
            'kind' => $p->kind,
            'title' => $p->title,
            'description' => $p->description,
            'category' => $p->category,
            'venue' => $p->venue,
            'starts_at' => $p->starts_at?->toIso8601String(),
            'ends_at' => $p->ends_at?->toIso8601String(),
            'schedule_note' => $p->schedule_note,
        ];

        if ($withBarangay) {
            $row['barangay'] = $p->barangay?->only(['id', 'name']);
        }

        return $row;
    }

    private function announcementRow(BarangayAnnouncement $a, bool $withBarangay = false): array
    {
        $row = [
            'id' => $a->id,
            'title' => $a->title,
            'body' => $a->body,
            'is_pinned' => $a->is_pinned,
            'published_at' => $a->published_at?->toIso8601String(),
        ];

        if ($withBarangay) {
            $row['barangay'] = $a->barangay?->only(['id', 'name']);
        }

        return $row;
    }
}
