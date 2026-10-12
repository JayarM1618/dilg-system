<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Database clean-up so every table and column belongs to something the system really uses.
 *
 *  Tables removed
 *    jobs, job_batches, failed_jobs  nothing is queued (set QUEUE_CONNECTION=sync)
 *    personal_access_tokens          sign-in uses Sanctum's cookie session, not API tokens
 *    password_reset_tokens           nobody resets their own password: DILG issues accounts and resets access
 *
 *  Columns removed
 *    submissions.file_path, submissions.original_filename   duplicated by submission_files (the real file history)
 *    barangays.contact_person / contact_number / contact_email   never shown or edited anywhere
 *      (the public profile uses hall_address, hotline and office_hours)
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (['jobs', 'job_batches', 'failed_jobs', 'personal_access_tokens', 'password_reset_tokens'] as $table) {
            Schema::dropIfExists($table);
        }

        foreach ([
            'submissions' => ['file_path', 'original_filename'],
            'barangays' => ['contact_person', 'contact_number', 'contact_email'],
        ] as $table => $columns) {
            foreach ($columns as $column) {
                if (Schema::hasColumn($table, $column)) {
                    Schema::table($table, fn (Blueprint $t) => $t->dropColumn($column));
                }
            }
        }
    }

    public function down(): void
    {
        // Intentionally empty: these tables and columns were not used by the system.
    }
};
