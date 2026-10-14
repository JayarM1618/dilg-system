<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Barangay;
use App\Models\Requirement;
use App\Models\RequirementAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** DILG sends requirements; barangays comply; DILG tracks and reviews; roles stay separate. */
class RequirementsTest extends TestCase
{
    use RefreshDatabase;

    private Barangay $a;
    private Barangay $b;
    private User $admin;
    private User $sup;
    private User $repA;
    private User $repB;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->a = Barangay::create(['name' => 'Alpha', 'code' => 'BGY-A']);
        $this->b = Barangay::create(['name' => 'Beta', 'code' => 'BGY-B']);
        $mk = function ($n, $role, $bgy = null) {
            $u = User::create(['name' => $n, 'email' => "$n@test.local", 'password' => 'secret-pass-123', 'role' => $role, 'barangay_id' => $bgy?->id, 'is_active' => true]);
            $u->forceFill(['activated_at' => now()])->save();

            return $u;
        };
        $this->admin = $mk('admin', 'super_admin');
        $this->sup = $mk('sup', 'office_supervisor');
        $this->repA = $mk('repa', 'barangay_rep', $this->a);
        $this->repB = $mk('repb', 'barangay_rep', $this->b);
    }

    private function pdf(string $name = 'f.pdf'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, "%PDF-1.4\nx\n%%EOF");
    }

    private function send(array $extra = [])
    {
        Sanctum::actingAs($this->sup);

        return $this->post('/api/requirements', $extra + [
            'title' => 'Submit your SK roster',
            'kind' => 'report',
            'audience' => 'all',
            'files' => [$this->pdf('template.pdf')],
        ], ['Accept' => 'application/json']);
    }

    public function test_supervisor_sends_to_all_barangays_and_each_receives_it(): void
    {
        $id = $this->send()->assertCreated()->json('id');
        $this->assertSame(2, RequirementAssignment::where('requirement_id', $id)->where('status', 'pending')->count());

        Sanctum::actingAs($this->repA);
        $this->getJson('/api/requirements')->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.requirement.title', 'Submit your SK roster');
        $this->getJson('/api/requirements/summary')->assertJsonPath('to_do', 1);
    }

    public function test_selected_audience_only_reaches_chosen_barangays(): void
    {
        $this->send(['audience' => 'selected', 'barangay_ids' => [$this->a->id]])->assertCreated();

        Sanctum::actingAs($this->repB);
        $this->getJson('/api/requirements')->assertOk()->assertJsonCount(0, 'data');
        $req = Requirement::first();
        $this->getJson('/api/requirements/' . $req->id)->assertNotFound();
        $this->get('/api/requirements/' . $req->id . '/files/' . $req->files()->first()->id . '/download')->assertNotFound();
    }

    public function test_selected_requires_barangays(): void
    {
        $this->send(['audience' => 'selected'])->assertStatus(422);
    }

    public function test_barangay_rep_cannot_send_or_track(): void
    {
        Sanctum::actingAs($this->repA);
        $this->postJson('/api/requirements', ['title' => 'x', 'kind' => 'file', 'audience' => 'all'])->assertForbidden();
        $this->getJson('/api/requirements/tracker')->assertForbidden();
    }

    public function test_download_marks_received_then_compliance_flow_to_complied(): void
    {
        $this->send()->assertCreated();
        $req = Requirement::first();
        $file = $req->files()->first();

        Sanctum::actingAs($this->repA);
        $this->get("/api/requirements/{$req->id}/files/{$file->id}/download")->assertOk();
        $this->assertSame('received', RequirementAssignment::where('barangay_id', $this->a->id)->first()->status);

        $this->post("/api/requirements/{$req->id}/respond", ['note' => 'Done', 'files' => [$this->pdf('roster.pdf')]], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('assignment.status', 'submitted');

        $this->post("/api/requirements/{$req->id}/respond", ['files' => [$this->pdf()]], ['Accept' => 'application/json'])->assertStatus(422);

        $assignment = RequirementAssignment::where('barangay_id', $this->a->id)->first();
        $this->patchJson("/api/requirement-assignments/{$assignment->id}/review", ['decision' => 'complied'])->assertForbidden();

        Sanctum::actingAs($this->sup);
        $this->patchJson("/api/requirement-assignments/{$assignment->id}/review", ['decision' => 'revision'])->assertStatus(422);
        $this->patchJson("/api/requirement-assignments/{$assignment->id}/review", ['decision' => 'revision', 'notes' => 'Missing page 2'])
            ->assertOk()->assertJsonPath('status', 'revision');

        Sanctum::actingAs($this->repA);
        $this->post("/api/requirements/{$req->id}/respond", ['files' => [$this->pdf('v2.pdf')]], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('assignment.status', 'submitted');

        Sanctum::actingAs($this->sup);
        $this->patchJson("/api/requirement-assignments/{$assignment->id}/review", ['decision' => 'complied'])->assertOk()->assertJsonPath('status', 'complied');

        $tracker = $this->getJson('/api/requirements/tracker')->assertOk()->json('data');
        $alpha = collect($tracker)->firstWhere('barangay', 'Alpha');
        $beta = collect($tracker)->firstWhere('barangay', 'Beta');
        $this->assertSame(100, $alpha['percent']);
        $this->assertSame(0, $beta['percent']);
        $this->assertSame(1, $beta['waiting']);

        $detail = $this->getJson("/api/requirements/{$req->id}")->assertOk()->json();
        $this->assertCount(2, $detail['assignments']);

        $resp = $assignment->responses()->whereNotNull('path')->first();
        $this->get("/api/requirement-responses/{$resp->id}/download")->assertOk();
        Sanctum::actingAs($this->repB);
        $this->get("/api/requirement-responses/{$resp->id}/download")->assertNotFound();
    }

    public function test_acknowledge_only_requirement_completes_without_a_file(): void
    {
        $this->send(['requires_response' => 0, 'kind' => 'memo'])->assertCreated();
        $req = Requirement::first();

        Sanctum::actingAs($this->repA);
        $this->postJson("/api/requirements/{$req->id}/respond", [])->assertOk()->assertJsonPath('assignment.status', 'complied');
    }

    public function test_file_is_required_when_a_response_is_expected(): void
    {
        $this->send()->assertCreated();
        Sanctum::actingAs($this->repA);
        $this->postJson('/api/requirements/' . Requirement::first()->id . '/respond', [])->assertStatus(422);
    }

    public function test_closed_requirement_rejects_responses_and_overdue_is_flagged(): void
    {
        $this->send(['due_date' => now()->addDay()->toDateString()])->assertCreated();
        $req = Requirement::first();
        $req->update(['due_date' => now()->subDays(3)->toDateString()]);

        Sanctum::actingAs($this->repA);
        $this->getJson('/api/requirements')->assertJsonPath('data.0.is_overdue', true);
        $this->getJson('/api/requirements/summary')->assertJsonPath('overdue', 1);

        Sanctum::actingAs($this->sup);
        $this->postJson("/api/requirements/{$req->id}/close")->assertOk();

        Sanctum::actingAs($this->repA);
        $this->post("/api/requirements/{$req->id}/respond", ['files' => [$this->pdf()]], ['Accept' => 'application/json'])->assertStatus(422);
    }

    public function test_only_super_admin_can_delete_and_everything_is_logged(): void
    {
        $this->send()->assertCreated();
        $req = Requirement::first();

        Sanctum::actingAs($this->sup);
        $this->deleteJson("/api/requirements/{$req->id}")->assertForbidden();

        Sanctum::actingAs($this->admin);
        $this->getJson('/api/requirements')->assertOk()->assertJsonCount(1, 'data');
        $this->deleteJson("/api/requirements/{$req->id}")->assertNoContent();
        $this->assertSame(0, Requirement::count());
        $this->assertSame(0, RequirementAssignment::count());

        $this->assertTrue(ActivityLog::where('action', 'requirement.sent')->exists());
        $this->assertTrue(ActivityLog::where('action', 'requirement.deleted')->exists());
        $this->getJson('/api/monitoring/activity')->assertOk();
    }

    public function test_supervisor_cannot_use_super_admin_areas(): void
    {
        Sanctum::actingAs($this->sup);
        $this->getJson('/api/users')->assertForbidden();
        $this->getJson('/api/monitoring/summary')->assertForbidden();
        $this->postJson('/api/barangays', ['name' => 'X', 'code' => 'X'])->assertForbidden();
    }
}
