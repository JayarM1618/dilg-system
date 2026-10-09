<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Public information shown in the Citizens View:
 *  - a small public profile on each barangay (about, hall address, hotline, office hours)
 *  - announcements
 *  - programs (ongoing) and events (dated, shown on the calendar)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('barangays', function (Blueprint $table) {
            $table->text('about')->nullable()->after('contact_email');
            $table->string('hall_address')->nullable()->after('about');
            $table->string('hotline', 50)->nullable()->after('hall_address');
            $table->string('office_hours')->nullable()->after('hotline');
        });

        Schema::create('barangay_announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barangay_id')->constrained()->cascadeOnDelete();
            $table->string('title', 150);
            $table->text('body');
            $table->boolean('is_pinned')->default(false);
            $table->timestamp('published_at')->useCurrent();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['barangay_id', 'published_at']);
        });

        Schema::create('barangay_programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barangay_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 10)->default('event'); // 'event' (dated, on the calendar) or 'program' (ongoing)
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->string('category', 30)->default('other');
            $table->string('venue', 150)->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->string('schedule_note', 150)->nullable(); // e.g. "Every Saturday, 8 AM to 11 AM"
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['barangay_id', 'kind', 'starts_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barangay_programs');
        Schema::dropIfExists('barangay_announcements');

        Schema::table('barangays', function (Blueprint $table) {
            $table->dropColumn(['about', 'hall_address', 'hotline', 'office_hours']);
        });
    }
};
