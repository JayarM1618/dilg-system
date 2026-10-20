<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Removes Barangay Rizal (BGY-023) from the database as it is an EMBO barangay
 * transferred under Taguig jurisdiction.
 * Run: php artisan migrate
 */
return new class extends Migration
{
    public function up(): void
    {
        $ids = DB::table('barangays')
            ->where('code', 'BGY-023')
            ->orWhere('name', 'Rizal')
            ->pluck('id');

        if ($ids->isEmpty()) {
            return;
        }

        $userIds = DB::table('users')->whereIn('barangay_id', $ids)->pluck('id');

        // security_incidents.reported_by has no cascade, so clear those rows first.
        DB::table('security_incidents')->whereIn('reported_by', $userIds)->delete();

        // Clear audit_logs or personal_access_tokens for these users if present
        if (DB::getSchemaBuilder()->hasTable('personal_access_tokens')) {
            DB::table('personal_access_tokens')->where('tokenable_type', 'App\\Models\\User')->whereIn('tokenable_id', $userIds)->delete();
        }

        // Delete users belonging to Rizal
        DB::table('users')->whereIn('id', $userIds)->delete();

        // Delete barangay record (submissions, assignments, announcements, programs cascade)
        DB::table('barangays')->whereIn('id', $ids)->delete();
    }

    public function down(): void
    {
        // Intentionally empty: removed non-Makati barangays are not restored.
    }
};
