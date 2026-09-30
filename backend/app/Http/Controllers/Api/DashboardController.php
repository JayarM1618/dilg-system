<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barangay;
use App\Models\Submission;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Consolidated "Talaghayan" view: one row per barangay, one column per report
     * category, with a live-computed status - no manual 1/0 spreadsheet encoding.
     * Office-side only.
     */
    public function talaghayan(Request $request)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $barangays = Barangay::where('is_active', true)->orderBy('name')->get();

        $submissions = Submission::with('category')
            ->when($request->query('period_label'), fn ($q, $period) => $q->where('period_label', $period))
            ->get()
            ->groupBy('barangay_id');

        $grid = $barangays->map(function ($barangay) use ($submissions) {
            $rows = $submissions->get($barangay->id, collect());

            return [
                'barangay' => ['id' => $barangay->id, 'name' => $barangay->name, 'code' => $barangay->code],
                'submissions' => $rows->map(fn ($s) => [
                    'category' => $s->category->name,
                    'cycle' => $s->category->cycle,
                    'period_label' => $s->period_label,
                    'status' => $s->status,
                    'is_late' => $s->isLate(),
                ]),
                'compliance_rate' => $rows->count()
                    ? round($rows->where('status', 'compliant')->count() / $rows->count() * 100, 1)
                    : 0,
            ];
        });

        return response()->json(['data' => $grid]);
    }

    /** Quick summary counters for the top of the dashboard. */
    public function summary(Request $request)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        return response()->json([
            'total_barangays' => Barangay::where('is_active', true)->count(),
            'pending' => Submission::where('status', 'pending')->count(),
            'submitted' => Submission::where('status', 'submitted')->count(),
            'compliant' => Submission::where('status', 'compliant')->count(),
            'non_compliant' => Submission::where('status', 'non_compliant')->count(),
        ]);
    }
}
