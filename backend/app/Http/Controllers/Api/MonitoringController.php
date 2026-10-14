<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Barangay;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Super admin monitoring: every transaction of DILG admins/supervisors and barangay representatives,
 * read from the activity_logs audit trail (route middleware: role:super_admin).
 */
class MonitoringController extends Controller
{
    /** action prefix => [group key, group label] */
    private const GROUPS = [
        'user.' => ['auth', 'Sign-ins'],
        'submission.' => ['reports', 'Reports'],
        'resource.' => ['resources', 'Resources'],
        'security_incident.' => ['incidents', 'Incidents'],
        'barangay.' => ['content', 'Citizens content'],
        'account.' => ['accounts', 'Accounts'],
        'requirement.' => ['requirements', 'Requirements'],
        'report.' => ['exports', 'Report setup and exports'],
    ];

    private const LABELS = [
        'user.login' => 'Signed in',
        'user.logout' => 'Signed out',
        'user.login_google' => 'Signed in with Google',
        'submission.uploaded' => 'Uploaded a report',
        'submission.reviewed' => 'Reviewed a report',
        'submission.downloaded' => 'Downloaded a report',
        'resource.uploaded' => 'Uploaded a resource',
        'resource.archived' => 'Archived a resource',
        'resource.downloaded' => 'Downloaded a resource',
        'security_incident.reported' => 'Reported a security incident',
        'security_incident.status_updated' => 'Updated an incident status',
        'barangay.profile.updated' => 'Updated the barangay profile',
        'barangay.announcement.created' => 'Posted an announcement',
        'barangay.announcement.updated' => 'Edited an announcement',
        'barangay.announcement.deleted' => 'Deleted an announcement',
        'barangay.program.created' => 'Posted an event or program',
        'barangay.program.updated' => 'Edited an event or program',
        'barangay.program.deleted' => 'Deleted an event or program',
        'account.created' => 'Issued an account',
        'account.activated' => 'Activated their account',
        'account.invite_resent' => 'Re-sent an activation link',
        'account.access_reset' => 'Reset account access',
        'account.deactivated' => 'Deactivated an account',
        'account.reactivated' => 'Reactivated an account',
        'account.updated' => 'Updated an account',
        'requirement.sent' => 'Sent a requirement to the barangays',
        'requirement.responded' => 'Sent back a compliance',
        'requirement.acknowledged' => 'Acknowledged a requirement',
        'requirement.reviewed' => 'Reviewed a barangay compliance',
        'requirement.closed' => 'Closed a requirement',
        'requirement.reopened' => 'Reopened a requirement',
        'requirement.deleted' => 'Deleted a requirement',
        'requirement.file_downloaded' => 'Downloaded a requirement file',
        'requirement.response_downloaded' => 'Downloaded a barangay compliance',
        'requirement.received' => 'Received a requirement',
        'report.exported' => 'Exported a report',
        'report.period_opened' => 'Opened a report period for the barangays',
        'report.category_created' => 'Created a new report type',
    ];

    private function group(string $action): array
    {
        foreach (self::GROUPS as $prefix => $g) {
            if (str_starts_with($action, $prefix)) {
                return $g;
            }
        }

        return ['other', 'Other'];
    }

    public function activity(Request $request)
    {
        $f = $request->validate([
            'role' => ['nullable', 'in:super_admin,office_supervisor,barangay_rep'],
            'barangay_id' => ['nullable', 'integer'],
            'user_id' => ['nullable', 'integer'],
            'group' => ['nullable', 'string', 'max:20'],
            'q' => ['nullable', 'string', 'max:100'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $query = ActivityLog::with('user:id,name,email,role,barangay_id', 'user.barangay:id,name')->latest('id');

        if (!empty($f['role'])) {
            $query->whereHas('user', fn ($q) => $q->where('role', $f['role']));
        }
        if (!empty($f['barangay_id'])) {
            $query->whereHas('user', fn ($q) => $q->where('barangay_id', $f['barangay_id']));
        }
        if (!empty($f['user_id'])) {
            $query->where('user_id', $f['user_id']);
        }
        if (!empty($f['group'])) {
            $prefixes = collect(self::GROUPS)->filter(fn ($g) => $g[0] === $f['group'])->keys();
            $query->where(function ($q) use ($prefixes) {
                foreach ($prefixes as $p) {
                    $q->orWhere('action', 'like', $p . '%');
                }
            });
        }
        if (!empty($f['q'])) {
            $term = '%' . $f['q'] . '%';
            $query->where(function ($q) use ($term) {
                $q->where('action', 'like', $term)
                    ->orWhere('meta', 'like', $term)
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', $term)->orWhere('email', 'like', $term));
            });
        }
        // Dates are the Manila calendar day (UTC+8) the officer is looking at.
        if (!empty($f['from'])) {
            $query->where('created_at', '>=', \Carbon\Carbon::parse($f['from'], 'Asia/Manila')->startOfDay()->utc());
        }
        if (!empty($f['to'])) {
            $query->where('created_at', '<=', \Carbon\Carbon::parse($f['to'], 'Asia/Manila')->endOfDay()->utc());
        }

        $page = $query->paginate(30);

        $barangayNames = Barangay::whereIn('id', $page->getCollection()->map(fn ($l) => $l->meta['barangay_id'] ?? null)->filter()->unique())
            ->pluck('name', 'id');

        $page->getCollection()->transform(function (ActivityLog $log) use ($barangayNames) {
            [$groupKey, $groupLabel] = $this->group($log->action);
            $meta = $log->meta ?? [];
            $barangay = $log->user?->barangay?->name
                ?? (isset($meta['barangay_id']) ? $barangayNames[$meta['barangay_id']] ?? null : null);

            return [
                'id' => $log->id,
                'action' => $log->action,
                'label' => self::LABELS[$log->action] ?? $log->action,
                'group' => $groupKey,
                'group_label' => $groupLabel,
                'actor' => $log->user ? [
                    'id' => $log->user->id,
                    'name' => $log->user->name,
                    'role' => $log->user->role,
                ] : null,
                'barangay' => $barangay,
                'detail' => $meta['title'] ?? $meta['email'] ?? null,
                'meta' => $meta,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at?->toIso8601String(),
            ];
        });

        return $page;
    }

    public function summary()
    {
        $since7 = now()->subDays(7);
        $since14 = now()->subDays(13)->startOfDay();

        $rows7 = DB::table('activity_logs')
            ->leftJoin('users', 'users.id', '=', 'activity_logs.user_id')
            ->where('activity_logs.created_at', '>=', $since7);

        $byRole = (clone $rows7)->select('users.role', DB::raw('count(*) as n'))->groupBy('users.role')->pluck('n', 'role');

        $byGroup = [];
        foreach (self::GROUPS as $prefix => [$key, $label]) {
            $byGroup[] = [
                'key' => $key,
                'label' => $label,
                'count' => (clone $rows7)->where('activity_logs.action', 'like', $prefix . '%')->count(),
            ];
        }

        // Per Manila day, split into DILG office vs barangay representatives (grouped in PHP so any database works).
        $daily = [];
        DB::table('activity_logs')
            ->leftJoin('users', 'users.id', '=', 'activity_logs.user_id')
            ->where('activity_logs.created_at', '>=', $since14)
            ->select('activity_logs.created_at', 'users.role')
            ->orderBy('activity_logs.id')
            ->each(function ($r) use (&$daily) {
                $d = \Carbon\Carbon::parse($r->created_at, 'UTC')->setTimezone('Asia/Manila')->toDateString();
                $key = $r->role === 'barangay_rep' ? 'reps' : (in_array($r->role, ['super_admin', 'office_supervisor']) ? 'office' : null);
                if ($key) {
                    $daily[$d][$key] = ($daily[$d][$key] ?? 0) + 1;
                }
            });

        $days = [];
        for ($i = 13; $i >= 0; $i--) {
            $d = now('Asia/Manila')->subDays($i)->toDateString();
            $days[] = ['date' => $d, 'office' => (int) ($daily[$d]['office'] ?? 0), 'reps' => (int) ($daily[$d]['reps'] ?? 0)];
        }

        $lastSeen = DB::table('activity_logs')->join('users', 'users.id', '=', 'activity_logs.user_id')
            ->whereNotNull('users.barangay_id')->groupBy('users.barangay_id')
            ->selectRaw('users.barangay_id, max(activity_logs.created_at) as last_at, SUM(CASE WHEN activity_logs.created_at >= ? THEN 1 ELSE 0 END) as n30', [now()->subDays(30)->toDateTimeString()])
            ->get()->keyBy('barangay_id');

        $accounts = User::where('role', 'barangay_rep')->get()->groupBy('barangay_id');
        $subs = DB::table('submissions')->select('barangay_id', DB::raw('count(*) as n'))->groupBy('barangay_id')->pluck('n', 'barangay_id');
        $ann = DB::table('barangay_announcements')->select('barangay_id', DB::raw('count(*) as n'))->groupBy('barangay_id')->pluck('n', 'barangay_id');
        $prog = DB::table('barangay_programs')->select('barangay_id', DB::raw('count(*) as n'))->groupBy('barangay_id')->pluck('n', 'barangay_id');

        $barangays = Barangay::where('is_active', true)->orderBy('name')->get(['id', 'name'])->map(function ($b) use ($accounts, $lastSeen, $subs, $ann, $prog) {
            $reps = $accounts[$b->id] ?? collect();

            return [
                'id' => $b->id,
                'name' => $b->name,
                'accounts' => [
                    'active' => $reps->filter(fn ($u) => $u->status === 'active')->count(),
                    'pending' => $reps->filter(fn ($u) => $u->status === 'pending')->count(),
                    'deactivated' => $reps->filter(fn ($u) => $u->status === 'deactivated')->count(),
                ],
                'last_activity_at' => isset($lastSeen[$b->id]) ? \Carbon\Carbon::parse($lastSeen[$b->id]->last_at, 'UTC')->toIso8601String() : null,
                'actions_30d' => (int) ($lastSeen[$b->id]->n30 ?? 0),
                'reports' => (int) ($subs[$b->id] ?? 0),
                'announcements' => (int) ($ann[$b->id] ?? 0),
                'programs' => (int) ($prog[$b->id] ?? 0),
            ];
        })->values();

        return response()->json([
            'totals' => [
                'actions_today' => ActivityLog::where('created_at', '>=', now('Asia/Manila')->startOfDay()->utc())->count(),
                'actions_7d' => (clone $rows7)->count(),
                'active_users_7d' => (clone $rows7)->distinct()->count('activity_logs.user_id'),
                'pending_accounts' => User::whereNull('activated_at')->where('is_active', true)->count(),
                'deactivated_accounts' => User::where('is_active', false)->count(),
                'barangays_without_account' => $barangays->filter(fn ($b) => array_sum($b['accounts']) === 0)->count(),
            ],
            'by_role_7d' => [
                'office' => (int) (($byRole['super_admin'] ?? 0) + ($byRole['office_supervisor'] ?? 0)),
                'reps' => (int) ($byRole['barangay_rep'] ?? 0),
            ],
            'by_group_7d' => $byGroup,
            'daily' => $days,
            'barangays' => $barangays,
        ]);
    }
}
