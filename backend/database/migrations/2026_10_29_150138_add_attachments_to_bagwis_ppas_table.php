<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bagwis_ppas', function (Blueprint $table) {
            if (!Schema::hasColumn('bagwis_ppas', 'attachment_path')) {
                $table->string('attachment_path')->nullable()->after('deadline_description');
            }
            if (!Schema::hasColumn('bagwis_ppas', 'attachment_name')) {
                $table->string('attachment_name')->nullable()->after('attachment_path');
            }
            if (!Schema::hasColumn('bagwis_ppas', 'attachment_size')) {
                $table->unsignedBigInteger('attachment_size')->nullable()->after('attachment_name');
            }
            if (!Schema::hasColumn('bagwis_ppas', 'attachment_mime')) {
                $table->string('attachment_mime', 100)->nullable()->after('attachment_size');
            }
            if (!Schema::hasColumn('bagwis_ppas', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('sort_order')->constrained('users')->nullOnDelete();
            }
        });

        Schema::table('bagwis_ppa_entries', function (Blueprint $table) {
            if (!Schema::hasColumn('bagwis_ppa_entries', 'attachment_path')) {
                $table->string('attachment_path')->nullable()->after('remarks');
            }
            if (!Schema::hasColumn('bagwis_ppa_entries', 'attachment_name')) {
                $table->string('attachment_name')->nullable()->after('attachment_path');
            }
            if (!Schema::hasColumn('bagwis_ppa_entries', 'attachment_size')) {
                $table->unsignedBigInteger('attachment_size')->nullable()->after('attachment_name');
            }
            if (!Schema::hasColumn('bagwis_ppa_entries', 'attachment_mime')) {
                $table->string('attachment_mime', 100)->nullable()->after('attachment_size');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bagwis_ppas', function (Blueprint $table) {
            if (Schema::hasColumn('bagwis_ppas', 'created_by')) {
                $table->dropForeign(['created_by']);
                $table->dropColumn('created_by');
            }
            $cols = ['attachment_path', 'attachment_name', 'attachment_size', 'attachment_mime'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('bagwis_ppas', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('bagwis_ppa_entries', function (Blueprint $table) {
            $cols = ['attachment_path', 'attachment_name', 'attachment_size', 'attachment_mime'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('bagwis_ppa_entries', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
