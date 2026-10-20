<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Barangay;

class SampleSubmissionsSeeder extends Seeder
{
    public function run(): void
    {
        $barangayIds = Barangay::where('is_active', true)->pluck('id')->toArray();
        if (empty($barangayIds)) {
            return;
        }

        // Clean out existing submissions if any
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('submissions')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $months = [
            ['label' => '2026-04', 'start' => '2026-04-01', 'end' => '2026-04-30', 'due' => '2026-05-05'],
            ['label' => '2026-05', 'start' => '2026-05-01', 'end' => '2026-05-31', 'due' => '2026-06-05'],
            ['label' => '2026-06', 'start' => '2026-06-01', 'end' => '2026-06-30', 'due' => '2026-07-05'],
            ['label' => '2026-07', 'start' => '2026-07-01', 'end' => '2026-07-31', 'due' => '2026-08-05'],
            ['label' => '2026-08', 'start' => '2026-08-01', 'end' => '2026-08-31', 'due' => '2026-09-05'],
            ['label' => '2026-09', 'start' => '2026-09-01', 'end' => '2026-09-30', 'due' => '2026-10-05'],
            ['label' => '2026-10', 'start' => '2026-10-01', 'end' => '2026-10-31', 'due' => '2026-11-05'],
        ];

        $now = now();
        $rows = [];

        foreach ($barangayIds as $bId) {
            foreach ($months as $idx => $m) {
                // Determine realistic statuses based on month & barangay
                $status = 'compliant';
                if ($m['label'] === '2026-10') {
                    // Current active month: some submitted, some under_review, some pending
                    $status = ($bId % 4 === 0) ? 'pending' : (($bId % 3 === 0) ? 'under_review' : 'submitted');
                } elseif ($m['label'] === '2026-09') {
                    $status = ($bId % 7 === 0) ? 'under_review' : (($bId % 11 === 0) ? 'non_compliant' : 'compliant');
                } elseif ($m['label'] === '2026-08') {
                    $status = ($bId % 9 === 0) ? 'non_compliant' : 'compliant';
                }

                $submittedAt = ($status !== 'pending') ? "{$m['start']} 14:00:00" : null;
                $reviewedAt = in_array($status, ['compliant', 'non_compliant']) ? "{$m['due']} 10:00:00" : null;
                $reviewedBy = $reviewedAt ? 2 : null;

                $rows[] = [
                    'barangay_id' => $bId,
                    'report_category_id' => 1, // Monthly Accomplishment Report
                    'period_label' => $m['label'],
                    'period_start' => $m['start'],
                    'period_end' => $m['end'],
                    'due_date' => $m['due'],
                    'status' => $status,
                    'submitted_by' => $submittedAt ? 3 : null,
                    'submitted_at' => $submittedAt,
                    'reviewed_by' => $reviewedBy,
                    'reviewed_at' => $reviewedAt,
                    'review_remarks' => $status === 'non_compliant' ? 'Incomplete supporting document attachments.' : null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        foreach (array_chunk($rows, 50) as $chunk) {
            DB::table('submissions')->insert($chunk);
        }
    }
}
