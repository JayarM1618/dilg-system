<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action'); // e.g. "submission.uploaded", "user.login", "resource.downloaded"
            $table->string('subject_type')->nullable(); // e.g. App\Models\Submission
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('meta')->nullable(); // arbitrary context (ip, old/new values, etc.)
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['subject_type', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
