<?php

namespace Tests\Feature;

use App\Models\Barangay;
use App\Models\ReportCategory;
use App\Models\Resource;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThreeRsTest extends TestCase
{
    use RefreshDatabase;

    private Barangay $bgyA;
    private Barangay $bgyB;
    private ReportCategory $category;
    private User $admin;
    private User $supervisor;
    private User $repA;
    private User $repB;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->bgyA = Barangay::create(['name' => 'Alpha', 'code' => 'BGY-A']);
        $this->bgyB = Barangay::create(['name' => 'Bravo', 'code' => 'BGY-B']);
        $this->category = ReportCategory::create(['name' => 'Monthly Accomplishment Report', 'cycle' => 'monthly']);

        $make = fn ($n, $role, $bgy = null) => User::create([
            'name' => $n, 'email' => "$n@test.local", 'password' => 'secret-pass-123',
            'role' => $role, 'barangay_id' => $bgy?->id, 'is_active' => true,
        ]);
        $this->admin = $make('admin', 'super_admin');
        $this->supervisor = $make('sup', 'office_supervisor');
        $this->repA = $make('repa', 'barangay_rep', $this->bgyA);
        $this->repB = $make('repb', 'barangay_rep', $this->bgyB);
    }

    private function openPeriod(Barangay $b, string $status = 'pending'): Submission
    {
        return Submission::create([
            'barangay_id' => $b->id, 'report_category_id' => $this->category->id,
            'period_label' => '2026-09', 'period_start' => '2026-09-01', 'period_end' => '2026-09-30',
            'due_date' => '2026-10-05', 'status' => $status,
        ]);
    }

    private function pdf(string $name = 'report.pdf', string $body = 'x'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, "%PDF-1.4\n{$body}\n%%EOF");
    }

    private function upload(User $u, array $over = [])
    {
        Sanctum::actingAs($u);

        return $this->post('/api/submissions', $over + [
            'report_category_id' => $this->category->id,
            'period_label' => '2026-09',
            'file' => $this->pdf(),
        ], ['Accept' => 'application/json']);
    }

    // ---------------- Repository ----------------

    public function test_upload_stores_a_version_with_checksum_and_marks_submitted(): void
    {
        $this->openPeriod($this->bgyA);

        $this->upload($this->repA)->assertCreated();

        $s = Submission::first();
        $this->assertSame('submitted', $s->status);
        $this->assertSame(1, $s->files()->count());
        $this->assertSame(64, strlen($s->files()->first()->sha256));
        Storage::disk('local')->assertExists($s->files()->first()->path);
    }

    public function test_reupload_creates_version_2_and_keeps_version_1(): void
    {
        $this->openPeriod($this->bgyA);
        $this->upload($this->repA, ['file' => $this->pdf('a.pdf', 'one')])->assertCreated();
        $this->upload($this->repA, ['file' => $this->pdf('b.pdf', 'two')])->assertCreated();

        $files = Submission::first()->files;
        $this->assertSame([2, 1], $files->pluck('version')->all());
        foreach ($files as $f) {
            Storage::disk('local')->assertExists($f->path);
        }
    }

    public function test_client_cannot_choose_the_period_or_due_date(): void
    {
        $this->openPeriod($this->bgyA);

        $this->upload($this->repA, ['due_date' => '2099-01-01', 'period_label' => '2031-01'])
            ->assertStatus(422);
        $this->assertSame('2026-10-05', Submission::first()->due_date->toDateString());
    }

    public function test_upload_is_locked_when_compliant_or_under_review_but_open_when_non_compliant(): void
    {
        $s = $this->openPeriod($this->bgyA, 'compliant');
        $this->upload($this->repA)->assertForbidden();

        $s->update(['status' => 'under_review']);
        $this->upload($this->repA)->assertForbidden();

        $s->update(['status' => 'non_compliant', 'review_remarks' => 'Missing signature']);
        $this->upload($this->repA)->assertCreated();
        $this->assertNull($s->fresh()->review_remarks);
    }

    public function test_barangay_cannot_see_or_download_another_barangays_report(): void
    {
        $b = $this->openPeriod($this->bgyB);
        $this->upload($this->repB)->assertCreated();

        Sanctum::actingAs($this->repA);
        $this->getJson("/api/submissions/{$b->id}")->assertForbidden();
        $this->getJson("/api/submissions/{$b->id}/download")->assertForbidden();
        $this->getJson("/api/submissions/{$b->id}/files")->assertForbidden();

        $fileId = $b->files()->first()->id;
        $this->getJson("/api/submissions/{$b->id}/files/{$fileId}/download")->assertForbidden();

        $this->assertCount(0, $this->getJson('/api/submissions')->json('data'));
    }

    public function test_barangay_cannot_upload_into_another_barangays_row_or_wrong_file_types(): void
    {
        $this->openPeriod($this->bgyB);
        // repA has no open row of their own: nothing to upload into
        $this->upload($this->repA)->assertStatus(422);

        $this->openPeriod($this->bgyA);
        $this->upload($this->repA, ['file' => UploadedFile::fake()->createWithContent('evil.php', '<?php echo 1;')])
            ->assertStatus(422);
    }

    public function test_office_can_download_any_report_and_the_path_is_not_exposed(): void
    {
        $s = $this->openPeriod($this->bgyA);
        $this->upload($this->repA)->assertCreated();

        Sanctum::actingAs($this->supervisor);
        $this->get("/api/submissions/{$s->id}/download")->assertOk();

        $json = $this->getJson("/api/submissions/{$s->id}/files")->assertOk()->json();
        $this->assertArrayNotHasKey('path', $json[0]);
    }

    public function test_review_needs_remarks_when_non_compliant_and_not_for_pending(): void
    {
        $s = $this->openPeriod($this->bgyA);

        Sanctum::actingAs($this->supervisor);
        $this->patchJson("/api/submissions/{$s->id}/review", ['status' => 'compliant'])->assertStatus(422);

        $s->update(['status' => 'submitted']);
        $this->patchJson("/api/submissions/{$s->id}/review", ['status' => 'non_compliant'])->assertStatus(422);
        $this->patchJson("/api/submissions/{$s->id}/review", ['status' => 'non_compliant', 'review_remarks' => 'No signature'])
            ->assertOk();

        Sanctum::actingAs($this->repA);
        $this->patchJson("/api/submissions/{$s->id}/review", ['status' => 'compliant'])->assertForbidden();
    }

    // ---------------- Reports ----------------

    public function test_open_periods_command_creates_pending_rows_once(): void
    {
        $this->artisan('submissions:open-periods', ['--date' => '2026-09-15'])->assertSuccessful();
        $this->assertSame(2, Submission::count()); // 2 barangays x 1 category

        $row = Submission::first();
        $this->assertSame('2026-09', $row->period_label);
        $this->assertSame('2026-10-05', $row->due_date->toDateString());
        $this->assertSame('pending', $row->status);

        $this->artisan('submissions:open-periods', ['--date' => '2026-09-20'])->assertSuccessful();
        $this->assertSame(2, Submission::count());
    }

    public function test_period_labels_match_each_cycle(): void
    {
        $d = \Carbon\CarbonImmutable::parse('2026-10-02');
        $f = fn ($c) => \App\Support\ReportingPeriod::forCycle($c, $d);

        $this->assertSame('2026-W40', $f('weekly')['label']);
        $this->assertSame('2026-10', $f('monthly')['label']);
        $this->assertSame('2026-Q4', $f('quarterly')['label']);
        $this->assertSame('2026-S2', $f('semestral')['label']);
        $this->assertSame('2026', $f('annual')['label']);
        $this->assertSame('2026-10-15', \App\Support\ReportingPeriod::forCycle('quarterly', \Carbon\CarbonImmutable::parse('2026-08-10'))['due']->toDateString());
    }

    public function test_filing_on_the_due_date_is_not_late(): void
    {
        $s = $this->openPeriod($this->bgyA, 'submitted');
        $s->update(['submitted_at' => '2026-10-05 09:00:00']);
        $this->assertFalse($s->fresh()->isLate());

        $s->update(['submitted_at' => '2026-10-06 00:01:00']);
        $this->assertTrue($s->fresh()->isLate());
    }

    public function test_compliance_report_and_csv_are_office_only_and_safe(): void
    {
        $a = $this->openPeriod($this->bgyA, 'compliant');
        $b = $this->openPeriod($this->bgyB, 'non_compliant');
        $b->update(['review_remarks' => '=HYPERLINK("http://evil")']);

        Sanctum::actingAs($this->repA);
        $this->getJson('/api/reports/compliance')->assertForbidden();
        $this->get('/api/reports/compliance/export')->assertForbidden();

        Sanctum::actingAs($this->supervisor);
        $r = $this->getJson('/api/reports/compliance?period_label=2026-09')->assertOk();
        $this->assertSame(1, $r->json('totals.compliant'));
        $this->assertSame(50.0, (float) $r->json('totals.compliance_rate'));

        $csv = $this->get('/api/reports/compliance/export?period_label=2026-09');
        $csv->assertOk();
        $body = $csv->streamedContent();
        $this->assertStringContainsString('Alpha', $body);
        $this->assertStringContainsString("'=HYPERLINK", $body);   // neutralised
        $this->assertStringNotContainsString(',=HYPERLINK', $body);
    }

    public function test_audit_logs_are_super_admin_only(): void
    {
        Sanctum::actingAs($this->supervisor);
        $this->getJson('/api/reports/audit-logs')->assertForbidden();

        Sanctum::actingAs($this->repA);
        $this->getJson('/api/reports/audit-logs')->assertForbidden();

        Sanctum::actingAs($this->admin);
        $this->getJson('/api/reports/audit-logs')->assertOk();
    }

    public function test_security_summary_is_office_only(): void
    {
        Sanctum::actingAs($this->repA);
        $this->getJson('/api/reports/security')->assertForbidden();

        Sanctum::actingAs($this->supervisor);
        $this->getJson('/api/reports/security')->assertOk()->assertJsonStructure(['total', 'open', 'by_type']);
    }

    // ---------------- Resources ----------------

    private function postResource(User $u, array $over = [])
    {
        Sanctum::actingAs($u);

        return $this->post('/api/resources', $over + [
            'title' => 'Monthly Accomplishment Report form',
            'type' => 'template',
            'report_category_id' => $this->category->id,
            'version' => '1.0',
            'file' => $this->pdf('form.pdf'),
        ], ['Accept' => 'application/json']);
    }

    public function test_barangay_cannot_upload_resources_but_supervisor_can(): void
    {
        $this->postResource($this->repA)->assertForbidden();
        $this->postResource($this->supervisor)->assertCreated();
    }

    public function test_template_requires_a_category_but_a_sop_does_not(): void
    {
        $this->postResource($this->admin, ['report_category_id' => null])->assertStatus(422);
        $this->postResource($this->admin, ['type' => 'sop', 'title' => 'Phishing SOP', 'report_category_id' => null])
            ->assertCreated();
    }

    public function test_new_version_replaces_the_live_one_and_old_versions_are_blocked_for_barangays(): void
    {
        $v1 = $this->postResource($this->admin, ['version' => '1.0'])->assertCreated()->json('id');
        $v2 = $this->postResource($this->admin, ['version' => '2.0'])->assertCreated()->json('id');

        $this->assertFalse(Resource::find($v1)->is_current);
        $this->assertTrue(Resource::find($v2)->is_current);

        // duplicate version number refused
        $this->postResource($this->admin, ['version' => '2.0'])->assertStatus(422);

        Sanctum::actingAs($this->repA);
        $this->get("/api/resources/{$v1}/download")->assertNotFound();   // outdated form
        $this->get("/api/resources/{$v2}/download")->assertOk();

        $ids = collect($this->getJson('/api/resources/library')->json('data'))->pluck('id')->all();
        $this->assertSame([$v2], $ids);

        // office can still see history
        Sanctum::actingAs($this->supervisor);
        $all = collect($this->getJson('/api/resources/library?history=1')->json('data'))->pluck('id')->all();
        $this->assertEqualsCanonicalizing([$v1, $v2], $all);
        $this->get("/api/resources/{$v1}/download")->assertOk();
    }

    public function test_archived_resource_disappears_for_barangays_and_file_path_is_hidden(): void
    {
        $id = $this->postResource($this->admin)->assertCreated()->json('id');

        Sanctum::actingAs($this->repA);
        $this->patchJson("/api/resources/{$id}/archive")->assertForbidden();

        Sanctum::actingAs($this->admin);
        $this->patchJson("/api/resources/{$id}/archive")->assertOk();

        Sanctum::actingAs($this->repA);
        $this->get("/api/resources/{$id}/download")->assertNotFound();
        $this->assertSame([], $this->getJson('/api/resources/library')->json('data'));

        Sanctum::actingAs($this->admin);
        $row = $this->getJson('/api/resources/library?history=1')->json('data.0');
        $this->assertArrayNotHasKey('file_path', $row);
    }

    public function test_resource_files_are_private_not_on_the_public_disk(): void
    {
        $id = $this->postResource($this->admin)->assertCreated()->json('id');
        $path = Resource::find($id)->file_path;

        Storage::disk('local')->assertExists($path);
        Storage::fake('public');
        Storage::disk('public')->assertMissing($path);
    }

    // ---------------- Barangay "Reports" + Repository filter ----------------

    public function test_repository_filter_lists_only_filed_reports_for_the_barangay(): void
    {
        $filed = $this->openPeriod($this->bgyA);
        Submission::create([
            'barangay_id' => $this->bgyA->id, 'report_category_id' => $this->category->id,
            'period_label' => '2026-10', 'period_start' => '2026-10-01', 'period_end' => '2026-10-31',
            'due_date' => '2026-11-05', 'status' => 'pending',
        ]);
        $this->upload($this->repA)->assertCreated();

        Sanctum::actingAs($this->repA);
        $all = $this->getJson('/api/submissions')->json('data');
        $this->assertCount(2, $all);

        $onlyFiled = $this->getJson('/api/submissions?has_file=1')->json('data');
        $this->assertSame([$filed->id], array_column($onlyFiled, 'id'));
    }

    public function test_barangay_can_file_an_incident_and_only_sees_their_own(): void
    {
        Sanctum::actingAs($this->repA);
        $this->post('/api/security-incidents', [
            'type' => 'phishing_attempt', 'severity' => 'medium', 'description' => 'Fake DILG email',
            'evidence' => UploadedFile::fake()->image('shot.png'),
        ], ['Accept' => 'application/json'])->assertCreated();

        $this->post('/api/security-incidents', [
            'type' => 'malware', 'severity' => 'low', 'description' => 'x',
            'evidence' => UploadedFile::fake()->createWithContent('run.php', '<?php'),
        ], ['Accept' => 'application/json'])->assertStatus(422);

        $this->assertCount(1, $this->getJson('/api/security-incidents')->json('data'));

        Sanctum::actingAs($this->repB);
        $this->assertCount(0, $this->getJson('/api/security-incidents')->json('data'));
    }

    public function test_per_page_is_capped(): void
    {
        $this->openPeriod($this->bgyA);
        Sanctum::actingAs($this->repA);

        $this->assertSame(200, $this->getJson('/api/submissions?per_page=99999')->json('per_page'));
        $this->assertSame(20, $this->getJson('/api/submissions')->json('per_page'));
    }
}
