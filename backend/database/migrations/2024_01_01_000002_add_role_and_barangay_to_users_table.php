<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // super_admin       -> DILG Makati office staff / full oversight
            // office_supervisor -> DILG supervisor, sees consolidated dashboard
            // barangay_rep      -> barangay representative, isolated to own data
            $table->enum('role', ['super_admin', 'office_supervisor', 'barangay_rep'])
                ->default('barangay_rep')
                ->after('email');

            $table->foreignId('barangay_id')
                ->nullable() // null for super_admin / office_supervisor
                ->after('role')
                ->constrained('barangays')
                ->nullOnDelete();

            $table->boolean('is_active')->default(true)->after('barangay_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['barangay_id']);
            $table->dropColumn(['role', 'barangay_id', 'is_active']);
        });
    }
};
