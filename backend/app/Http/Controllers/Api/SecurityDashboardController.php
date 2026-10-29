<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\LoginAttempt;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SecurityDashboardController extends Controller
{
    /**
     * GET /api/admin/security/login-history
     * Paginated login attempts with filters.
     */
    public function loginHistory(Request $request): JsonResponse
    {
        $query = LoginAttempt::query()
            ->with('user:id,name,email,role')
            ->orderByDesc('attempted_at');

        if ($email = $request->query('email')) {
            $query->where('email', 'like', "%{$email}%");
        }
        if ($ip = $request->query('ip')) {
            $query->where('ip_address', $ip);
        }
        if ($request->has('successful')) {
            $query->where('successful', filter_var($request->query('successful'), FILTER_VALIDATE_BOOLEAN));
        }
        if ($from = $request->query('from')) {
            $query->where('attempted_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->where('attempted_at', '<=', $to . ' 23:59:59');
        }

        return response()->json($query->paginate($request->query('per_page', 25)));
    }

    /**
     * GET /api/admin/security/failed-attempts
     * Summary of recent failed attempts grouped by IP and email.
     */
    public function failedAttempts(Request $request): JsonResponse
    {
        $minutes = (int) $request->query('minutes', 60);
        $since   = now()->subMinutes($minutes);

        $byIp = LoginAttempt::where('successful', false)
            ->where('attempted_at', '>=', $since)
            ->select('ip_address', DB::raw('COUNT(*) as attempts'), DB::raw('MAX(attempted_at) as last_attempt'))
            ->groupBy('ip_address')
            ->orderByDesc('attempts')
            ->limit(20)
            ->get();

        $byEmail = LoginAttempt::where('successful', false)
            ->where('attempted_at', '>=', $since)
            ->select('email', DB::raw('COUNT(*) as attempts'), DB::raw('MAX(attempted_at) as last_attempt'))
            ->groupBy('email')
            ->orderByDesc('attempts')
            ->limit(20)
            ->get();

        $total = LoginAttempt::where('successful', false)
            ->where('attempted_at', '>=', $since)
            ->count();

        return response()->json([
            'period_minutes' => $minutes,
            'total_failed'   => $total,
            'by_ip'          => $byIp,
            'by_email'       => $byEmail,
        ]);
    }

    /**
     * GET /api/admin/security/suspicious
     * Flag suspicious patterns: multi-IP accounts, brute force, off-hours logins.
     */
    public function suspiciousActivity(Request $request): JsonResponse
    {
        $hours = (int) $request->query('hours', 24);
        $since = now()->subHours($hours);

        // Accounts accessed from multiple IPs in the time window
        $multiIp = LoginAttempt::where('successful', true)
            ->where('attempted_at', '>=', $since)
            ->whereNotNull('user_id')
            ->select('user_id', DB::raw('COUNT(DISTINCT ip_address) as ip_count'))
            ->groupBy('user_id')
            ->having('ip_count', '>', 2)
            ->with('user:id,name,email')
            ->orderByDesc('ip_count')
            ->limit(10)
            ->get();

        // IPs with many failed attempts (possible brute force)
        $bruteForce = LoginAttempt::where('successful', false)
            ->where('attempted_at', '>=', $since)
            ->select('ip_address', DB::raw('COUNT(*) as attempts'), DB::raw('COUNT(DISTINCT email) as targeted_accounts'))
            ->groupBy('ip_address')
            ->having('attempts', '>=', 5)
            ->orderByDesc('attempts')
            ->limit(10)
            ->get();

        // Off-hours logins (before 6 AM or after 10 PM local — using server time)
        $offHours = LoginAttempt::where('successful', true)
            ->where('attempted_at', '>=', $since)
            ->whereRaw('HOUR(attempted_at) NOT BETWEEN 6 AND 22')
            ->with('user:id,name,email')
            ->orderByDesc('attempted_at')
            ->limit(20)
            ->get();

        return response()->json([
            'period_hours'           => $hours,
            'multi_ip_accounts'      => $multiIp,
            'brute_force_ips'        => $bruteForce,
            'off_hours_logins'       => $offHours,
            'multi_ip_count'         => $multiIp->count(),
            'brute_force_count'      => $bruteForce->count(),
            'off_hours_count'        => $offHours->count(),
        ]);
    }

    /**
     * GET /api/admin/security/report
     * Exportable security audit data for a date range.
     */
    public function securityReport(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
        ]);

        $from = $request->query('from');
        $to   = $request->query('to') . ' 23:59:59';

        $totalLogins   = LoginAttempt::whereBetween('attempted_at', [$from, $to])->count();
        $successLogins = LoginAttempt::whereBetween('attempted_at', [$from, $to])->where('successful', true)->count();
        $failedLogins  = $totalLogins - $successLogins;

        $uniqueUsers = LoginAttempt::whereBetween('attempted_at', [$from, $to])
            ->where('successful', true)
            ->distinct('user_id')
            ->count('user_id');

        $uniqueIps = LoginAttempt::whereBetween('attempted_at', [$from, $to])
            ->distinct('ip_address')
            ->count('ip_address');

        $activityLogs = ActivityLog::whereBetween('created_at', [$from, $to])->count();

        $passwordChanges = ActivityLog::whereBetween('created_at', [$from, $to])
            ->where('action', 'like', '%password%')
            ->count();

        $twofaChanges = ActivityLog::whereBetween('created_at', [$from, $to])
            ->where('action', 'like', '%two_factor%')
            ->count();

        // Daily breakdown
        $daily = LoginAttempt::whereBetween('attempted_at', [$from, $to])
            ->select(
                DB::raw('DATE(attempted_at) as date'),
                DB::raw('SUM(successful = 1) as success'),
                DB::raw('SUM(successful = 0) as failed')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'period'           => ['from' => $request->query('from'), 'to' => $request->query('to')],
            'total_logins'     => $totalLogins,
            'successful'       => $successLogins,
            'failed'           => $failedLogins,
            'unique_users'     => $uniqueUsers,
            'unique_ips'       => $uniqueIps,
            'activity_logs'    => $activityLogs,
            'password_changes' => $passwordChanges,
            'twofa_changes'    => $twofaChanges,
            'daily'            => $daily,
        ]);
    }

    /**
     * GET /api/admin/security/privacy
     * Data privacy / compliance overview.
     */
    public function privacyDashboard(): JsonResponse
    {
        $totalUsers          = User::count();
        $usersWithTerms      = User::whereNotNull('terms_accepted_at')->count();
        $usersWithTwoFa      = User::whereNotNull('two_factor_confirmed_at')->count();
        $deactivatedAccounts = User::where('is_active', false)->count();
        $archivedUsers       = User::whereNotNull('archived_at')->count();

        // Data age: oldest active user without a recent login
        $dormantUsers = User::where('is_active', true)
            ->whereNull('archived_at')
            ->whereDoesntHave('securityIncidents')
            ->whereRaw('DATEDIFF(NOW(), COALESCE(updated_at, created_at)) > 90')
            ->count();

        return response()->json([
            'total_users'          => $totalUsers,
            'terms_accepted'       => $usersWithTerms,
            'terms_acceptance_pct' => $totalUsers > 0 ? round(($usersWithTerms / $totalUsers) * 100, 1) : 0,
            'two_factor_enabled'   => $usersWithTwoFa,
            'two_factor_pct'       => $totalUsers > 0 ? round(($usersWithTwoFa / $totalUsers) * 100, 1) : 0,
            'deactivated'          => $deactivatedAccounts,
            'archived'             => $archivedUsers,
            'dormant_90d'          => $dormantUsers,
        ]);
    }
}
