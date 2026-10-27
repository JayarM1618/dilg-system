<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\PasswordHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Handles forced password changes when a user's password has expired
 * (every 7 days for barangay_rep and office_supervisor).
 */
class PasswordController extends Controller
{
    /** How many past passwords to check against (prevent reuse). */
    private const HISTORY_CHECK = 5;

    /**
     * POST /api/password/force-change
     * Called when the user is flagged with force_password_change = true.
     */
    public function forceChange(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // Verify current password
        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Your current password is incorrect.',
                'errors' => ['current_password' => ['Your current password is incorrect.']],
            ], 422);
        }

        // Prevent reuse: check against recent password history
        $recentPasswords = PasswordHistory::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(self::HISTORY_CHECK)
            ->pluck('password');

        foreach ($recentPasswords as $oldHash) {
            if (Hash::check($data['new_password'], $oldHash)) {
                return response()->json([
                    'message' => 'You cannot reuse any of your last ' . self::HISTORY_CHECK . ' passwords. Please choose a different password.',
                    'errors' => ['new_password' => ['This password was used recently. Choose a different one.']],
                ], 422);
        }
        }

        // Also check against the current password
        if (Hash::check($data['new_password'], $user->password)) {
            return response()->json([
                'message' => 'Your new password must be different from your current password.',
                'errors' => ['new_password' => ['Your new password must be different from your current password.']],
            ], 422);
        }

        // Save old password to history before changing
        PasswordHistory::create([
            'user_id' => $user->id,
            'password' => $user->password, // already hashed
            'created_at' => now(),
        ]);

        // Update password
        $user->forceFill([
            'password' => Hash::make($data['new_password']),
            'password_changed_at' => now(),
            'password_expires_at' => now()->addDays(7),
            'force_password_change' => false,
        ])->save();

        ActivityLog::record('security.password_changed', $user, [
            'email' => $user->email,
            'forced' => true,
        ], $user->id);

        return response()->json([
            'message' => 'Password changed successfully. Your new password will expire in 7 days.',
            'user' => $user->load('barangay'),
        ]);
    }
}
