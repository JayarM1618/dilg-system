<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── System Settings ──
        Schema::create('system_settings', function (Blueprint $t) {
            $t->id();
            $t->string('key', 100)->unique();
            $t->text('value')->nullable();
            $t->string('group', 50)->default('general'); // general, upload, password, twofa, email, maintenance
            $t->string('type', 20)->default('string');   // string, integer, boolean, json
            $t->text('description')->nullable();
            $t->timestamps();
        });

        // ── Login Attempts ──
        Schema::create('login_attempts', function (Blueprint $t) {
            $t->id();
            $t->string('email')->index();
            $t->string('ip_address', 45)->index();
            $t->string('user_agent')->nullable();
            $t->boolean('successful')->default(false);
            $t->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('failure_reason')->nullable();
            $t->timestamp('attempted_at')->useCurrent();
            $t->index(['ip_address', 'attempted_at']);
            $t->index(['email', 'attempted_at']);
        });

        // ── IP Blocks ──
        Schema::create('ip_blocks', function (Blueprint $t) {
            $t->id();
            $t->string('ip_address', 45)->unique();
            $t->string('reason')->nullable();
            $t->enum('type', ['auto', 'manual'])->default('auto');
            $t->foreignId('blocked_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('blocked_at')->useCurrent();
            $t->timestamp('expires_at')->nullable();
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });

        // ── System Broadcasts (system-wide announcements from IT admin) ──
        Schema::create('system_broadcasts', function (Blueprint $t) {
            $t->id();
            $t->string('title');
            $t->text('message');
            $t->enum('type', ['info', 'warning', 'critical', 'maintenance'])->default('info');
            $t->enum('target', ['all', 'super_admin', 'office_supervisor', 'barangay_rep'])->default('all');
            $t->boolean('is_active')->default(true);
            $t->boolean('is_dismissible')->default(true);
            $t->timestamp('starts_at')->nullable();
            $t->timestamp('ends_at')->nullable();
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
        });

        // ── Error Logs (application-level) ──
        Schema::create('error_logs', function (Blueprint $t) {
            $t->id();
            $t->string('level', 20)->default('error'); // error, warning, critical
            $t->string('channel', 50)->default('application');
            $t->text('message');
            $t->text('context')->nullable(); // JSON context
            $t->text('trace')->nullable();
            $t->string('file')->nullable();
            $t->unsignedInteger('line')->nullable();
            $t->string('url')->nullable();
            $t->string('method', 10)->nullable();
            $t->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('ip_address', 45)->nullable();
            $t->timestamp('logged_at')->useCurrent();
            $t->index(['level', 'logged_at']);
            $t->index('logged_at');
        });

        // ── Archive columns (soft-archive instead of permanent delete) ──
        if (!Schema::hasColumn('users', 'archived_at')) {
            Schema::table('users', function (Blueprint $t) {
                $t->timestamp('archived_at')->nullable()->after('is_active');
                $t->foreignId('archived_by')->nullable()->after('archived_at')->constrained('users')->nullOnDelete();
            });
        }

        if (!Schema::hasColumn('resources', 'archived_at')) {
            Schema::table('resources', function (Blueprint $t) {
                $t->timestamp('archived_at')->nullable();
                $t->foreignId('archived_by')->nullable()->constrained('users')->nullOnDelete();
            });
        }

        if (!Schema::hasColumn('repository_documents', 'archived_at')) {
            Schema::table('repository_documents', function (Blueprint $t) {
                $t->timestamp('archived_at')->nullable();
                $t->foreignId('archived_by')->nullable()->constrained('users')->nullOnDelete();
            });
        }

        if (!Schema::hasColumn('form_templates', 'archived_at')) {
            Schema::table('form_templates', function (Blueprint $t) {
                $t->timestamp('archived_at')->nullable();
                $t->foreignId('archived_by')->nullable()->constrained('users')->nullOnDelete();
            });
        }

        if (!Schema::hasColumn('requirements', 'archived_at')) {
            Schema::table('requirements', function (Blueprint $t) {
                $t->timestamp('archived_at')->nullable();
                $t->foreignId('archived_by')->nullable()->constrained('users')->nullOnDelete();
            });
        }

        if (!Schema::hasColumn('report_categories', 'archived_at')) {
            Schema::table('report_categories', function (Blueprint $t) {
                $t->timestamp('archived_at')->nullable();
            });
        }

        if (!Schema::hasColumn('document_categories', 'archived_at')) {
            Schema::table('document_categories', function (Blueprint $t) {
                $t->timestamp('archived_at')->nullable();
            });
        }

        if (!Schema::hasColumn('submissions', 'archived_at')) {
            Schema::table('submissions', function (Blueprint $t) {
                $t->timestamp('archived_at')->nullable();
            });
        }

        // ── Seed default system settings ──
        $defaults = [
            // Upload settings
            ['key' => 'max_file_size_mb', 'value' => '10', 'group' => 'upload', 'type' => 'integer', 'description' => 'Maximum file upload size in MB'],
            ['key' => 'allowed_file_types', 'value' => 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png', 'group' => 'upload', 'type' => 'string', 'description' => 'Comma-separated allowed file extensions'],
            ['key' => 'max_upload_count', 'value' => '5', 'group' => 'upload', 'type' => 'integer', 'description' => 'Max files per single upload'],

            // Password policy
            ['key' => 'password_rotation_days', 'value' => '7', 'group' => 'password', 'type' => 'integer', 'description' => 'Days before password expires (0 = never)'],
            ['key' => 'password_min_length', 'value' => '8', 'group' => 'password', 'type' => 'integer', 'description' => 'Minimum password length'],
            ['key' => 'password_require_uppercase', 'value' => '1', 'group' => 'password', 'type' => 'boolean', 'description' => 'Require at least one uppercase letter'],
            ['key' => 'password_require_number', 'value' => '1', 'group' => 'password', 'type' => 'boolean', 'description' => 'Require at least one number'],
            ['key' => 'password_require_symbol', 'value' => '1', 'group' => 'password', 'type' => 'boolean', 'description' => 'Require at least one special character'],
            ['key' => 'password_history_count', 'value' => '5', 'group' => 'password', 'type' => 'integer', 'description' => 'Number of previous passwords that cannot be reused'],

            // 2FA policy
            ['key' => 'twofa_required_roles', 'value' => '', 'group' => 'twofa', 'type' => 'string', 'description' => 'Comma-separated roles that MUST enable 2FA (e.g. super_admin,office_supervisor)'],
            ['key' => 'twofa_grace_period_hours', 'value' => '72', 'group' => 'twofa', 'type' => 'integer', 'description' => 'Hours new users have to set up 2FA before being blocked'],

            // Security
            ['key' => 'max_failed_login_attempts', 'value' => '5', 'group' => 'security', 'type' => 'integer', 'description' => 'Max failed login attempts before IP auto-block'],
            ['key' => 'ip_block_duration_minutes', 'value' => '30', 'group' => 'security', 'type' => 'integer', 'description' => 'Auto-block duration in minutes (0 = permanent)'],

            // Maintenance
            ['key' => 'maintenance_mode', 'value' => '0', 'group' => 'maintenance', 'type' => 'boolean', 'description' => 'Put the system into read-only maintenance mode'],
            ['key' => 'maintenance_message', 'value' => 'System is currently under maintenance. Please try again later.', 'group' => 'maintenance', 'type' => 'string', 'description' => 'Message shown during maintenance'],

            // General
            ['key' => 'system_name', 'value' => 'DILG Makati Field Office Portal', 'group' => 'general', 'type' => 'string', 'description' => 'System display name'],
            ['key' => 'auto_backup_enabled', 'value' => '0', 'group' => 'general', 'type' => 'boolean', 'description' => 'Enable automated daily database backups'],
        ];

        foreach ($defaults as $s) {
            \DB::table('system_settings')->updateOrInsert(
                ['key' => $s['key']],
                array_merge($s, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('error_logs');
        Schema::dropIfExists('system_broadcasts');
        Schema::dropIfExists('ip_blocks');
        Schema::dropIfExists('login_attempts');
        Schema::dropIfExists('system_settings');

        $archiveTables = ['users', 'resources', 'repository_documents', 'form_templates', 'requirements', 'report_categories', 'document_categories', 'submissions'];
        foreach ($archiveTables as $table) {
            if (Schema::hasColumn($table, 'archived_at')) {
                Schema::table($table, function (Blueprint $t) use ($table) {
                    if (Schema::hasColumn($table, 'archived_by')) {
                        $t->dropConstrainedForeignId('archived_by');
                    }
                    $t->dropColumn('archived_at');
                });
            }
        }
    }
};
