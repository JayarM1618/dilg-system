<?php

namespace App\Console\Commands;

use App\Support\PeriodOpener;
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
        $date = $this->option('date') ? CarbonImmutable::parse($this->option('date')) : null;

        $created = PeriodOpener::open($date);

        $this->info("Opened {$created} new pending submission(s).");

        return self::SUCCESS;
    }
}
