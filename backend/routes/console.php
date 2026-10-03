<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// REPORTS: open the current period for every barangay each day (idempotent).
// On the server add one cron line:  * * * * * php /path/to/backend/artisan schedule:run
Illuminate\Support\Facades\Schedule::command('submissions:open-periods')->dailyAt('00:05');
