<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\Barangay;
use App\Models\ReportCategory;
use App\Models\Submission;
use App\Support\ReportingPeriod;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

/**
 * Creates a "pending" submission for every active barangay x report category for the
 * period that contains the given date. Safe to run daily: existing rows are never touched.
 *
 * This is what makes the Talaghayan show barangays that have NOT filed yet, and what lets
 * the server (not the browser) decide the period and due date.
 */
class OpenReportingPeriods extends Command
{
    protected $signature = 'submissions:open-periods {--date= : Any date inside the period to open (default: today)}';

    protected $description = 'Open the current reporting period for every barangay and report category';

    public function handle(): int
    {
        $date = $this->option('date')
            ? CarbonImmutable::parse($this->option('date'))
            : CarbonImmutable::now();

        $barangays = Barangay::where('is_active', true)->get(['id']);
        $created = 0;

        foreach (ReportCategory::all() as $category) {
            $period = ReportingPeriod::forCycle($category->cycle, $date);

            foreach ($barangays as $barangay) {
                $row = Submission::firstOrCreate(
                    [
                        'barangay_id' => $barangay->id,
                        'report_category_id' => $category->id,
                        'period_label' => $period['label'],
                    ],
                    [
                        'period_start' => $period['start']->toDateString(),
                        'period_end' => $period['end']->toDateString(),
                        'due_date' => $period['due']->toDateString(),
                        'status' => 'pending',
                    ]
                );

                if ($row->wasRecentlyCreated) {
                    $created++;
                }
            }
        }

        $this->info("Opened {$created} new pending submission(s).");

        return self::SUCCESS;
    }
}
