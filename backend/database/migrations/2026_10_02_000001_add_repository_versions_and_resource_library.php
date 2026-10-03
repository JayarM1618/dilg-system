<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // REPOSITORY: every upload is kept as a numbered version with a checksum.
        Schema::create('submission_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->string('path');
            $table->string('original_filename');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->char('sha256', 64);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['submission_id', 'version']);
        });

        // RESOURCES: templates, guidelines, SOPs, security advisories.
        Schema::table('resources', function (Blueprint $table) {
            $table->unsignedBigInteger('report_category_id')->nullable()->change();
        });

        Schema::table('resources', function (Blueprint $table) {
            $table->string('type', 30)->default('template')->after('title');
            $table->text('description')->nullable()->after('type');
            $table->boolean('is_current')->default(true)->after('version');
            $table->date('effective_date')->nullable()->after('is_current');
            $table->timestamp('archived_at')->nullable()->after('effective_date');
            $table->string('original_filename')->nullable()->after('file_path');
            $table->char('sha256', 64)->nullable()->after('original_filename');

            $table->index(['type', 'is_current']);
        });
    }

    public function down(): void
    {
        Schema::table('resources', function (Blueprint $table) {
            $table->dropIndex(['type', 'is_current']);
            $table->dropColumn(['type', 'description', 'is_current', 'effective_date', 'archived_at', 'original_filename', 'sha256']);
        });

        Schema::dropIfExists('submission_files');
    }
};
