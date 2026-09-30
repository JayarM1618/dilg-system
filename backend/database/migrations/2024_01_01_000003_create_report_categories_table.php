<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g. "Monthly Accomplishment Report"
            $table->enum('cycle', ['weekly', 'monthly', 'quarterly', 'semestral', 'annual']);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // "Resources" - the current version of each downloadable template,
        // so barangays never submit using an outdated form.
        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_category_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('file_path'); // storage path of the template
            $table->string('version')->default('1.0');
            $table->foreignId('uploaded_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resources');
        Schema::dropIfExists('report_categories');
    }
};
