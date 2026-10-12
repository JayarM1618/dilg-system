<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Barangay;
use App\Models\ReportCategory;
use App\Models\Resource;
use App\Models\Submission;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** DILG-issued accounts + activation, monitoring, barangay-initiated filing, DILG report setup. */
class AccountsAndReportingTest extends TestCase
{
    use RefreshDatabase;

    private Barangay $bgy;
    private ReportCategory $category;
    private User $admin;
    private User $supervisor;
    private User $rep;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->bgy = Barangay::create(['name' => 'Alpha', 'code' => 'BGY-A']);
        $this->category = ReportCategory::create(['name' => 'Monthly Accomplishment Report', 'cycle' => 'monthly']);

        $make = function ($n, $role, $bgy = null) {
            $u = User::create(['name' => $n, 'email' => "$n@test.local", 'password' => 'secret-pass-123', 'role' => $role, 'barangay_id' => $bgy?->id, 'is_active' => true]);
            $u->forceFill(['activated_at' => now()])->save();

            return $u;
        };
        $this->admin = $make('admin', 'super_admin');
        $this->supervisor = $make('sup', 'office_supervisor');
        $this->rep = $make('rep', 'barangay_rep', $this->bgy);
    }

    private function pdf(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('report.pdf', "%PDF-1.4\nx\n%%EOF");
    }

    // ---------- accounts ----------

    public function test_super_admin_issues_an_account_and_the_owner_activates_it(): void
    {
        Sanctum::actingAs($this->admin);
        $res = $this->postJson('/api/users', ['name' => 'New Rep', 'email' => 'new@test.local', 'role' => 'barangay_rep', 'barangay_id' => $this->bgy->id])
            ->assertCreated()
            ->assertJsonPath('user.status', 'pending');

        $link = $res->json('activation_link');
        $this->assertStringContainsString('/activate?token=', $link);
        $token = explode('token=', $link)[1];

        // pending accounts cannot sign in, not even with a guessed password
        $this->app['auth']->forgetGuards();
        $this->app['auth']->shouldUse('web'); // actingAs switched the default guard to sanctum
        $this->withHeaders(['Referer' => 'http://localhost:3000'])->postJson('/api/login', ['email' => 'new@test.local', 'password' => 'whatever-123'])->assertStatus(422);

        $this->getJson("/api/activate/{$token}")->assertOk()->assertJsonPath('email', 'new@test.local');
        $this->postJson('/api/activate', ['token' => $token, 'password' => 'short', 'password_confirmation' => 'short'])->assertStatus(422);
        $this->postJson('/api/activate', ['token' => $token, 'password' => 'Mypassw0rd1', 'password_confirmation' => 'Mypassw0rd1'])->assertOk();

        // the link works once
        $this->getJson("/api/activate/{$token}")->assertNotFound();

        $this->withHeaders(['Referer' => 'http://localhost:3000'])->postJson('/api/login', ['email' => 'new@test.local', 'password' => 'Mypassw0rd1'])->assertOk();
        $this->assertSame('active', User::where('email', 'new@test.local')->first()->status);
        $this->assertDatabaseHas('activity_logs', ['action' => 'account.created']);
        $this->assertDatabaseHas('activity_logs', ['action' => 'account.activated']);
    }

    public function test_only_super_admin_manages_accounts_and_reps_need_a_barangay(): void
    {
        Sanctum::actingAs($this->supervisor);
        $this->postJson('/api/users', ['name' => 'X', 'email' => 'x@test.local', 'role' => 'barangay_rep'])->assertForbidden();
        Sanctum::actingAs($this->rep);
        $this->getJson('/api/users')->assertForbidden();

        Sanctum::actingAs($this->admin);
        $this->postJson('/api/users', ['name' => 'X', 'email' => 'x@test.local', 'role' => 'barangay_rep'])->assertStatus(422);
        $this->postJson('/api/users', ['name' => 'X', 'email' => 'rep@test.local', 'role' => 'office_supervisor'])->assertStatus(422); // email taken
    }

    public function test_reset_access_and_deactivate(): void
    {
        Sanctum::actingAs($this->admin);
        $this->postJson("/api/users/{$this->rep->id}/invite")->assertOk()->assertJsonPath('user.status', 'pending');
        $this->assertTrue($this->rep->fresh()->isPending());

        $this->patchJson("/api/users/{$this->admin->id}", ['is_active' => false])->assertStatus(422); // not yourself
        $this->patchJson("/api/users/{$this->rep->id}", ['is_active' => false])->assertOk();
        $this->assertSame('deactivated', $this->rep->fresh()->status);
    }

    public function test_login_page_providers_endpoint_works_without_google_set_up(): void
    {
        $this->getJson('/api/auth/providers')->assertOk()->assertJson(['google' => false]);
        $this->get('/auth/google/redirect')->assertRedirect(); // back to the frontend with an error, never a crash
    }

    // ---------- barangay files a report on its own ----------

    public function test_barangay_sees_options_and_files_without_the_office_opening_a_period(): void
    {
        Sanctum::actingAs($this->rep);
        $options = $this->getJson('/api/submissions/options')->assertOk()->json('data');
        $this->assertCount(1, $options);
        $this->assertCount(2, $options[0]['periods']); // current + previous
        $current = $options[0]['periods'][0];
        $this->assertTrue($current['is_current']);

        $this->assertSame(0, Submission::count());
        $this->post('/api/submissions', [
            'report_category_id' => $this->category->id,
            'period_label' => $current['period_label'],
            'file' => $this->pdf(),
        ], ['Accept' => 'application/json'])->assertCreated();

        $row = Submission::first();
        $this->assertSame('submitted', $row->status);
        $this->assertSame($this->bgy->id, $row->barangay_id);
        $this->assertSame($current['due_date'], $row->due_date->toDateString());
        $this->assertSame(1, $row->files()->count());

        // the DILG office sees it right away
        Sanctum::actingAs($this->supervisor);
        $this->getJson('/api/submissions?has_file=1')->assertOk()->assertJsonPath('total', 1);

        // a period far in the past cannot be invented
        Sanctum::actingAs($this->rep);
        $this->post('/api/submissions', ['report_category_id' => $this->category->id, 'period_label' => '2019-01', 'file' => $this->pdf()], ['Accept' => 'application/json'])->assertStatus(422);

        // office staff do not file on a barangay's behalf
        Sanctum::actingAs($this->supervisor);
        $this->getJson('/api/submissions/options')->assertForbidden();
    }

    // ---------- DILG sets up reports ----------

    public function test_office_opens_periods_and_creates_a_report_type(): void
    {
        Barangay::create(['name' => 'Bravo', 'code' => 'BGY-B']);

        Sanctum::actingAs($this->rep);
        $this->postJson('/api/submissions/open-periods')->assertForbidden();
        $this->postJson('/api/report-categories', ['name' => 'X', 'cycle' => 'monthly'])->assertForbidden();

        Sanctum::actingAs($this->supervisor);
        $this->postJson('/api/submissions/open-periods')->assertOk()->assertJsonPath('created', 2);
        $this->postJson('/api/submissions/open-periods')->assertOk()->assertJsonPath('created', 0); // idempotent

        $this->postJson('/api/report-categories', ['name' => 'Disaster Risk Report', 'cycle' => 'quarterly'])->assertCreated()->assertJsonPath('opened', 2);
        $this->postJson('/api/report-categories', ['name' => 'Disaster Risk Report', 'cycle' => 'quarterly'])->assertStatus(422);
        $this->postJson('/api/report-categories', ['name' => 'Bad', 'cycle' => 'hourly'])->assertStatus(422);
        $this->assertSame(4, Submission::count());

        // and the barangay sees the new report in its form
        Sanctum::actingAs($this->rep);
        $names = collect($this->getJson('/api/submissions/options')->json('data'))->pluck('name');
        $this->assertTrue($names->contains('Disaster Risk Report'));
    }

    public function test_resources_published_by_dilg_reach_barangays_and_are_downloadable(): void
    {
        Sanctum::actingAs($this->supervisor);
        $this->post('/api/resources', [
            'title' => 'Monthly form', 'type' => 'template', 'report_category_id' => $this->category->id, 'version' => '1.0',
            'file' => UploadedFile::fake()->createWithContent('form.pdf', "%PDF-1.4\nx\n%%EOF"),
        ], ['Accept' => 'application/json'])->assertCreated();

        Sanctum::actingAs($this->rep);
        $lib = $this->getJson('/api/resources/library')->assertOk()->json('data');
        $this->assertCount(1, $lib);
        $this->getJson("/api/resources/{$lib[0]['id']}/download")->assertOk();

        $opt = $this->getJson('/api/submissions/options')->json('data');
        $this->assertSame($lib[0]['id'], $opt[0]['template']['id']);
    }

    // ---------- monitoring ----------

    public function test_monitoring_shows_admin_and_barangay_transactions_to_super_admin_only(): void
    {
        ActivityLog::record('user.login', $this->rep, [], $this->rep->id);
        ActivityLog::record('submission.reviewed', null, ['status' => 'compliant'], $this->supervisor->id);
        ActivityLog::record('barangay.announcement.created', null, ['barangay_id' => $this->bgy->id, 'title' => 'Hello'], $this->rep->id);

        Sanctum::actingAs($this->supervisor);
        $this->getJson('/api/monitoring/summary')->assertForbidden();
        $this->getJson('/api/monitoring/activity')->assertForbidden();

        Sanctum::actingAs($this->admin);
        $this->getJson('/api/monitoring/activity')->assertOk()->assertJsonPath('total', 3);
        $this->getJson('/api/monitoring/activity?role=barangay_rep')->assertOk()->assertJsonPath('total', 2);
        $this->getJson('/api/monitoring/activity?role=office_supervisor')->assertOk()->assertJsonPath('total', 1);
        $this->getJson('/api/monitoring/activity?group=content')->assertOk()->assertJsonPath('total', 1);
        $this->getJson("/api/monitoring/activity?barangay_id={$this->bgy->id}")->assertOk()->assertJsonPath('total', 2);
        $this->getJson('/api/monitoring/activity?q=Hello')->assertOk()->assertJsonPath('total', 1);

        $s = $this->getJson('/api/monitoring/summary')->assertOk();
        $s->assertJsonPath('totals.actions_7d', 3);
        $s->assertJsonPath('by_role_7d.reps', 2);
        $s->assertJsonPath('by_role_7d.office', 1);
        $this->assertCount(14, $s->json('daily'));
        $this->assertSame('Alpha', $s->json('barangays.0.name'));
        $this->assertSame(1, $s->json('barangays.0.accounts.active'));
    }

    // ---------- database clean-up ----------

    public function test_unused_tables_and_columns_are_gone(): void
    {
        foreach (['jobs', 'job_batches', 'failed_jobs', 'personal_access_tokens', 'password_reset_tokens'] as $t) {
            $this->assertFalse(Schema::hasTable($t), "$t should be removed");
        }
        $this->assertFalse(Schema::hasColumn('submissions', 'file_path'));
        $this->assertFalse(Schema::hasColumn('barangays', 'contact_email'));
        $this->assertTrue(Schema::hasTable('sessions'));
        $this->assertTrue(Schema::hasColumn('users', 'activated_at'));
    }
}
