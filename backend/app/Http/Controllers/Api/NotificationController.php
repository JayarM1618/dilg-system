<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /** Paginated list — newest first, with unread count. */
    public function index(Request $request)
    {
        $query = Notification::forUser($request->user()->id)
            ->with('actor:id,name')
            ->orderByDesc('created_at');

        $unreadCount = Notification::forUser($request->user()->id)->unread()->count();

        return response()->json([
            'data' => $query->paginate(20),
            'unread_count' => $unreadCount,
        ]);
    }

    /** Just the unread count (for polling the bell badge). */
    public function unreadCount(Request $request)
    {
        return response()->json([
            'unread_count' => Notification::forUser($request->user()->id)->unread()->count(),
        ]);
    }

    /** Mark one notification as read. */
    public function markRead(Request $request, Notification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(403);
        }

        $notification->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    /** Mark all unread notifications as read. */
    public function markAllRead(Request $request)
    {
        Notification::forUser($request->user()->id)
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    /** Delete a single notification. */
    public function destroy(Request $request, Notification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(403);
        }

        $notification->delete();

        return response()->json(['ok' => true]);
    }

    /** Clear all notifications for the current user. */
    public function clearAll(Request $request)
    {
        Notification::forUser($request->user()->id)->delete();

        return response()->json(['ok' => true]);
    }
}

