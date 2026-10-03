<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Barangay;
use App\Models\SecurityIncident;
use App\Models\Submission;
use Illuminate\Http\Request;

/**
 * REPORTS of the 3 Rs: compliance reporting for the office, CSV export,
 * a security-incident summary, and the audit trail.
 */
class ReportController extends Controller
{
    /** Periods that exist, newest first - feeds the period picker. */
    public function periods()
    {
        $rows = Submission::selectRaw('period_label, min(period_start) as period_start, max(due_date) as due_date')
            ->groupBy('period_label')
            ->orderByDesc('period_start')
            ->get();

        return response()->json(['data' => $rows]);
    }

    /** Compliance numbers for one period (default: newest), optionally one report category. */
    public function compliance(Request $request)
    {
        [$period, $rows] = $this->rowsFor($request);

        $barangays = Barangay::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code'])->keyBy('id');

        $statusCounts = collect(['pending', 'submitted', 'under_review', 'compliant', 'non_compliant'])
            ->mapWithKeys(fn ($s) => [$s => $rows->where('status', $s)->count()]);

        $filed = $rows->whereNotIn('status', ['pending']);
        $overdue = $rows->filter(fn ($s) => $s->status === 'pending' && $s->isLate());

        $byBarangay = $rows->groupBy('barangay_id')->map(function ($group, $id) use ($barangays) {
            $b = $barangays->get($id);

            return [
                'barangay' => $b ? ['id' => $b->id, 'name' => $b->name, 'code' => $b->code] : ['id' => $id, 'name' => 'Unknown', 'code' => ''],
                'total' => $group->count(),
                'compliant' => $group->where('status', 'compliant')->count(),
                'non_compliant' => $group->where('status', 'non_compliant')->count(),
                'awaiting_review' => $group->whereIn('status', ['submitted', 'under_review'])->count(),
                'not_filed' => $group->where('status', 'pending')->count(),
                'overdue' => $group->filter(fn ($s) => $s->status === 'pending' && $s->isLate())->count(),
                'compliance_rate' => $group->count() ? round($group->where('status', 'compliant')->count() / $group->count() * 100, 1) : 0,
            ];
        })->sortBy(fn ($r) => $r['barangay']['name'])->values();

        return response()->json([
            'period_label' => $period,
            'totals' => $statusCounts->all() + [
                'total' => $rows->count(),
                'overdue' => $overdue->count(),
                'late_filed' => $filed->filter->isLate()->count(),
                'compliance_rate' => $rows->count() ? round($statusCounts['compliant'] / $rows->count() * 100, 1) : 0,
                'filing_rate' => $rows->count() ? round($filed->count() / $rows->count() * 100, 1) : 0,
            ],
            'by_barangay' => $byBarangay,
            'overdue' => $overdue->map(fn ($s) => [
                'id' => $s->id,
                'barangay' => $s->barangay->name,
                'category' => $s->category->name,
                'due_date' => $s->due_date->toDateString(),
            ])->values(),
        ]);
    }

    /** CSV download of the same data, one line per barangay x report. */
    public function exportCompliance(Request $request)
    {
        [$period, $rows] = $this->rowsFor($request);

        ActivityLog::record('report.exported', null, ['report' => 'compliance', 'period' => $period]);

        $filename = 'compliance-' . preg_replace('/[^A-Za-z0-9_-]/', '', (string) $period) . '.csv';

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // so Excel reads UTF-8 (e.g. Dasmariñas)

            fputcsv($out, ['Barangay', 'Code', 'Report', 'Cycle', 'Period', 'Due date', 'Status', 'Submitted at', 'Late', 'Reviewed by', 'Remarks']);

            foreach ($rows as $s) {
                fputcsv($out, array_map([$this, 'csvSafe'], [
                    $s->barangay->name,
                    $s->barangay->code,
                    $s->category->name,
                    $s->category->cycle,
                    $s->period_label,
                    $s->due_date->toDateString(),
                    $s->status,
                    $s->submitted_at?->toDateTimeString() ?? '',
                    $s->isLate() ? 'Yes' : 'No',
                    $s->reviewer?->name ?? '',
                    $s->review_remarks ?? '',
                ]));
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** Security reporting summary: what was reported, how fast the office reacted. */
    public function security()
    {
        $incidents = SecurityIncident::all();

        $open = $incidents->whereIn('status', ['reported', 'acknowledged', 'escalated_to_icto']);

        $hours = $incidents->filter(fn ($i) => $i->acknowledged_at)
            ->map(fn ($i) => $i->created_at->diffInMinutes($i->acknowledged_at) / 60);

        return response()->json([
            'total' => $incidents->count(),
            'open' => $open->count(),
            'unacknowledged_over_24h' => $incidents->where('status', 'reported')
                ->filter(fn ($i) => $i->created_at->lt(now()->subDay()))->count(),
            'avg_hours_to_acknowledge' => $hours->isNotEmpty() ? round($hours->avg(), 1) : null,
            'by_type' => $incidents->groupBy('type')->map->count(),
            'by_severity' => $incidents->groupBy('severity')->map->count(),
            'by_status' => $incidents->groupBy('status')->map->count(),
        ]);
    }

    /** Audit trail - super admin only (enforced in routes). */
    public function auditLogs(Request $request)
    {
        $query = \App\Models\ActivityLog::with('user:id,name,role')->latest('id');

        if ($action = $request->query('action')) {
            $query->where('action', 'like', str_replace(['%', '_'], ['\%', '\_'], $action) . '%');
        }
        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }
        if ($from = $request->query('from')) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        return $query->paginate(50);
    }

    /** @return array{0:?string,1:\Illuminate\Support\Collection} */
    private function rowsFor(Request $request): array
    {
        $period = $request->query('period_label')
            ?: Submission::orderByDesc('period_start')->value('period_label');

        $rows = Submission::with(['barangay:id,name,code', 'category:id,name,cycle', 'reviewer:id,name'])
            ->whereHas('barangay', fn ($q) => $q->where('is_active', true))
            ->when($period, fn ($q) => $q->where('period_label', $period))
            ->when($request->query('report_category_id'), fn ($q, $id) => $q->where('report_category_id', $id))
            ->get()
            ->sortBy(fn ($s) => $s->barangay->name . $s->category->name)
            ->values();

        return [$period, $rows];
    }

    /** Stop spreadsheet formula injection (a remark starting with "=" would run in Excel). */
    private function csvSafe($value): string
    {
        $value = (string) $value;

        return preg_match('/^[=+\-@\t\r]/', $value) ? "'" . $value : $value;
    }
}
