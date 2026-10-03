<?php

namespace App\Support;

use Carbon\CarbonImmutable;

/**
 * Works out which reporting period a date falls in, for each cycle, using the same
 * labels that are already in the database ("2026-09", "2026-Q3", ...).
 */
class ReportingPeriod
{
    /** @return array{label:string,start:CarbonImmutable,end:CarbonImmutable,due:CarbonImmutable} */
    public static function forCycle(string $cycle, CarbonImmutable $date): array
    {
        switch ($cycle) {
            case 'weekly':
                $start = $date->startOfWeek();
                $end = $date->endOfWeek()->startOfDay();
                $label = $start->format('o') . '-W' . $start->format('W');
                break;
            case 'monthly':
                $start = $date->startOfMonth();
                $end = $date->endOfMonth()->startOfDay();
                $label = $date->format('Y-m');
                break;
            case 'quarterly':
                $start = $date->startOfQuarter();
                $end = $date->endOfQuarter()->startOfDay();
                $label = $date->format('Y') . '-Q' . $date->quarter;
                break;
            case 'semestral':
                $first = $date->month <= 6;
                $start = $date->setDate($date->year, $first ? 1 : 7, 1)->startOfDay();
                $end = $date->setDate($date->year, $first ? 6 : 12, $first ? 30 : 31)->startOfDay();
                $label = $date->format('Y') . '-S' . ($first ? 1 : 2);
                break;
            case 'annual':
                $start = $date->startOfYear();
                $end = $date->endOfYear()->startOfDay();
                $label = $date->format('Y');
                break;
            default:
                throw new \InvalidArgumentException("Unknown cycle: {$cycle}");
        }

        $days = (int) config("reporting.due_after_period_end_days.{$cycle}", 5);

        return [
            'label' => $label,
            'start' => $start,
            'end' => $end,
            'due' => $end->addDays($days),
        ];
    }
}
