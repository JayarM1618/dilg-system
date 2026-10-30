<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barangay;
use App\Models\BarangayAnnouncement;
use App\Models\BarangayProgram;
use App\Models\ReportCategory;
use App\Models\Submission;
use Illuminate\Http\Request;

/**
 * Read-only data for the "Citizens View" (no login needed) and real-time public telemetry.
 */
class PublicController extends Controller
{
    /** Real-time compliance and telemetry analytics for citywide or per-barangay views. */
    public function analytics(Request $request)
    {
        $barangayId = $request->query('barangay_id');
        $barangaysCount = Barangay::where('is_active', true)->count();

        $query = Submission::query();
        if ($barangayId) {
            $query->where('barangay_id', $barangayId);
        }

        $all = (clone $query)->get();
        $total = $all->count();
        $compliant = $all->where('status', 'compliant')->count();
        $underReview = $all->whereIn('status', ['submitted', 'under_review'])->count();
        $pending = $all->where('status', 'pending')->count();
        $nonCompliant = $all->where('status', 'non_compliant')->count();
        $overdue = $all->filter(fn ($s) => $s->is_overdue || ($s->status === 'pending' && $s->due_date && $s->due_date->isPast()))->count();

        // Monthly compliance trend for the last 7 months
        $months = [];
        $start = now()->subMonths(6)->startOfMonth();
        for ($i = 0; $i < 7; $i++) {
            $mDate = (clone $start)->addMonths($i);
            $mKey = $mDate->format('Y-m');
            $mLabel = $mDate->format('M');

            $mSubmissions = $all->filter(function ($s) use ($mKey) {
                $period = substr((string)$s->period_label, 0, 7);
                if ($period === $mKey) return true;
                $dueDate = $s->due_date ? $s->due_date->format('Y-m') : null;
                return $dueDate === $mKey;
            });

            $mDue = $mSubmissions->count();
            $mFiled = $mSubmissions->whereIn('status', ['submitted', 'under_review', 'compliant'])->count();
            $mCompliant = $mSubmissions->where('status', 'compliant')->count();
            $rate = $mDue > 0 ? round(($mCompliant / $mDue) * 100, 1) : ($mFiled > 0 ? 100 : 0);

            $months[] = [
                'month' => $mKey,
                'label' => $mLabel,
                'due' => $mDue,
                'filed' => $mFiled,
                'compliant' => $mCompliant,
                'rate' => $rate,
            ];
        }

        return response()->json([
            'total' => $total,
            'compliant' => $compliant,
            'under_review' => $underReview,
            'pending' => $pending,
            'non_compliant' => $nonCompliant,
            'overdue' => $overdue,
            'compliance_rate' => $total > 0 ? round(($compliant / $total) * 100, 1) : 0,
            'total_barangays' => $barangaysCount,
            'monthly_trend' => $months,
            'updated_at' => now()->toIso8601String(),
        ]);
    }
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
        $barangay = Barangay::find($id);
        abort_unless($barangay, 404, 'Barangay not found.');

        return response()->json([
            'barangay' => $barangay->only(['id', 'name', 'code', 'about', 'hall_address', 'hotline', 'office_hours']),
            'announcements' => $barangay->announcements()
                ->where(function ($q) {
                    $q->whereNull('published_at')
                        ->orWhere('published_at', '<=', now()->addMinutes(2));
                })
                ->orderByDesc('is_pinned')
                ->orderByDesc('published_at')
                ->limit(50)
                ->get()
                ->map(fn (BarangayAnnouncement $a) => $this->announcementRow($a)),
            // From recent months, so the calendar and rep can see ongoing/recent events.
            'events' => $barangay->programs()
                ->where('kind', 'event')
                ->where(function ($q) {
                    $q->whereNull('starts_at')
                        ->orWhere('starts_at', '>=', now()->startOfMonth()->subMonths(1));
                })
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
