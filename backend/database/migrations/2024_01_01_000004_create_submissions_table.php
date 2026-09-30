<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barangay_id')->constrained()->cascadeOnDelete();
            $table->foreignId('report_category_id')->constrained()->cascadeOnDelete();

            // Which reporting period this submission covers, e.g. "2026-09" or "2026-Q3"
            $table->string('period_label');
            $table->date('period_start');
            $table->date('period_end');
            $table->date('due_date');

            $table->string('file_path')->nullable();     // uploaded document
            $table->string('original_filename')->nullable();

            // Replaces the manual binary 1/0 encoding in Google Sheets.
            // The dashboard ("Talaghayan") reads this enum directly - no more manual formulas.
            $table->enum('status', ['pending', 'submitted', 'under_review', 'compliant', 'non_compliant'])
                ->default('pending');

            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();

            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_remarks')->nullable();

            $table->timestamps();

            // A barangay can only have one submission record per category per period
            $table->unique(['barangay_id', 'report_category_id', 'period_label'], 'unique_submission_period');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
