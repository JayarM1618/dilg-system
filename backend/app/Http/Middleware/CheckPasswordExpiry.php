<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * If the signed-in user has `force_password_change = true`, block
 * everything except a few allowed endpoints and respond with 403
 * + a JSON flag so the frontend shows the forced-change form.
 *
 * Super admins are exempt from password rotation.
 */
class CheckPasswordExpiry
{
    /** Routes that bypass the password-expired check. */
    private const ALLOWED_PATTERNS = [
        '#^api/me$#',
        '#^api/logout$#',
        '#^api/password/force-change$#',
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

        // Super admins never expire
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // No forced change needed
        if (!$user->force_password_change) {
            return $next($request);
        }

        // Allow safe routes
        $path = ltrim($request->path(), '/');
        foreach (self::ALLOWED_PATTERNS as $pattern) {
            if (preg_match($pattern, $path)) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Your password has expired. Please create a new password before continuing.',
            'password_expired' => true,
        ], 403);
    }
}
