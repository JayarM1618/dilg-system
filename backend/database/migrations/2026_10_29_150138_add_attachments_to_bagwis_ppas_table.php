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
            $table->string('attachment_path')->nullable()->after('deadline_description');
            $table->string('attachment_name')->nullable()->after('attachment_path');
            $table->unsignedBigInteger('attachment_size')->nullable()->after('attachment_name');
            $table->string('attachment_mime', 100)->nullable()->after('attachment_size');
            $table->foreignId('created_by')->nullable()->after('sort_order')->constrained('users')->nullOnDelete();
        });

        Schema::table('bagwis_ppa_entries', function (Blueprint $table) {
            $table->string('attachment_path')->nullable()->after('remarks');
            $table->string('attachment_name')->nullable()->after('attachment_path');
            $table->unsignedBigInteger('attachment_size')->nullable()->after('attachment_name');
            $table->string('attachment_mime', 100)->nullable()->after('attachment_size');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bagwis_ppas', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn([
                'attachment_path',
                'attachment_name',
                'attachment_size',
                'attachment_mime',
                'created_by',
            ]);
        });

        Schema::table('bagwis_ppa_entries', function (Blueprint $table) {
            $table->dropColumn([
                'attachment_path',
                'attachment_name',
                'attachment_size',
                'attachment_mime',
            ]);
        });
    }
};
