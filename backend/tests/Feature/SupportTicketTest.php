<?php

namespace Tests\Feature;

use App\Models\Barangay;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupportTicketTest extends TestCase
{
    use RefreshDatabase;

    private Barangay $barangay;
    private User $rep;
    private User $supervisor;
    private User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->barangay = Barangay::create(['name' => 'San Lorenzo', 'code' => 'SL']);

        $this->rep = User::create([
            'name' => 'Kagawad Juan',
            'email' => 'juan@makati.test',
            'password' => bcrypt('password'),
            'role' => 'barangay_rep',
            'barangay_id' => $this->barangay->id,
            'is_active' => true,
        ]);

        $this->supervisor = User::create([
            'name' => 'Officer Santos',
            'email' => 'santos@dilg.test',
            'password' => bcrypt('password'),
            'role' => 'office_supervisor',
            'is_active' => true,
        ]);

        $this->superAdmin = User::create([
            'name' => 'Admin Reyes',
            'email' => 'admin@dilg.test',
            'password' => bcrypt('password'),
            'role' => 'super_admin',
            'is_active' => true,
        ]);
    }

    public function test_barangay_rep_can_submit_concern_ticket_waiting_for_acceptance(): void
    {
        Sanctum::actingAs($this->rep);

        $response = $this->postJson('/api/support-tickets', [
            'category' => 'deadline_extension',
            'subject' => 'Request for BADAC Extension',
            'description' => 'Due to typhoon clean up, our council needs 3 extra days.',
            'priority' => 'urgent',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('support_tickets', [
            'barangay_id' => $this->barangay->id,
            'user_id' => $this->rep->id,
            'category' => 'deadline_extension',
            'status' => 'pending_acceptance',
        ]);

        $ticket = SupportTicket::first();

        // Rep cannot send additional chat messages until accepted
        $chatAttempt = $this->postJson("/api/support-tickets/{$ticket->id}/messages", [
            'message' => 'Hello, is anyone there?',
        ]);
        $chatAttempt->assertStatus(422);
    }

    public function test_dilg_officer_can_accept_communication_and_chat(): void
    {
        $ticket = SupportTicket::create([
            'ticket_number' => 'CR-2026-0001',
            'barangay_id' => $this->barangay->id,
            'user_id' => $this->rep->id,
            'category' => 'borms_reporting',
            'subject' => 'Submission Question',
            'description' => 'Need help with required annexes.',
            'priority' => 'normal',
            'status' => 'pending_acceptance',
        ]);

        // DILG officer accepts
        Sanctum::actingAs($this->supervisor);
        $acceptRes = $this->postJson("/api/support-tickets/{$ticket->id}/accept");
        $acceptRes->assertOk();

        $ticket->refresh();
        $this->assertSame('in_progress', $ticket->status);
        $this->assertSame($this->supervisor->id, $ticket->accepted_by);

        // Now officer and rep can chat
        $officerMsg = $this->postJson("/api/support-tickets/{$ticket->id}/messages", [
            'message' => 'Good day Kagawad, please upload Annex B under Section 3.',
        ]);
        $officerMsg->assertCreated();

        // Rep received notification from DILG officer
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->rep->id,
            'type' => 'ticket.message',
        ]);

        Sanctum::actingAs($this->rep);
        $repMsg = $this->postJson("/api/support-tickets/{$ticket->id}/messages", [
            'message' => 'Thank you Officer, will prepare Annex B now.',
        ]);
        $repMsg->assertCreated();

        // Supervisor received notification from Barangay Rep
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->supervisor->id,
            'type' => 'ticket.message',
        ]);

        $this->assertCount(3, $ticket->messages);
    }

    public function test_ticket_can_be_escalated_to_super_admin(): void
    {
        $ticket = SupportTicket::create([
            'ticket_number' => 'CR-2026-0002',
            'barangay_id' => $this->barangay->id,
            'user_id' => $this->rep->id,
            'category' => 'compliance_dispute',
            'subject' => 'Dispute on SGLGB Score',
            'description' => 'Disagreement on indicator verification.',
            'priority' => 'urgent',
            'status' => 'in_progress',
            'accepted_by' => $this->supervisor->id,
            'accepted_at' => now(),
        ]);

        // Rep or officer escalates to Super Admin
        Sanctum::actingAs($this->rep);
        $escalateRes = $this->postJson("/api/support-tickets/{$ticket->id}/escalate", [
            'escalation_reason' => 'Deadlock regarding Ordinance 2025-01 validity under national guidelines.',
        ]);

        $escalateRes->assertOk();
        $ticket->refresh();
        $this->assertSame('escalated', $ticket->status);
        $this->assertSame($this->rep->id, $ticket->escalated_by);

        // Super Admin resolves the escalated ticket
        Sanctum::actingAs($this->superAdmin);
        $resolveRes = $this->postJson("/api/support-tickets/{$ticket->id}/resolve", [
            'resolution_notes' => 'Executive review completed: Ordinance is compliant per Regional Advisory 12.',
        ]);

        $resolveRes->assertOk();
        $ticket->refresh();
        $this->assertSame('resolved', $ticket->status);
        $this->assertSame($this->superAdmin->id, $ticket->resolved_by);
    }
}

