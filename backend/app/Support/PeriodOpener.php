<?php

namespace App\Support;

use App\Models\Barangay;
use App\Models\ReportCategory;
use App\Models\Submission;
use Carbon\CarbonImmutable;

/**
 * Opens a reporting period: one "pending" row per active barangay for a report category.
 * Used by the daily scheduler, the artisan command and the "Open period" button for DILG staff.
 * Existing rows are never touched, so it is safe to run as often as you like.
 */
class PeriodOpener
{
    /** @return int how many new rows were created */
    public static function open(?CarbonImmutable $date = null, ?int $categoryId = null): int
    {
        $date ??= CarbonImmutable::now('Asia/Manila');
        $barangayIds = Barangay::where('is_active', true)->pluck('id');
        $categories = $categoryId ? ReportCategory::whereKey($categoryId)->get() : ReportCategory::all();
        $created = 0;

        foreach ($categories as $category) {
            $period = ReportingPeriod::forCycle($category->cycle, $date);

            foreach ($barangayIds as $barangayId) {
                $row = Submission::firstOrCreate(
                    [
                        'barangay_id' => $barangayId,
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

        return $created;
    }

    /**
     * Periods a barangay may file for a category: the current one and the one before it
     * (so a late report can still be filed). Computed on the server, never trusted from the browser.
     *
     * @return array<int, array{label:string,start:CarbonImmutable,end:CarbonImmutable,due:CarbonImmutable,current:bool}>
     */
    public static function fileablePeriods(ReportCategory $category, ?CarbonImmutable $now = null): array
    {
        $now ??= CarbonImmutable::now('Asia/Manila');

        $current = ReportingPeriod::forCycle($category->cycle, $now);
        $previous = ReportingPeriod::forCycle($category->cycle, $current['start']->subDay());

        return [$current + ['current' => true], $previous + ['current' => false]];
    }
}
