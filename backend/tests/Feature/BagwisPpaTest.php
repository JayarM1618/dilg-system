<?php

namespace Tests\Feature;

use App\Models\BagwisPpa;
use App\Models\Barangay;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BagwisPpaTest extends TestCase
{
    use RefreshDatabase;

    public function test_supervisor_can_list_and_create_ppa_with_attachment(): void
    {
        Storage::fake('local');

        $supervisor = User::where('role', 'office_supervisor')->first()
            ?? User::factory()->create(['role' => 'office_supervisor', 'is_active' => true]);

        // 1. List PPAs
        $response = $this->actingAs($supervisor)->getJson('/api/bagwis/ppas');
        $response->assertStatus(200);

        // 2. Create PPA with attachment
        $file = UploadedFile::fake()->create('Makati_CADAC_Guide.pdf', 200, 'application/pdf');

        $createResponse = $this->actingAs($supervisor)->postJson('/api/bagwis/ppas', [
            'name' => 'Makati Anti-Drug Strategic Plan',
            'frequency' => 'Quarterly',
            'responsible_office' => 'CADAC / DILG Makati',
            'description' => 'Official strategic plan and compliance metrics for all Makati barangays.',
            'deadline_description' => 'Tuwing ika-5 ng sumunod na buwan',
            'attachment' => $file,
        ]);

        $createResponse->assertStatus(201);
        $ppaId = $createResponse->json('id');
        $this->assertNotNull($createResponse->json('attachment_path'));
        $this->assertEquals('Makati_CADAC_Guide.pdf', $createResponse->json('attachment_name'));

        // 3. Barangay rep can view and download
        $barangay = Barangay::firstOrCreate(['id' => 1], ['name' => 'Bangkal', 'code' => 'BGY-001', 'is_active' => true]);
        $rep = User::where('role', 'barangay_rep')->first()
            ?? User::factory()->create(['role' => 'barangay_rep', 'is_active' => true, 'barangay_id' => $barangay->id]);

        $listRep = $this->actingAs($rep)->getJson('/api/bagwis/ppas');
        $listRep->assertStatus(200);

        $downloadResponse = $this->actingAs($rep)->get("/api/bagwis/ppas/{$ppaId}/download");
        $downloadResponse->assertStatus(200);

        // 4. Barangay rep cannot create or upload (read only)
        $unauthorizedCreate = $this->actingAs($rep)->postJson('/api/bagwis/ppas', [
            'name' => 'Barangay Rep Attempt',
            'frequency' => 'Monthly',
            'responsible_office' => 'Unauthorized',
        ]);
        $unauthorizedCreate->assertStatus(403);
    }
}
