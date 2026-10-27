<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * DILG Makati System Architecture & Operational Notes — Full Implementation
 *
 * 1. Adds sector, scope, deadline_description, barangay_action, supervisor_action
 *    columns to report_categories so each of the 14+ BORMS reports from the PDF
 *    carries its own metadata.
 *
 * 2. Creates the bagwis_ppas table for the 6 city-level programs tracked in Bagwis.
 *
 * 3. Adds a parent_id + group_slug to document_categories so the repository can
 *    display a tree: Legislative Archives → Resolutions / Ordinances / SK Resolutions,
 *    Civil Registry Records → RBI Masterlist / KK Directory, and so on.
 *
 * 4. Adds a resource_group column to resources so they can be grouped into
 *    Standard Formats & Templates, Sectoral Toolkits, Makati Citizen Charts,
 *    and Google Drive Files Link.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ──────────────────────────────────────────────
        // 1. REPORT CATEGORIES — extra columns
        // ──────────────────────────────────────────────
        Schema::table('report_categories', function (Blueprint $table) {
            $table->string('sector', 30)->default('Barangay')->after('description');
            $table->string('scope', 30)->nullable()->after('sector');
            $table->string('deadline_description', 255)->nullable()->after('scope');
            $table->string('barangay_action', 255)->nullable()->after('deadline_description');
            $table->string('supervisor_action', 255)->nullable()->after('barangay_action');
            $table->unsignedSmallInteger('sort_order')->default(0)->after('supervisor_action');
            $table->string('slug', 60)->nullable()->unique()->after('name');
        });

        // ──────────────────────────────────────────────
        // 2. BAGWIS PPAs
        // ──────────────────────────────────────────────
        Schema::create('bagwis_ppas', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug', 60)->unique();
            $table->string('frequency', 30);
            $table->string('responsible_office');
            $table->text('description')->nullable();
            $table->string('deadline_description', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Optional: tracking table for PPA compliance per barangay per period
        Schema::create('bagwis_ppa_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bagwis_ppa_id')->constrained()->cascadeOnDelete();
            $table->string('period_label', 40);
            $table->string('status', 30)->default('pending'); // pending, submitted, compliant, non_compliant
            $table->text('remarks')->nullable();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->unique(['bagwis_ppa_id', 'period_label']);
        });

        // ──────────────────────────────────────────────
        // 3. DOCUMENT CATEGORIES — parent/group
        // ──────────────────────────────────────────────
        Schema::table('document_categories', function (Blueprint $table) {
            $table->unsignedBigInteger('parent_id')->nullable()->after('id');
            $table->string('group_slug', 60)->nullable()->after('slug');

            $table->foreign('parent_id')
                  ->references('id')
                  ->on('document_categories')
                  ->nullOnDelete();
        });

        // ──────────────────────────────────────────────
        // 4. RESOURCES — resource_group
        // ──────────────────────────────────────────────
        Schema::table('resources', function (Blueprint $table) {
            $table->string('resource_group', 60)->default('standard_formats')->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('resources', function (Blueprint $table) {
            $table->dropColumn('resource_group');
        });

        Schema::table('document_categories', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['parent_id', 'group_slug']);
        });

        Schema::dropIfExists('bagwis_ppa_entries');
        Schema::dropIfExists('bagwis_ppas');

        Schema::table('report_categories', function (Blueprint $table) {
            $table->dropColumn([
                'sector', 'scope', 'deadline_description',
                'barangay_action', 'supervisor_action', 'sort_order', 'slug',
            ]);
        });
    }
};
