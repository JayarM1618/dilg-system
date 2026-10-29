<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Barangay;
use App\Models\LoginAttempt;
use App\Models\ReportCategory;
use App\Models\RepositoryDocument;
use App\Models\Requirement;
use App\Models\Resource;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    /**
     * Model map for exportable types.
     */
    private const EXPORT_MAP = [
        'users'                => [User::class,              ['id', 'name', 'email', 'role', 'is_active', 'status', 'created_at']],
        'activity_logs'        => [ActivityLog::class,        ['id', 'user_id', 'action', 'description', 'ip_address', 'created_at']],
        'login_attempts'       => [LoginAttempt::class,       ['id', 'email', 'ip_address', 'successful', 'failure_reason', 'attempted_at']],
        'submissions'          => [Submission::class,         ['id', 'barangay_id', 'report_category_id', 'status', 'period_label', 'submitted_at', 'reviewed_at']],
        'barangays'            => [Barangay::class,           ['id', 'name', 'code', 'is_active']],
        'report_categories'    => [ReportCategory::class,     ['id', 'name', 'cycle', 'description']],
        'requirements'         => [Requirement::class,        ['id', 'title', 'type', 'status', 'priority', 'deadline', 'created_at']],
        'resources'            => [Resource::class,           ['id', 'name', 'type', 'group', 'created_at']],
        'repository_documents' => [RepositoryDocument::class, ['id', 'name', 'document_category_id', 'created_at']],
    ];

    /**
     * Bulk export system data as CSV or JSON.
     */
    public function export(Request $request): StreamedResponse|JsonResponse
    {
        $request->validate([
            'type'   => 'required|string|in:' . implode(',', array_keys(self::EXPORT_MAP)),
            'format' => 'sometimes|string|in:csv,json',
            'from'   => 'nullable|date',
            'to'     => 'nullable|date|after_or_equal:from',
        ]);

        $type   = $request->input('type');
        $format = $request->input('format', 'csv');
        $from   = $request->input('from');
        $to     = $request->input('to');

        [$modelClass, $columns] = self::EXPORT_MAP[$type];

        $query = $modelClass::select($columns);

        // Date range filter
        $dateCol = in_array('created_at', $columns) ? 'created_at'
                 : (in_array('attempted_at', $columns) ? 'attempted_at' : null);

        if ($dateCol) {
            if ($from) $query->where($dateCol, '>=', $from);
            if ($to)   $query->where($dateCol, '<=', $to . ' 23:59:59');
        }

        // Exclude archived items
        if (in_array('archived_at', (new $modelClass)->getFillable())) {
            $query->whereNull('archived_at');
        }

        ActivityLog::record('data.exported', null, [
            'type'   => $type,
            'format' => $format,
            'from'   => $from,
            'to'     => $to,
        ]);

        if ($format === 'json') {
            return response()->json(['data' => $query->get()]);
        }

        // CSV streamed response
        $filename = "{$type}_export_" . now()->format('Y-m-d_His') . '.csv';

        return response()->streamDownload(function () use ($query, $columns) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $columns);

            $query->chunk(500, function ($rows) use ($handle, $columns) {
                foreach ($rows as $row) {
                    $line = [];
                    foreach ($columns as $col) {
                        $line[] = $row->{$col} ?? '';
                    }
                    fputcsv($handle, $line);
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * System usage analytics.
     */
    public function analytics(Request $request): JsonResponse
    {
        // ── Daily active users (last 30 days) ──
        $dailyActive = DB::select("
            SELECT DATE(created_at) AS date, COUNT(DISTINCT user_id) AS active_users
            FROM activity_logs
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date
        ");

        // ── Monthly active users (last 12 months) ──
        $monthlyActive = DB::select("
            SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(DISTINCT user_id) AS active_users
            FROM activity_logs
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month
        ");

        // ── Most-used features (top actions last 30 days) ──
        $topActions = DB::select("
            SELECT action, COUNT(*) AS count
            FROM activity_logs
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY action
            ORDER BY count DESC
            LIMIT 15
        ");

        // ── Peak hours (last 7 days) ──
        $peakHours = DB::select("
            SELECT HOUR(created_at) AS hour, COUNT(*) AS count
            FROM activity_logs
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY HOUR(created_at)
            ORDER BY hour
        ");

        // ── User activity summary ──
        $userActivity = DB::select("
            SELECT u.id, u.name, u.email, u.role,
                   COUNT(a.id) AS action_count,
                   MAX(a.created_at) AS last_active
            FROM users u
            LEFT JOIN activity_logs a ON a.user_id = u.id AND a.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            WHERE u.archived_at IS NULL
            GROUP BY u.id, u.name, u.email, u.role
            ORDER BY action_count DESC
        ");

        // ── Dormant users (no activity in 30 days) ──
        $dormantUsers = DB::select("
            SELECT u.id, u.name, u.email, u.role, MAX(a.created_at) AS last_active
            FROM users u
            LEFT JOIN activity_logs a ON a.user_id = u.id
            WHERE u.is_active = 1 AND u.archived_at IS NULL
            GROUP BY u.id, u.name, u.email, u.role
            HAVING last_active IS NULL OR last_active < DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY last_active ASC
        ");

        // ── Per-barangay compliance ──
        $compliance = DB::select("
            SELECT b.id, b.name,
                   COUNT(s.id) AS total_submissions,
                   SUM(CASE WHEN s.status = 'compliant' THEN 1 ELSE 0 END) AS compliant_count
            FROM barangays b
            LEFT JOIN submissions s ON s.barangay_id = b.id AND s.archived_at IS NULL
            GROUP BY b.id, b.name
            ORDER BY b.name
        ");

        return response()->json([
            'daily_active_users'   => $dailyActive,
            'monthly_active_users' => $monthlyActive,
            'top_actions'          => $topActions,
            'peak_hours'           => $peakHours,
            'user_activity'        => $userActivity,
            'dormant_users'        => $dormantUsers,
            'barangay_compliance'  => $compliance,
        ]);
    }
}
