<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds columns for the multi-step account activation + admin verification flow:
 *
 *  1. terms_accepted_at   – when the user agreed to T&C during activation
 *  2. profile_photo_path  – selfie taken during activation (stored in storage/app/public/profile-photos/)
 *  3. verification_status – 'pending' until an admin reviews, then 'verified' or 'rejected'
 *  4. verified_at         – timestamp the admin approved
 *  5. verified_by         – FK to the admin who approved
 *  6. rejection_reason    – optional note when an admin rejects
 *  7. first_name / last_name / contact_number / position – profile details filled during activation
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Profile details (filled during activation step 2)
            if (!Schema::hasColumn('users', 'first_name')) {
                $table->string('first_name', 120)->nullable()->after('name');
            }
            if (!Schema::hasColumn('users', 'last_name')) {
                $table->string('last_name', 120)->nullable()->after('first_name');
            }
            if (!Schema::hasColumn('users', 'contact_number')) {
                $table->string('contact_number', 30)->nullable()->after('last_name');
            }
            if (!Schema::hasColumn('users', 'position')) {
                $table->string('position', 120)->nullable()->after('contact_number');
            }

            // Terms & Conditions
            if (!Schema::hasColumn('users', 'terms_accepted_at')) {
                $table->timestamp('terms_accepted_at')->nullable()->after('activation_expires_at');
            }

            // Photo capture (selfie)
            if (!Schema::hasColumn('users', 'profile_photo_path')) {
                $table->string('profile_photo_path', 2048)->nullable()->after('terms_accepted_at');
            }

            // Admin verification
            if (!Schema::hasColumn('users', 'verification_status')) {
                $table->enum('verification_status', ['unverified', 'pending', 'verified', 'rejected'])
                      ->default('unverified')
                      ->after('profile_photo_path');
            }
            if (!Schema::hasColumn('users', 'verified_at')) {
                $table->timestamp('verified_at')->nullable()->after('verification_status');
            }
            if (!Schema::hasColumn('users', 'verified_by')) {
                $table->foreignId('verified_by')->nullable()->after('verified_at')
                      ->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('users', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('verified_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'verified_by')) {
                try {
                    $table->dropForeign(['verified_by']);
                } catch (\Throwable $e) {
                    // Ignore if foreign key was already dropped
                }
            }

            $columns = [
                'first_name', 'last_name', 'contact_number', 'position',
                'terms_accepted_at', 'profile_photo_path',
                'verification_status', 'verified_at', 'verified_by', 'rejection_reason',
            ];
            $existing = array_filter($columns, fn ($col) => Schema::hasColumn('users', $col));
            if (!empty($existing)) {
                $table->dropColumn(array_values($existing));
            }
        });
    }
};
