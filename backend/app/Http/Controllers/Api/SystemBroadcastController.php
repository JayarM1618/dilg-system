<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\SystemBroadcast;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemBroadcastController extends Controller
{
    /**
     * List all broadcasts with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = SystemBroadcast::with('creator:id,name')
            ->orderByDesc('created_at');

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Get currently active broadcasts for the requesting user's role.
     */
    public function active(Request $request): JsonResponse
    {
        $role = $request->user()->role;
        $broadcasts = SystemBroadcast::activeFor($role);

        return response()->json(['data' => $broadcasts]);
    }

    /**
     * Create a new system broadcast.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'          => 'required|string|max:255',
            'message'        => 'required|string|max:2000',
            'type'           => 'required|in:info,warning,critical,maintenance',
            'target'         => 'sometimes|in:all,super_admin,office_supervisor,barangay_rep',
            'is_dismissible' => 'sometimes|boolean',
            'starts_at'      => 'nullable|date',
            'ends_at'        => 'nullable|date|after_or_equal:starts_at',
        ]);

        $data['created_by'] = $request->user()->id;
        $data['is_active']  = true;

        $broadcast = SystemBroadcast::create($data);

        ActivityLog::record('broadcast.created', $broadcast, [
            'type'   => $broadcast->type,
            'target' => $broadcast->target,
        ]);

        return response()->json($broadcast->load('creator:id,name'), 201);
    }

    /**
     * Update an existing broadcast.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $broadcast = SystemBroadcast::findOrFail($id);

        $data = $request->validate([
            'title'          => 'sometimes|string|max:255',
            'message'        => 'sometimes|string|max:2000',
            'type'           => 'sometimes|in:info,warning,critical,maintenance',
            'target'         => 'sometimes|in:all,super_admin,office_supervisor,barangay_rep',
            'is_active'      => 'sometimes|boolean',
            'is_dismissible' => 'sometimes|boolean',
            'starts_at'      => 'nullable|date',
            'ends_at'        => 'nullable|date',
        ]);

        $broadcast->update($data);

        ActivityLog::record('broadcast.updated', $broadcast, [
            'changes' => array_keys($data),
        ]);

        return response()->json($broadcast->fresh('creator:id,name'));
    }

    /**
     * Delete a broadcast.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $broadcast = SystemBroadcast::findOrFail($id);
        $title = $broadcast->title;

        $broadcast->delete();

        ActivityLog::record('broadcast.deleted', null, [
            'broadcast_id' => $id,
            'title'        => $title,
        ]);

        return response()->json(['message' => 'Broadcast deleted.']);
    }
}
