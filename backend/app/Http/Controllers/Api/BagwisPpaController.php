<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BagwisPpa;
use App\Models\BagwisPpaEntry;
use Illuminate\Http\Request;

/**
 * BAGWIS PPAs — city-level programs tracked by DILG Makati.
 *
 * Everyone can read; only office staff can create entries and review.
 * Barangay reps get VIEW-ONLY access (enforced by bagwis.readonly middleware).
 */
class BagwisPpaController extends Controller
{
    /** List all active PPAs with their latest entry status. */
    public function index()
    {
        return BagwisPpa::where('is_active', true)
            ->orderBy('sort_order')
            ->get();
    }

    /** List entries for a specific PPA, optionally filtered by period. */
    public function entries(Request $request, BagwisPpa $ppa)
    {
        $query = $ppa->entries()->with(['submitter:id,name', 'reviewer:id,name']);

        if ($period = $request->query('period_label')) {
            $query->where('period_label', $period);
        }

        return $query->orderByDesc('created_at')->paginate(15);
    }

    /** Office creates or updates an entry for a PPA period. */
    public function storeEntry(Request $request, BagwisPpa $ppa)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $data = $request->validate([
            'period_label' => ['required', 'string', 'max:40'],
            'status'       => ['required', 'in:pending,submitted,compliant,non_compliant'],
            'remarks'      => ['nullable', 'string', 'max:2000'],
        ]);

        $entry = BagwisPpaEntry::updateOrCreate(
            [
                'bagwis_ppa_id' => $ppa->id,
                'period_label'  => $data['period_label'],
            ],
            [
                'status'       => $data['status'],
                'remarks'      => $data['remarks'] ?? null,
                'submitted_by' => $request->user()->id,
                'submitted_at' => now(),
            ]
        );

        return response()->json($entry->load(['submitter:id,name']), 201);
    }

    /** Office reviews/updates an entry's status. */
    public function reviewEntry(Request $request, BagwisPpaEntry $entry)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $data = $request->validate([
            'status'  => ['required', 'in:compliant,non_compliant'],
            'remarks' => ['nullable', 'string', 'max:2000'],
        ]);

        $entry->update([
            'status'      => $data['status'],
            'remarks'     => $data['remarks'] ?? $entry->remarks,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return $entry->load(['submitter:id,name', 'reviewer:id,name']);
    }
}
