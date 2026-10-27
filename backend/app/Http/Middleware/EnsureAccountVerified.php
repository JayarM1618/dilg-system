<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks users whose accounts are not yet verified by an admin.
 *
 * Users with verification_status = 'pending' or 'rejected' can still call:
 *   - GET /api/me (to see their own status)
 *   - POST /api/logout
 *   - GET /api/notifications/*
 *
 * Everything else returns 403 with a clear message.
 *
 * Super admins and existing verified users pass through.
 * Legacy accounts (verification_status = 'unverified' or null) also pass through
 * so existing users are not disrupted.
 */
class EnsureAccountVerified
{
    /** Routes that bypass verification check (regex patterns). */
    private const ALLOWED_PATTERNS = [
        '#^api/me$#',
        '#^api/logout$#',
        '#^api/notifications#',
        '#^api/auth/providers$#',
        '#^sanctum/csrf-cookie$#',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Super admins always pass through
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Allow listed safe routes
        $path = ltrim($request->path(), '/');
        foreach (self::ALLOWED_PATTERNS as $pattern) {
            if (preg_match($pattern, $path)) {
                return $next($request);
            }
        }

        // Legacy accounts without the new column (unverified) pass through
        // so existing users are not disrupted after migration
        if ($user->verification_status === 'unverified' || $user->verification_status === null) {
            return $next($request);
        }

        // Verified users pass through
        if ($user->verification_status === 'verified') {
            return $next($request);
        }

        // Pending verification
        if ($user->verification_status === 'pending') {
            return response()->json([
                'message' => 'Your account is pending verification by a DILG administrator. You can view your status but cannot perform actions until verified.',
                'verification_status' => 'pending',
            ], 403);
        }

        // Rejected
        if ($user->verification_status === 'rejected') {
            return response()->json([
                'message' => 'Your account verification was rejected. Reason: ' . ($user->rejection_reason ?? 'No reason provided.') . ' Contact the DILG office for assistance.',
                'verification_status' => 'rejected',
                'rejection_reason' => $user->rejection_reason,
            ], 403);
        }

        return $next($request);
    }
}
