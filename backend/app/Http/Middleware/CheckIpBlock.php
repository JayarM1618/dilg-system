<?php

namespace App\Http\Middleware;

use App\Models\IpBlock;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckIpBlock
{
    /**
     * Check if the request IP is blocked.
     * Applied to login route to prevent brute-force attacks.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $ip = $request->ip();

        if (IpBlock::isBlocked($ip)) {
            return response()->json([
                'message' => 'Your IP address has been temporarily blocked due to too many failed login attempts. Please try again later or contact the system administrator.',
            ], 403);
        }

        return $next($request);
    }
}
