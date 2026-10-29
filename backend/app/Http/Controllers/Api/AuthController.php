<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\IpBlock;
use App\Models\LoginAttempt;
use App\Models\PasswordHistory;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'barangay_id' => ['nullable', 'integer'],
        ]);

        $ip = $request->ip();

        // ── IP Block check ──
        if (IpBlock::isBlocked($ip)) {
            LoginAttempt::record($credentials['email'], $ip, $request->userAgent(), false, null, 'ip_blocked');
            return response()->json([
                'message' => 'Your IP address has been temporarily blocked due to too many failed login attempts. Please try again later or contact the system administrator.',
            ], 403);
        }

        $user = User::where('email', $credentials['email'])->first();

        // DILG issued this account but its owner has not activated it yet.
        if ($user && $user->isPending()) {
            LoginAttempt::record($credentials['email'], $ip, $request->userAgent(), false, $user->id, 'account_pending');
            throw ValidationException::withMessages([
                'email' => ['This account is not activated yet. Open the activation link the DILG office sent to your email.'],
            ]);
        }

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            LoginAttempt::record($credentials['email'], $ip, $request->userAgent(), false, $user?->id, 'invalid_credentials');

            // Auto-block IP after too many failures
            $maxAttempts = (int) SystemSetting::getValue('max_login_attempts', 10);
            $blockDuration = (int) SystemSetting::getValue('ip_block_duration_minutes', 30);
            $recentFails = LoginAttempt::recentFailedFromIp($ip, 30);

            if ($recentFails >= $maxAttempts) {
                IpBlock::autoBlock($ip, $blockDuration);
            }

            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        // Check if user is archived
        if ($user->archived_at) {
            LoginAttempt::record($credentials['email'], $ip, $request->userAgent(), false, $user->id, 'account_archived');
            throw ValidationException::withMessages([
                'email' => ['This account has been archived. Contact the DILG office.'],
            ]);
        }

        if (!$user->is_active) {
            LoginAttempt::record($credentials['email'], $ip, $request->userAgent(), false, $user->id, 'account_deactivated');
            throw ValidationException::withMessages([
                'email' => ['This account has been deactivated. Contact the DILG office.'],
            ]);
        }

        // Barangay representatives may only sign in through their OWN barangay.
        if (
            !empty($credentials['barangay_id'])
            && $user->isBarangayRep()
            && (int) $user->barangay_id !== (int) $credentials['barangay_id']
        ) {
            $own = $user->barangay?->name ?? 'another barangay';
            LoginAttempt::record($credentials['email'], $ip, $request->userAgent(), false, $user->id, 'wrong_barangay');
            throw ValidationException::withMessages([
                'email' => ["This account belongs to Barangay {$own}. Close this window and pick your own barangay."],
            ]);
        }

        // ── 2FA Check ──
        if ($user->two_factor_enabled && $user->two_factor_confirmed_at) {
            // Don't record success yet — 2FA step still pending
            return response()->json([
                'requires_2fa' => true,
                'user_id' => $user->id,
            ]);
        }

        // ── Successful login ──
        LoginAttempt::record($credentials['email'], $ip, $request->userAgent(), true, null, $user->id);

        Auth::login($user);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        ActivityLog::record('user.login', $user);

        return response()->json([
            'user' => $user->load('barangay'),
        ]);
    }

    /** Which optional sign-in methods this server has set up (the login page hides unused buttons). */
    public function providers()
    {
        return response()->json(['google' => \App\Http\Controllers\GoogleAuthController::enabled()]);
    }

    public function logout(Request $request)
    {
        $user = $request->user() ?? auth('sanctum')->user();
        if ($user) {
            ActivityLog::record('user.logout', $user);
        }

        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['user' => null]);
        }

        $subsystems = match ($user->role) {
            'super_admin' => [
                'talaghayan' => ['access' => 'full'],
                'borms'      => ['access' => 'full'],
                'bagwis'     => ['access' => 'full'],
            ],
            'office_supervisor' => [
                'borms'  => ['access' => 'full'],
                'bagwis' => ['access' => 'full'],
            ],
            'barangay_rep' => [
                'borms'  => ['access' => 'full'],
                'bagwis' => ['access' => 'read_only'],
            ],
            default => [],
        };

        // Get active broadcasts for this user's role
        $broadcasts = \App\Models\SystemBroadcast::activeFor($user->role);

        return response()->json([
            'user'       => $user->load('barangay'),
            'subsystems' => $subsystems,
            'verification' => [
                'status' => $user->verification_status ?? 'unverified',
                'is_pending' => $user->isPendingVerification(),
                'is_verified' => $user->isVerified(),
                'is_rejected' => $user->isRejected(),
                'rejection_reason' => $user->rejection_reason,
                'verified_at' => $user->verified_at?->toISOString(),
            ],
            'security' => [
                'password_expired' => $user->isPasswordExpired(),
                'force_password_change' => (bool) $user->force_password_change,
                'password_changed_at' => $user->password_changed_at?->toISOString(),
                'password_expires_at' => $user->password_expires_at?->toISOString(),
                'two_factor_enabled' => (bool) $user->two_factor_enabled,
                'two_factor_confirmed_at' => $user->two_factor_confirmed_at?->toISOString(),
            ],
            'broadcasts' => $broadcasts,
        ]);
    }

    /** Update allowed profile details (contact number, position, password). */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'contact_number' => ['nullable', 'string', 'max:30'],
            'position' => ['nullable', 'string', 'max:100'],
            'current_password' => ['nullable', 'string'],
            'new_password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        if (!empty($data['new_password'])) {
            if (empty($data['current_password']) || !Hash::check($data['current_password'], $user->password)) {
                return response()->json([
                    'message' => 'Your current password is incorrect.',
                    'errors' => ['current_password' => ['Your current password is incorrect.']],
                ], 422);
            }

            PasswordHistory::create([
                'user_id' => $user->id,
                'password' => $user->password,
                'created_at' => now(),
            ]);

            $user->password = $data['new_password'];
            $user->password_changed_at = now();
            $user->password_expires_at = now()->addDays(7);
            $user->force_password_change = false;
        }

        if (array_key_exists('contact_number', $data)) {
            $user->contact_number = $data['contact_number'] ? trim($data['contact_number']) : null;
        }

        if (array_key_exists('position', $data)) {
            $user->position = $data['position'] ? trim($data['position']) : null;
        }

        $user->save();

        ActivityLog::record('profile.updated', $user, [
            'contact_number' => $user->contact_number,
            'position' => $user->position,
        ], $user->id);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user->load('barangay'),
        ]);
    }
}
