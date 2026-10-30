<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Barangay;
use App\Models\RequirementAssignment;
use App\Models\Submission;
use App\Models\SupportTicket;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupervisorActionController extends Controller
{
    /**
     * Send one-click or bulk compliance reminders to barangays.
     */
    public function sendReminders(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'barangay_ids' => ['required'], // can be array or string 'all_pending'
            'title'        => ['required', 'string', 'max:150'],
            'message'      => ['required', 'string', 'max:1000'],
            'priority'     => ['nullable', 'string', 'in:normal,urgent'],
            'action_url'   => ['nullable', 'string', 'max:255'],
        ]);

        $targetIds = [];

        if ($validated['barangay_ids'] === 'all_pending' || (is_array($validated['barangay_ids']) && in_array('all_pending', $validated['barangay_ids'], true))) {
            // Find barangays that have pending, overdue, or non-compliant submissions
            $pendingSubBarangayIds = Submission::whereIn('status', ['pending', 'non_compliant'])
                ->pluck('barangay_id')
                ->unique()
                ->toArray();

            // Also check pending requirements
            $pendingReqBarangayIds = RequirementAssignment::whereIn('status', ['pending', 'non_compliant'])
                ->pluck('barangay_id')
                ->unique()
                ->toArray();

            $targetIds = array_values(array_unique(array_merge($pendingSubBarangayIds, $pendingReqBarangayIds)));

            // If empty, notify all active barangays
            if (empty($targetIds)) {
                $targetIds = Barangay::where('is_active', true)->pluck('id')->toArray();
            }
        } elseif (is_array($validated['barangay_ids'])) {
            $targetIds = array_map('intval', $validated['barangay_ids']);
        }

        if (empty($targetIds)) {
            return response()->json(['message' => 'No target barangays identified.'], 422);
        }

        $barangays = Barangay::whereIn('id', $targetIds)->get();
        $targetIds = $barangays->pluck('id')->toArray();

        $actionUrl = $validated['action_url'] ?? '/user/reports';
        $title = $validated['title'];
        $message = $validated['message'];

        // Send notifications to barangay representatives
        NotificationService::notifyBarangays(
            $targetIds,
            'compliance.reminder',
            $title,
            $message,
            $actionUrl,
            $request->user(),
            true
        );

        // Record supervisor action in audit trail
        ActivityLog::record('supervisor.reminders_sent', null, [
            'barangay_count' => count($targetIds),
            'barangay_names' => $barangays->pluck('name')->toArray(),
            'title'          => $title,
            'priority'       => $validated['priority'] ?? 'normal',
        ]);

        return response()->json([
            'success'        => true,
            'message'        => 'Compliance reminders successfully dispatched to ' . count($targetIds) . ' barangay(s).',
            'barangay_count' => count($targetIds),
            'target_names'   => $barangays->pluck('name')->toArray(),
        ]);
    }

    /**
     * Generate an executive compliance summary payload suitable for superiors and DILG Regional format.
     */
    public function complianceSummary(Request $request): JsonResponse
    {
        $allBarangays = Barangay::where('is_active', true)->orderBy('name')->get();
        $totalBarangays = $allBarangays->count();

        // Submissions statistics
        $compliantCount = Submission::where('status', 'compliant')->count();
        $underReviewCount = Submission::where('status', 'under_review')->count();
        $submittedCount = Submission::where('status', 'submitted')->count();
        $nonCompliantCount = Submission::where('status', 'non_compliant')->count();
        $pendingCount = Submission::where('status', 'pending')->count();

        $allSubmissions = Submission::with('category')->get();
        $overdueCount = $allSubmissions->filter(fn ($s) => $s->is_overdue)->count();

        $totalSubmissions = $compliantCount + $underReviewCount + $submittedCount + $nonCompliantCount + $pendingCount;
        $overallRate = $totalSubmissions > 0
            ? round(($compliantCount / $totalSubmissions) * 100)
            : 0;

        // Breakdown per barangay
        $breakdown = $allBarangays->map(function ($b) {
            $subs = Submission::where('barangay_id', $b->id)->get();
            $comp = $subs->where('status', 'compliant')->count();
            $rev = $subs->whereIn('status', ['submitted', 'under_review'])->count();
            $nonComp = $subs->where('status', 'non_compliant')->count();
            $pend = $subs->where('status', 'pending')->count();
            $over = $subs->filter(fn ($s) => $s->is_overdue)->count();
            $total = $subs->count();
            $rate = $total > 0 ? round(($comp / $total) * 100) : 0;

            return [
                'id'              => $b->id,
                'name'            => $b->name,
                'code'            => $b->code,
                'total'           => $total,
                'compliant'       => $comp,
                'under_review'    => $rev,
                'non_compliant'   => $nonComp,
                'pending'         => $pend,
                'overdue'         => $over,
                'compliance_rate' => $rate,
                'status_grade'    => $rate >= 80 ? 'High' : ($rate >= 50 ? 'Moderate' : 'Needs Action'),
            ];
        });

        // Group into high performers vs needs attention
        $highPerformers = $breakdown->filter(fn ($b) => $b['compliance_rate'] >= 80)->values();
        $needsAttention = $breakdown->filter(fn ($b) => $b['compliance_rate'] < 80 || $b['overdue'] > 0)->values();

        return response()->json([
            'generated_at'       => now()->toIso8601String(),
            'supervisor'         => [
                'name'     => $request->user()->name,
                'position' => $request->user()->position ?? 'DILG Field Officer / Supervisor',
                'office'   => 'DILG City Government of Makati Field Operations Office',
            ],
            'jurisdiction'       => 'City of Makati, Metro Manila',
            'total_barangays'    => $totalBarangays,
            'overall_rate'       => $overallRate,
            'kpis'               => [
                'compliant'     => $compliantCount,
                'under_review'  => $underReviewCount + $submittedCount,
                'non_compliant' => $nonCompliantCount,
                'pending'       => $pendingCount,
                'overdue'       => $overdueCount,
                'total_due'     => $totalSubmissions,
            ],
            'high_performers'    => $highPerformers,
            'needs_attention'    => $needsAttention,
            'barangays'          => $breakdown,
        ]);
    }

    /**
     * Retrieve a detailed compliance checklist and supervisory notes for a single barangay.
     */
    public function barangayChecklist(int $barangayId): JsonResponse
    {
        $barangay = Barangay::findOrFail($barangayId);

        $submissions = Submission::with('category')
            ->where('barangay_id', $barangayId)
            ->latest('due_date')
            ->get();

        $requirements = RequirementAssignment::with('requirement')
            ->where('barangay_id', $barangayId)
            ->latest()
            ->get();

        $openTickets = SupportTicket::where('barangay_id', $barangayId)
            ->whereIn('status', ['pending_acceptance', 'in_progress', 'escalated'])
            ->latest()
            ->get();

        // Supervisory field notes and visit logs
        $fieldNotes = ActivityLog::where('subject_type', Barangay::class)
            ->where('subject_id', $barangayId)
            ->where('action', 'supervisor.field_note')
            ->latest()
            ->limit(20)
            ->get()
            ->map(function ($log) {
                return [
                    'id'         => $log->id,
                    'created_at' => $log->created_at->toIso8601String(),
                    'meta'       => $log->meta,
                    'user'       => $log->user ? $log->user->name : 'DILG Supervisor',
                ];
            });

        $compCount = $submissions->where('status', 'compliant')->count();
        $totalSubs = $submissions->count();
        $rate = $totalSubs > 0 ? round(($compCount / $totalSubs) * 100) : 0;

        return response()->json([
            'barangay' => [
                'id'           => $barangay->id,
                'name'         => $barangay->name,
                'code'         => $barangay->code,
                'hall_address' => $barangay->hall_address,
                'hotline'      => $barangay->hotline,
                'office_hours' => $barangay->office_hours,
            ],
            'metrics'  => [
                'compliance_rate' => $rate,
                'compliant'       => $compCount,
                'pending'         => $submissions->where('status', 'pending')->count(),
                'under_review'    => $submissions->whereIn('status', ['submitted', 'under_review'])->count(),
                'non_compliant'   => $submissions->where('status', 'non_compliant')->count(),
                'overdue'         => $submissions->filter(fn ($s) => $s->is_overdue)->count(),
            ],
            'submissions'  => $submissions->map(function ($s) {
                return [
                    'id'              => $s->id,
                    'category_name'   => $s->category ? $s->category->name : 'Periodic Report',
                    'cycle'           => $s->category ? $s->category->cycle : 'monthly',
                    'period_label'    => $s->period_label,
                    'due_date'        => $s->due_date ? $s->due_date->toDateString() : null,
                    'status'          => $s->status,
                    'is_overdue'      => $s->is_overdue,
                    'review_remarks'  => $s->review_remarks,
                    'submitted_at'    => $s->submitted_at ? $s->submitted_at->toIso8601String() : null,
                ];
            }),
            'requirements' => $requirements->map(function ($r) {
                return [
                    'id'           => $r->id,
                    'title'        => $r->requirement ? $r->requirement->title : 'Office Directive',
                    'due_date'     => $r->requirement && $r->requirement->due_date ? $r->requirement->due_date->toDateString() : null,
                    'status'       => $r->status,
                    'submitted_at' => $r->submitted_at ? $r->submitted_at->toIso8601String() : null,
                ];
            }),
            'open_tickets' => $openTickets->map(function ($t) {
                return [
                    'id'            => $t->id,
                    'ticket_number' => $t->ticket_number,
                    'subject'       => $t->subject,
                    'priority'      => $t->priority,
                    'status'        => $t->status,
                    'created_at'    => $t->created_at->toIso8601String(),
                ];
            }),
            'field_notes'  => $fieldNotes,
        ]);
    }

    /**
     * Save an official field visit / inspection note for a barangay.
     */
    public function saveBarangayNote(Request $request, int $barangayId): JsonResponse
    {
        $barangay = Barangay::findOrFail($barangayId);

        $validated = $request->validate([
            'note'       => ['required', 'string', 'max:2000'],
            'category'   => ['nullable', 'string', 'in:field_inspection,follow_up,coordination,monitoring'],
            'visit_date' => ['nullable', 'date'],
        ]);

        $log = ActivityLog::record('supervisor.field_note', $barangay, [
            'note'       => $validated['note'],
            'category'   => $validated['category'] ?? 'field_inspection',
            'visit_date' => $validated['visit_date'] ?? now()->toDateString(),
            'supervisor' => $request->user()->name,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Supervisory field note recorded successfully.',
            'note'    => [
                'id'         => $log->id,
                'created_at' => $log->created_at->toIso8601String(),
                'meta'       => $log->meta,
                'user'       => $request->user()->name,
            ],
        ]);
    }
}

