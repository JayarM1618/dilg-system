<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SupportTicketController extends Controller
{
    private function canAccess(Request $request, SupportTicket $ticket): bool
    {
        $user = $request->user();

        if ($user->hasOfficeOversight()) {
            return true;
        }

        if ($user->isBarangayRep()) {
            return (int) $user->barangay_id === (int) $ticket->barangay_id
                || (int) $user->id === (int) $ticket->user_id;
        }

        return (int) $user->id === (int) $ticket->user_id;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = SupportTicket::with([
            'barangay:id,name,code',
            'creator:id,name,role',
            'acceptedBy:id,name,role',
            'escalatedBy:id,name,role',
            'resolvedBy:id,name,role',
        ])->withCount('messages');

        if ($user->isBarangayRep()) {
            $query->where(function ($q) use ($user) {
                if ($user->barangay_id) {
                    $q->where('barangay_id', $user->barangay_id);
                } else {
                    $q->where('user_id', $user->id);
                }
            });
        } elseif (!$user->hasOfficeOversight()) {
            $query->where('user_id', $user->id);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }

        if ($priority = $request->input('priority')) {
            $query->where('priority', $priority);
        }

        $tickets = $query->orderByDesc('id')->paginate(30);

        return response()->json($tickets);
    }

    public function show(Request $request, SupportTicket $ticket)
    {
        abort_unless($this->canAccess($request, $ticket), 403, 'Unauthorized access to this concern ticket.');

        $ticket->load([
            'barangay:id,name,code',
            'creator:id,name,role',
            'acceptedBy:id,name,role',
            'escalatedBy:id,name,role',
            'resolvedBy:id,name,role',
            'messages.user:id,name,role',
        ]);

        return response()->json($ticket);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'category' => ['required', 'string', Rule::in(array_keys(SupportTicket::CATEGORIES))],
            'subject' => ['required', 'string', 'max:200'],
            'description' => ['required', 'string', 'max:5000'],
            'priority' => ['sometimes', 'string', Rule::in(SupportTicket::PRIORITIES)],
        ]);

        // Generate unique readable ticket number e.g. CR-2026-0042
        $countThisYear = SupportTicket::whereYear('created_at', now()->year)->count() + 1;
        $ticketNumber = sprintf('CR-%d-%04d', now()->year, $countThisYear);

        $ticket = SupportTicket::create([
            'ticket_number' => $ticketNumber,
            'barangay_id' => $user->barangay_id ?? null,
            'user_id' => $user->id,
            'category' => $data['category'],
            'subject' => $data['subject'],
            'description' => $data['description'],
            'priority' => $data['priority'] ?? 'normal',
            'status' => 'pending_acceptance',
        ]);

        // Create the initial message
        $ticket->messages()->create([
            'user_id' => $user->id,
            'message' => $data['description'],
        ]);

        ActivityLog::record('ticket.created', $ticket, [
            'ticket_number' => $ticket->ticket_number,
            'subject' => $ticket->subject,
            'barangay_id' => $ticket->barangay_id,
        ]);

        // 🔔 NOTIFICATION: Notify all DILG Office staff of incoming concern request
        NotificationService::notifyOffice(
            'ticket.created',
            'New Concern from Barangay ' . ($user->barangay?->name ?? 'Representative'),
            "{$user->name}: {$ticket->subject} ({$ticket->ticket_number})",
            "/borms?ticket={$ticket->id}",
            $user,
            false
        );

        $ticket->load([
            'barangay:id,name,code',
            'creator:id,name,role',
            'messages.user:id,name,role',
        ]);

        return response()->json($ticket, 201);
    }

    /**
     * DILG Representative accepts the communication request from the barangay representative.
     */
    public function accept(Request $request, SupportTicket $ticket)
    {
        $user = $request->user();
        abort_unless($user->hasOfficeOversight(), 403, 'Only DILG officers may accept communication requests.');

        if ($ticket->status !== 'pending_acceptance') {
            return response()->json([
                'message' => "This communication request is already {$ticket->status}.",
            ], 422);
        }

        $ticket->update([
            'status' => 'in_progress',
            'accepted_by' => $user->id,
            'accepted_at' => now(),
        ]);

        // System notification message in the thread
        $ticket->messages()->create([
            'user_id' => $user->id,
            'message' => "🤝 DILG Officer {$user->name} has accepted this communication request. The official discussion channel is now open.",
        ]);

        ActivityLog::record('ticket.accepted', $ticket, [
            'ticket_number' => $ticket->ticket_number,
            'accepted_by' => $user->id,
        ]);

        // 🔔 NOTIFICATION: Notify the Barangay Representative that communication has been accepted
        if ($ticket->creator) {
            NotificationService::send(
                $ticket->creator,
                'ticket.accepted',
                "Communication Accepted: {$ticket->ticket_number}",
                "DILG Officer {$user->name} accepted your communication request. Discussion channel is now open.",
                "/borms?ticket={$ticket->id}",
                $user,
                false
            );
        }

        $ticket->load([
            'barangay:id,name,code',
            'creator:id,name,role',
            'acceptedBy:id,name,role',
            'messages.user:id,name,role',
        ]);

        return response()->json($ticket);
    }

    /**
     * Either the Barangay Rep or the DILG Officer can escalate to Super Admin
     * when encountering an unresolved dispute or problem.
     */
    public function escalate(Request $request, SupportTicket $ticket)
    {
        abort_unless($this->canAccess($request, $ticket), 403, 'Unauthorized.');

        $data = $request->validate([
            'escalation_reason' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        if (in_array($ticket->status, ['resolved', 'closed'], true)) {
            return response()->json(['message' => 'Cannot escalate a closed or resolved concern.'], 422);
        }

        $user = $request->user();
        $ticket->update([
            'status' => 'escalated',
            'escalated_by' => $user->id,
            'escalation_reason' => $data['escalation_reason'],
            'escalated_at' => now(),
        ]);

        $roleLabel = $user->isSuperAdmin() ? 'Super Admin' : ($user->isOfficeSupervisor() ? 'DILG Officer' : 'Barangay Representative');

        $ticket->messages()->create([
            'user_id' => $user->id,
            'message' => "⚠️ ESCALATED TO SUPER ADMIN by {$user->name} ({$roleLabel}):\n\nReason: {$data['escalation_reason']}",
            'is_escalation_note' => true,
        ]);

        ActivityLog::record('ticket.escalated', $ticket, [
            'ticket_number' => $ticket->ticket_number,
            'escalated_by' => $user->id,
            'reason' => $data['escalation_reason'],
        ]);

        // 🔔 NOTIFICATION 1: Notify all Super Admins
        $superAdmins = User::where('is_active', true)->where('role', 'super_admin')->get();
        NotificationService::send(
            $superAdmins,
            'ticket.escalated',
            "🚨 Concern Escalated to Super Admin: {$ticket->ticket_number}",
            "{$user->name} ({$roleLabel}) escalated '{$ticket->subject}': " . Str::limit($data['escalation_reason'], 80),
            "/borms?ticket={$ticket->id}",
            $user,
            false
        );

        // 🔔 NOTIFICATION 2: Notify the Barangay Rep if not the one escalating
        if ($ticket->creator && $ticket->creator->id !== $user->id) {
            NotificationService::send(
                $ticket->creator,
                'ticket.escalated',
                "Concern Escalated to Super Admin: {$ticket->ticket_number}",
                "{$user->name} escalated this concern to the Super Admin for executive intervention.",
                "/borms?ticket={$ticket->id}",
                $user,
                false
            );
        }

        // 🔔 NOTIFICATION 3: Notify the accepted DILG officer if not the one escalating
        if ($ticket->acceptedBy && $ticket->acceptedBy->id !== $user->id) {
            NotificationService::send(
                $ticket->acceptedBy,
                'ticket.escalated',
                "Concern Escalated by Barangay: {$ticket->ticket_number}",
                "{$user->name} escalated concern '{$ticket->subject}' to the Super Admin.",
                "/borms?ticket={$ticket->id}",
                $user,
                false
            );
        }

        $ticket->load([
            'barangay:id,name,code',
            'creator:id,name,role',
            'acceptedBy:id,name,role',
            'escalatedBy:id,name,role',
            'messages.user:id,name,role',
        ]);

        return response()->json($ticket);
    }

    /**
     * Mark the concern resolved with resolution summary remarks.
     */
    public function resolve(Request $request, SupportTicket $ticket)
    {
        $user = $request->user();
        abort_unless($this->canAccess($request, $ticket), 403, 'Unauthorized.');

        // If ticket is escalated, Super Admin or Office Supervisor can resolve
        if ($ticket->status === 'escalated' && !$user->hasOfficeOversight()) {
            abort(403, 'This concern is currently escalated to the Super Admin.');
        }

        $data = $request->validate([
            'resolution_notes' => ['required', 'string', 'min:5', 'max:3000'],
        ]);

        $ticket->update([
            'status' => 'resolved',
            'resolved_by' => $user->id,
            'resolution_notes' => $data['resolution_notes'],
            'resolved_at' => now(),
        ]);

        $ticket->messages()->create([
            'user_id' => $user->id,
            'message' => "✅ CONCERN RESOLVED by {$user->name}:\n\n{$data['resolution_notes']}",
        ]);

        ActivityLog::record('ticket.resolved', $ticket, [
            'ticket_number' => $ticket->ticket_number,
            'resolved_by' => $user->id,
        ]);

        // 🔔 NOTIFICATION: Notify the Barangay Rep of resolution
        $roleLabel = $user->isSuperAdmin() ? 'Super Admin' : 'DILG Officer';
        if ($ticket->creator && $ticket->creator->id !== $user->id) {
            NotificationService::send(
                $ticket->creator,
                'ticket.resolved',
                "✅ Concern Resolved: {$ticket->ticket_number}",
                "{$user->name} ({$roleLabel}) resolved your concern: " . Str::limit($data['resolution_notes'], 100),
                "/borms?ticket={$ticket->id}",
                $user,
                false
            );
        }

        $ticket->load([
            'barangay:id,name,code',
            'creator:id,name,role',
            'acceptedBy:id,name,role',
            'escalatedBy:id,name,role',
            'resolvedBy:id,name,role',
            'messages.user:id,name,role',
        ]);

        return response()->json($ticket);
    }

    /**
     * Post a reply to an ongoing ticket.
     * Generates real-time notifications for both parties (vice versa).
     */
    public function reply(Request $request, SupportTicket $ticket)
    {
        abort_unless($this->canAccess($request, $ticket), 403, 'Unauthorized.');

        if ($ticket->status === 'pending_acceptance') {
            return response()->json([
                'message' => 'Please wait for a DILG officer to accept the communication request before continuing.',
            ], 422);
        }

        if (in_array($ticket->status, ['resolved', 'closed'], true)) {
            return response()->json(['message' => 'This concern thread is resolved.'], 422);
        }

        $data = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $sender = $request->user();

        $msg = $ticket->messages()->create([
            'user_id' => $sender->id,
            'message' => $data['message'],
        ]);

        $trimmedText = Str::limit($data['message'], 100);

        // 🔔 NOTIFICATION: Vice Versa Communication Alerts
        if ($sender->hasOfficeOversight()) {
            // Case A: DILG Supervisor or Super Admin chatted -> Notify Barangay Representative!
            $roleLabel = $sender->isSuperAdmin() ? 'Super Admin' : 'DILG Officer';
            if ($ticket->creator && $ticket->creator->id !== $sender->id) {
                NotificationService::send(
                    $ticket->creator,
                    'ticket.message',
                    "New Message from {$roleLabel} ({$ticket->ticket_number})",
                    "{$sender->name}: {$trimmedText}",
                    "/borms?ticket={$ticket->id}",
                    $sender,
                    false
                );
            }
        } else {
            // Case B: Barangay Representative chatted -> Notify DILG Supervisor / Super Admin!
            $bgyName = $ticket->barangay?->name ?? 'Representative';
            $recipients = collect();

            if ($ticket->acceptedBy && $ticket->acceptedBy->id !== $sender->id) {
                $recipients->push($ticket->acceptedBy);
            }

            if ($ticket->status === 'escalated') {
                $superAdmins = User::where('is_active', true)->where('role', 'super_admin')->get();
                $recipients = $recipients->merge($superAdmins);
            }

            if ($recipients->isEmpty()) {
                NotificationService::notifyOffice(
                    'ticket.message',
                    "New Message from Barangay {$bgyName} ({$ticket->ticket_number})",
                    "{$sender->name}: {$trimmedText}",
                    "/borms?ticket={$ticket->id}",
                    $sender,
                    false
                );
            } else {
                NotificationService::send(
                    $recipients->unique('id'),
                    'ticket.message',
                    "New Message from Barangay {$bgyName} ({$ticket->ticket_number})",
                    "{$sender->name}: {$trimmedText}",
                    "/borms?ticket={$ticket->id}",
                    $sender,
                    false
                );
            }
        }

        $msg->load('user:id,name,role');

        return response()->json($msg, 201);
    }
}
