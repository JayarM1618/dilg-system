<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Requirements: the DILG supervisor sends files, report requests, complaints or memos to the
 * barangays; each barangay receives it, complies, and DILG tracks who has complied.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requirements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('kind', 20)->default('file'); // file, report, complaint, memo, other
            $table->text('description')->nullable();
            $table->date('due_date')->nullable();
            $table->boolean('requires_response')->default(true);
            $table->string('audience', 10)->default('all'); // all | selected
            $table->string('status', 10)->default('open');  // open | closed
            $table->foreignId('created_by')->constrained('users');
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'due_date']);
        });

        Schema::create('requirement_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requirement_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('original_filename');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->string('sha256', 64)->nullable();
            $table->timestamps();
        });

        Schema::create('requirement_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requirement_id')->constrained()->cascadeOnDelete();
            $table->foreignId('barangay_id')->constrained()->cascadeOnDelete();
            $table->string('status', 12)->default('pending'); // pending, received, submitted, revision, complied
            $table->timestamp('received_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamps();
            $table->unique(['requirement_id', 'barangay_id']);
            $table->index(['barangay_id', 'status']);
        });

        Schema::create('requirement_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained('requirement_assignments')->cascadeOnDelete();
            $table->unsignedInteger('version')->default(1);
            $table->text('note')->nullable();
            $table->string('path')->nullable();
            $table->string('original_filename')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->string('sha256', 64)->nullable();
            $table->foreignId('uploaded_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requirement_responses');
        Schema::dropIfExists('requirement_assignments');
        Schema::dropIfExists('requirement_files');
        Schema::dropIfExists('requirements');
    }
};
