<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('form_submissions')) {
            Schema::create('form_submissions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('form_template_id')->constrained('form_templates')->cascadeOnDelete();
                $table->foreignId('requirement_id')->nullable()->constrained('requirements')->nullOnDelete();
                $table->foreignId('barangay_id')->constrained('barangays')->cascadeOnDelete();
                $table->json('data')->comment('Key-value pairs matching the template fields');
                $table->string('status', 20)->default('draft');
                $table->timestamp('submitted_at')->nullable();
                $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('reviewed_at')->nullable();
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('review_notes')->nullable();
                $table->longText('signature_data')->nullable()->comment('Base64-encoded signature image');
                $table->string('signature_name')->nullable();
                $table->string('signature_position')->nullable();
                $table->timestamp('signed_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('form_submissions');
    }
};

