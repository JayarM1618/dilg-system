<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/** Demo activity so the super admin Monitoring page is not empty. Safe to run again (it only adds rows). */
class MonitoringDemoSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [];
        $who = [
            [1, 'user.login', []], [2, 'user.login', []],
            [2, 'submission.reviewed', ['status' => 'approved']],
            [1, 'resource.uploaded', ['version' => 1]],
            [1, 'account.created', ['email' => 'rep.rizal@barangay.test']],
            [3, 'user.login', []], [3, 'submission.uploaded', ['version' => 1]],
            [3, 'barangay.announcement.created', ['barangay_id' => 1, 'title' => 'Barangay Assembly this month']],
            [3, 'barangay.program.created', ['barangay_id' => 1, 'kind' => 'event', 'title' => 'Medical and Dental Mission']],
            [4, 'user.login', []], [4, 'barangay.announcement.created', ['barangay_id' => 20, 'title' => 'Night market schedule']],
            [5, 'user.login', []], [5, 'security_incident.reported', ['severity' => 'low']],
            [7, 'user.login', []], [7, 'barangay.program.created', ['barangay_id' => 24, 'kind' => 'program', 'title' => 'Skills Training Center']],
        ];

        foreach ($who as $i => [$uid, $action, $meta]) {
            $at = now()->subDays(intdiv($i, 3))->subMinutes($i * 37);
            $rows[] = [
                'user_id' => $uid, 'action' => $action, 'subject_type' => null, 'subject_id' => null,
                'meta' => json_encode($meta), 'ip_address' => '127.0.0.1', 'created_at' => $at, 'updated_at' => $at,
            ];
        }

        DB::table('activity_logs')->insert($rows);
    }
}
