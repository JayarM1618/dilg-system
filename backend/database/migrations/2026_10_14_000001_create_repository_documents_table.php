<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');             // e.g. "Policies", "Compliance Records"
            $table->string('slug')->unique();   // e.g. "policies"
            $table->string('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('repository_documents', function (Blueprint $table) {
            $table->id();

            $table->foreignId('document_category_id')
                  ->constrained('document_categories')
                  ->cascadeOnDelete();

            $table->string('title');
            $table->text('description')->nullable();

            // Access level: who can see this document
            // 'public'     = all authenticated users (incl. barangay reps)
            // 'office'     = office_supervisor + super_admin only
            // 'barangay'   = only the owning barangay + office staff
            $table->string('access_level', 20)->default('public');

            // If a barangay uploaded it, it belongs to them.
            // NULL = a DILG-wide document uploaded by office staff.
            $table->foreignId('barangay_id')
                  ->nullable()
                  ->constrained('barangays')
                  ->nullOnDelete();

            // File metadata
            $table->string('file_path');             // storage path (never exposed)
            $table->string('original_filename');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->string('sha256', 64)->nullable();

            // Lifecycle
            $table->string('status', 20)->default('active'); // active | archived
            $table->timestamp('archived_at')->nullable();

            $table->foreignId('uploaded_by')->constrained('users');

            $table->timestamps();

            $table->index(['document_category_id', 'status']);
            $table->index(['barangay_id', 'status']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repository_documents');
        Schema::dropIfExists('document_categories');
    }
};
