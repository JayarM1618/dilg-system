<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * DILG-issued accounts: the super admin creates the account (name + email + barangay),
 * the person only ACTIVATES it by opening a one-time link and choosing a password.
 *
 *   invited_at              set when DILG issues (or re-issues) the account
 *   activated_at            set when the owner activates it (NULL = still pending)
 *   activation_token        sha256 hash of the one-time token (the plain token is never stored)
 *   activation_expires_at   link validity
 *   created_by              the super admin who issued the account
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('invited_at')->nullable()->after('is_active');
            $table->timestamp('activated_at')->nullable()->after('invited_at');
            $table->string('activation_token', 64)->nullable()->unique()->after('activated_at');
            $table->timestamp('activation_expires_at')->nullable()->after('activation_token');
            $table->foreignId('created_by')->nullable()->after('activation_expires_at')
                ->constrained('users')->nullOnDelete();
        });

        // Every account that already exists can already sign in, so it counts as activated.
        DB::table('users')->whereNull('activated_at')->update(['activated_at' => DB::raw('created_at')]);
        DB::table('users')->whereNull('activated_at')->update(['activated_at' => now()]);

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropUnique(['activation_token']);
            $table->dropColumn(['invited_at', 'activated_at', 'activation_token', 'activation_expires_at', 'created_by']);
        });
    }
};
