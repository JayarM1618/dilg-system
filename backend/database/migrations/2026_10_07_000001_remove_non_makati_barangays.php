<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Removes barangays that should not be listed (Embo barangays, Pitogo, Post Proper Northside/Southside)
 * from a database that already has them - WITHOUT wiping anything else.
 * Run:  php artisan migrate
 */
return new class extends Migration
{
    private const CODES = [
        'BGY-004', // Cembo
        'BGY-005', // Comembo
        'BGY-007', // East Rembo
        'BGY-016', // Pembo
        'BGY-019', // Pitogo
        'BGY-021', // Post Proper Northside
        'BGY-022', // Post Proper Southside
        'BGY-029', // South Cembo
        'BGY-033', // West Rembo
    ];

    public function up(): void
    {
        $ids = DB::table('barangays')->whereIn('code', self::CODES)->pluck('id');
        if ($ids->isEmpty()) {
            return;
        }

        $userIds = DB::table('users')->whereIn('barangay_id', $ids)->pluck('id');

        // security_incidents.reported_by has no cascade, so clear those rows first.
        DB::table('security_incidents')->whereIn('reported_by', $userIds)->delete();
        DB::table('users')->whereIn('id', $userIds)->delete();

        // submissions (and their files) are removed automatically by ON DELETE CASCADE.
        DB::table('barangays')->whereIn('id', $ids)->delete();
    }

    public function down(): void
    {
        // Intentionally empty: removed barangays are not restored.
    }
};
