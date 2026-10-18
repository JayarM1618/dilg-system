<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Bagwis read-only guard for barangay representatives.
 *
 * When applied to a route group, barangay_rep users may only issue GET / HEAD
 * requests.  Office staff (super_admin, office_supervisor) pass through
 * unrestricted.
 */
class BagwisReadOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->is_active) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Office staff always pass through.
        if (in_array($user->role, ['super_admin', 'office_supervisor'], true)) {
            return $next($request);
        }

        // Barangay reps: read-only (GET / HEAD).
        if ($user->role === 'barangay_rep' && ! $request->isMethodSafe()) {
            return response()->json([
                'message' => 'Bagwis is read-only for barangay representatives.',
            ], 403);
        }

        return $next($request);
    }
}
