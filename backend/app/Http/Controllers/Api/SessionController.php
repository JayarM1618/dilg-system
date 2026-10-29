<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SessionController extends Controller
{
    /**
     * GET /api/admin/sessions
     * List all active sessions. Sanctum uses either the sessions table
     * (cookie-based SPA) or personal_access_tokens (token-based).
     * We check both and merge.
     */
    public function index(Request $request): JsonResponse
    {
        $sessions = [];

        // Cookie-based sessions (sessions table)
        if (\Schema::hasTable('sessions')) {
            $rows = DB::table('sessions')
                ->leftJoin('users', 'sessions.user_id', '=', 'users.id')
                ->select(
                    'sessions.id',
                    'sessions.user_id',
                    'sessions.ip_address',
                    'sessions.user_agent',
                    'sessions.last_activity',
                    'users.name as user_name',
                    'users.email as user_email',
                    'users.role as user_role'
                )
                ->whereNotNull('sessions.user_id')
                ->orderByDesc('sessions.last_activity')
                ->get();

            foreach ($rows as $row) {
                $sessions[] = [
                    'id'            => $row->id,
                    'type'          => 'session',
                    'user_id'       => $row->user_id,
                    'user_name'     => $row->user_name,
                    'user_email'    => $row->user_email,
                    'user_role'     => $row->user_role,
                    'ip_address'    => $row->ip_address,
                    'user_agent'    => $row->user_agent,
                    'last_activity' => date('Y-m-d H:i:s', $row->last_activity),
                ];
            }
        }

        // Token-based sessions (personal_access_tokens)
        if (\Schema::hasTable('personal_access_tokens')) {
            $tokens = DB::table('personal_access_tokens')
                ->where('tokenable_type', 'App\\Models\\User')
                ->leftJoin('users', 'personal_access_tokens.tokenable_id', '=', 'users.id')
                ->select(
                    'personal_access_tokens.id',
                    'personal_access_tokens.tokenable_id as user_id',
                    'personal_access_tokens.name as token_name',
                    'personal_access_tokens.last_used_at',
                    'personal_access_tokens.created_at',
                    'users.name as user_name',
                    'users.email as user_email',
                    'users.role as user_role'
                )
                ->orderByDesc('personal_access_tokens.last_used_at')
                ->get();

            foreach ($tokens as $token) {
                $sessions[] = [
                    'id'            => $token->id,
                    'type'          => 'token',
                    'user_id'       => $token->user_id,
                    'user_name'     => $token->user_name,
                    'user_email'    => $token->user_email,
                    'user_role'     => $token->user_role,
                    'token_name'    => $token->token_name,
                    'last_activity' => $token->last_used_at ?? $token->created_at,
                ];
            }
        }

        // Sort by last_activity desc
        usort($sessions, fn ($a, $b) => strcmp($b['last_activity'] ?? '', $a['last_activity'] ?? ''));

        // Filter by user_id if provided
        if ($userId = $request->query('user_id')) {
            $sessions = array_values(array_filter($sessions, fn ($s) => $s['user_id'] == $userId));
        }

        return response()->json([
            'data'  => $sessions,
            'total' => count($sessions),
        ]);
    }

    /**
     * DELETE /api/admin/sessions/{id}
     * Force-logout a specific session.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $admin = $request->user();
        $type  = $request->query('type', 'session');
        $found = false;

        if ($type === 'token' && \Schema::hasTable('personal_access_tokens')) {
            $token = DB::table('personal_access_tokens')->where('id', $id)->first();
            if ($token) {
                DB::table('personal_access_tokens')->where('id', $id)->delete();
                $found = true;

                ActivityLog::record('session.force_logout', null, [
                    'session_id' => $id,
                    'type'       => 'token',
                    'user_id'    => $token->tokenable_id,
                ]);
            }
        } else {
            if (\Schema::hasTable('sessions')) {
                $session = DB::table('sessions')->where('id', $id)->first();
                if ($session) {
                    DB::table('sessions')->where('id', $id)->delete();
                    $found = true;

                    ActivityLog::record('session.force_logout', null, [
                        'session_id' => $id,
                        'type'       => 'session',
                        'user_id'    => $session->user_id,
                    ]);
                }
            }
        }

        if (!$found) {
            return response()->json(['message' => 'Session not found.'], 404);
        }

        return response()->json(['message' => 'Session terminated.']);
    }

    /**
     * POST /api/admin/sessions/force-logout-all
     * Force-logout all sessions for a given user.
     */
    public function destroyAll(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $admin  = $request->user();
        $userId = $data['user_id'];
        $target = User::findOrFail($userId);
        $count  = 0;

        // Remove cookie sessions
        if (\Schema::hasTable('sessions')) {
            $count += DB::table('sessions')->where('user_id', $userId)->delete();
        }

        // Remove API tokens
        if (\Schema::hasTable('personal_access_tokens')) {
            $count += DB::table('personal_access_tokens')
                ->where('tokenable_type', 'App\\Models\\User')
                ->where('tokenable_id', $userId)
                ->delete();
        }

        ActivityLog::record('session.force_logout_all', $target, [
            'sessions_removed' => $count,
        ]);

        return response()->json([
            'message' => "All {$count} session(s) for {$target->name} terminated.",
        ]);
    }
}
