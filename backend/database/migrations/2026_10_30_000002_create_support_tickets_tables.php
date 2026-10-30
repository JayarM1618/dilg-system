<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number', 30)->unique();
            $table->foreignId('barangay_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('category', 50)->default('general_inquiry');
            $table->string('subject', 200);
            $table->text('description');
            $table->string('priority', 20)->default('normal'); // normal, urgent, critical
            $table->string('status', 30)->default('pending_acceptance'); // pending_acceptance, in_progress, escalated, resolved, closed

            // DILG Representative acceptance
            $table->foreignId('accepted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('accepted_at')->nullable();

            // Escalation to Super Admin
            $table->foreignId('escalated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('escalation_reason')->nullable();
            $table->timestamp('escalated_at')->nullable();

            // Resolution
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('resolution_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();

            $table->timestamps();

            $table->index(['barangay_id', 'status']);
            $table->index(['status', 'priority']);
        });

        Schema::create('support_ticket_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('support_ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('message');
            $table->boolean('is_escalation_note')->default(false);
            $table->timestamps();

            $table->index(['support_ticket_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_ticket_messages');
        Schema::dropIfExists('support_tickets');
    }
};

