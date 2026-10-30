<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('form_templates')) {
            Schema::create('form_templates', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('category', 100)->default('general');
                $table->json('fields')->comment('Array of field definitions [{name, type, label, required, options}]');
                $table->string('version', 20)->default('1.0');
                $table->boolean('is_active')->default(true);
                $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('form_templates');
    }
};

