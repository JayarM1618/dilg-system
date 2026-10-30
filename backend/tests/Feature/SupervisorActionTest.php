<?php

namespace Tests\Feature;

use App\Models\Barangay;
use App\Models\ReportCategory;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupervisorActionTest extends TestCase
{
    use RefreshDatabase;

    private Barangay $barangay;
    private User $rep;
    private User $supervisor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->barangay = Barangay::create([
            'name' => 'Poblacion',
            'code' => 'POB',
            'is_active' => true,
        ]);

        $this->rep = User::create([
            'name' => 'Kagawad Maria',
            'email' => 'maria@poblacion.test',
            'password' => bcrypt('password'),
            'role' => 'barangay_rep',
            'barangay_id' => $this->barangay->id,
            'is_active' => true,
        ]);

        $this->supervisor = User::create([
            'name' => 'Supervisor Gomez',
            'email' => 'gomez@dilg.test',
            'password' => bcrypt('password'),
            'role' => 'office_supervisor',
            'is_active' => true,
        ]);
    }

    public function test_supervisor_can_send_reminders_to_barangays(): void
    {
        Sanctum::actingAs($this->supervisor);

        $res = $this->postJson('/api/supervisor/send-reminders', [
            'barangay_ids' => [$this->barangay->id],
            'title' => 'Deadline Reminder: Monthly Financial Report',
            'message' => 'Please submit by Friday 5:00 PM.',
            'priority' => 'urgent',
        ]);

        $res->assertOk()
            ->assertJson([
                'success' => true,
                'barangay_count' => 1,
            ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->rep->id,
            'type' => 'compliance.reminder',
            'title' => 'Deadline Reminder: Monthly Financial Report',
        ]);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'supervisor.reminders_sent',
        ]);
    }

    public function test_supervisor_can_retrieve_compliance_summary(): void
    {
        Sanctum::actingAs($this->supervisor);

        $res = $this->getJson('/api/supervisor/compliance-summary');

        $res->assertOk()
            ->assertJsonStructure([
                'generated_at',
                'supervisor',
                'total_barangays',
                'overall_rate',
                'kpis',
                'high_performers',
                'needs_attention',
                'barangays',
            ]);
    }

    public function test_supervisor_can_view_barangay_checklist_and_record_notes(): void
    {
        Sanctum::actingAs($this->supervisor);

        $checklistRes = $this->getJson("/api/supervisor/checklist/{$this->barangay->id}");
        $checklistRes->assertOk()
            ->assertJsonStructure([
                'barangay',
                'metrics',
                'submissions',
                'requirements',
                'open_tickets',
                'field_notes',
            ]);

        $noteRes = $this->postJson("/api/supervisor/checklist/{$this->barangay->id}/notes", [
            'note' => 'Field inspection conducted: validated BDRRM logbooks and equipment inventory.',
            'category' => 'field_inspection',
            'visit_date' => now()->toDateString(),
        ]);

        $noteRes->assertOk()
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'supervisor.field_note',
            'subject_id' => $this->barangay->id,
        ]);
    }
}

