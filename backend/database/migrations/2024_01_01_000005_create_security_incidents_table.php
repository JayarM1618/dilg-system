<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('security_incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reported_by')->constrained('users');
            $table->enum('type', ['phishing_attempt', 'suspicious_login', 'data_leak_suspicion', 'malware', 'other']);
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('low');
            $table->text('description');
            $table->string('evidence_path')->nullable(); // screenshot/email header upload

            // Formal escalation trail replacing "informally forwarding to ICTO"
            $table->enum('status', ['reported', 'acknowledged', 'escalated_to_icto', 'resolved', 'false_positive'])
                ->default('reported');
            $table->foreignId('acknowledged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('acknowledged_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_incidents');
    }
};
