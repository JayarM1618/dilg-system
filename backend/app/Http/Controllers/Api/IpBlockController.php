<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\IpBlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IpBlockController extends Controller
{
    /**
     * GET /api/admin/ip-blocks
     * List all IP blocks with optional status filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = IpBlock::with('blocker:id,name')
            ->orderByDesc('blocked_at');

        $status = $request->query('status', 'active');

        if ($status === 'active') {
            $query->where('is_active', true)
                  ->where(function ($q) {
                      $q->whereNull('expires_at')
                        ->orWhere('expires_at', '>', now());
                  });
        } elseif ($status === 'expired') {
            $query->where(function ($q) {
                $q->where('is_active', false)
                  ->orWhere(function ($q2) {
                      $q2->whereNotNull('expires_at')
                         ->where('expires_at', '<=', now());
                  });
            });
        }
        // status=all → no extra filter

        return response()->json($query->paginate($request->query('per_page', 25)));
    }

    /**
     * POST /api/admin/ip-blocks
     * Manually block an IP address.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ip_address' => 'required|ip',
            'reason'     => 'nullable|string|max:255',
            'expires_at' => 'nullable|date|after:now',
        ]);

        $user = $request->user();

        // Check if already blocked
        if (IpBlock::isBlocked($data['ip_address'])) {
            return response()->json(['message' => 'This IP is already blocked.'], 422);
        }

        $block = IpBlock::create([
            'ip_address' => $data['ip_address'],
            'reason'     => $data['reason'] ?? 'Manually blocked by administrator',
            'type'       => 'manual',
            'blocked_by' => $user->id,
            'blocked_at' => now(),
            'expires_at' => $data['expires_at'] ?? null,
            'is_active'  => true,
        ]);

        ActivityLog::record('ip.blocked', $block, [
            'ip'         => $data['ip_address'],
            'reason'     => $block->reason,
            'expires_at' => $block->expires_at,
        ]);

        return response()->json(['message' => 'IP address blocked.', 'data' => $block], 201);
    }

    /**
     * DELETE /api/admin/ip-blocks/{ipBlock}
     * Unblock an IP (soft — sets is_active to false).
     */
    public function destroy(Request $request, IpBlock $ipBlock): JsonResponse
    {
        $user = $request->user();

        $ipBlock->update(['is_active' => false]);

        ActivityLog::record('ip.unblocked', $ipBlock, [
            'ip' => $ipBlock->ip_address,
        ]);

        return response()->json(['message' => 'IP address unblocked.']);
    }
}
