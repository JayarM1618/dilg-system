<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * TOTP-based Two-Factor Authentication (like Google Authenticator / GitHub).
 *
 * Flow:
 * 1. POST /api/two-factor/enable  — generates a secret + QR code URI
 * 2. POST /api/two-factor/confirm — user enters the 6-digit code to confirm setup
 * 3. On every login: POST /api/two-factor/verify — user enters TOTP code
 * 4. POST /api/two-factor/disable — removes 2FA
 *
 * Uses the TOTP algorithm (RFC 6238) implemented in pure PHP — no external package needed.
 */
class TwoFactorController extends Controller
{
    /** Enable 2FA: generate secret + return QR provisioning URI. */
    public function enable(Request $request)
    {
        $user = $request->user();

        if ($user->two_factor_enabled && $user->two_factor_confirmed_at) {
            return response()->json([
                'message' => 'Two-factor authentication is already enabled.',
            ], 422);
        }

        // Generate a new secret (20 bytes = 32 base32 chars)
        $secret = self::generateSecret();

        // Generate recovery codes
        $recoveryCodes = Collection::times(8, fn () => Str::random(10))->all();

        // Save secret (encrypted) but DON'T enable yet — wait for confirm
        $user->forceFill([
            'two_factor_secret' => Crypt::encryptString($secret),
            'two_factor_recovery_codes' => Crypt::encryptString(json_encode(
                array_map(fn ($code) => Hash::make($code), $recoveryCodes)
            )),
            'two_factor_enabled' => false,
            'two_factor_confirmed_at' => null,
        ])->save();

        $appName = config('app.name', 'DILG Talaghayan');
        $otpauthUri = "otpauth://totp/" . rawurlencode($appName) . ":" . rawurlencode($user->email)
            . "?secret=" . $secret
            . "&issuer=" . rawurlencode($appName)
            . "&algorithm=SHA1&digits=6&period=30";

        return response()->json([
            'secret' => $secret,
            'qr_uri' => $otpauthUri,
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    /** Confirm 2FA setup by verifying a TOTP code from the user's authenticator app. */
    public function confirm(Request $request)
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = $request->user();

        if (!$user->two_factor_secret) {
            return response()->json([
                'message' => 'You have not started 2FA setup. Call enable first.',
            ], 422);
        }

        if ($user->two_factor_confirmed_at) {
            return response()->json([
                'message' => 'Two-factor authentication is already confirmed.',
            ], 422);
        }

        $secret = Crypt::decryptString($user->two_factor_secret);

        if (!self::verifyTotp($secret, $request->input('code'))) {
            return response()->json([
                'message' => 'Invalid verification code. Please check your authenticator app and try again.',
                'errors' => ['code' => ['Invalid code.']],
            ], 422);
        }

        $user->forceFill([
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ])->save();

        ActivityLog::record('security.2fa_enabled', $user, [
            'email' => $user->email,
        ], $user->id);

        return response()->json([
            'message' => 'Two-factor authentication has been enabled.',
        ]);
    }

    /** Verify TOTP code during login. */
    public function verify(Request $request)
    {
        $request->validate([
            'code' => ['required', 'string'],
            'user_id' => ['required', 'integer'],
        ]);

        $user = \App\Models\User::findOrFail($request->input('user_id'));

        if (!$user->two_factor_enabled) {
            return response()->json([
                'message' => 'Two-factor authentication is not enabled for this account.',
            ], 422);
        }

        $code = $request->input('code');
        $secret = Crypt::decryptString($user->two_factor_secret);

        // Try TOTP first
        if (self::verifyTotp($secret, $code)) {
            // Log in the user via session
            \Illuminate\Support\Facades\Auth::login($user);
            if ($request->hasSession()) {
                $request->session()->regenerate();
            }

            ActivityLog::record('user.login_2fa', $user, [], $user->id);

            return response()->json([
                'message' => 'Two-factor verification successful.',
                'user' => $user->load('barangay'),
            ]);
        }

        // Try recovery code
        $recoveryCodes = json_decode(Crypt::decryptString($user->two_factor_recovery_codes), true);
        $codeUsed = false;
        $remaining = [];

        foreach ($recoveryCodes as $hashedCode) {
            if (!$codeUsed && Hash::check($code, $hashedCode)) {
                $codeUsed = true;
                // Don't add this one to remaining (it's consumed)
            } else {
                $remaining[] = $hashedCode;
            }
        }

        if ($codeUsed) {
            // Save remaining recovery codes
            $user->forceFill([
                'two_factor_recovery_codes' => Crypt::encryptString(json_encode($remaining)),
            ])->save();

            \Illuminate\Support\Facades\Auth::login($user);
            if ($request->hasSession()) {
                $request->session()->regenerate();
            }

            ActivityLog::record('user.login_2fa_recovery', $user, [
                'recovery_codes_remaining' => count($remaining),
            ], $user->id);

            return response()->json([
                'message' => 'Signed in with recovery code. You have ' . count($remaining) . ' recovery code(s) remaining.',
                'user' => $user->load('barangay'),
                'recovery_codes_remaining' => count($remaining),
            ]);
        }

        return response()->json([
            'message' => 'Invalid authentication code. Please try again.',
            'errors' => ['code' => ['Invalid code.']],
        ], 422);
    }

    /** Disable 2FA. */
    public function disable(Request $request)
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (!Hash::check($request->input('password'), $user->password)) {
            return response()->json([
                'message' => 'Incorrect password.',
                'errors' => ['password' => ['Incorrect password.']],
            ], 422);
        }

        $user->forceFill([
            'two_factor_enabled' => false,
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        ActivityLog::record('security.2fa_disabled', $user, [
            'email' => $user->email,
        ], $user->id);

        return response()->json([
            'message' => 'Two-factor authentication has been disabled.',
        ]);
    }

    /** Get current 2FA status for the authenticated user. */
    public function status(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'enabled' => (bool) $user->two_factor_enabled,
            'confirmed_at' => $user->two_factor_confirmed_at?->toISOString(),
        ]);
    }

    /* ─────────── TOTP Implementation (RFC 6238) ─────────── */

    /** Generate a random 20-byte secret, base32-encoded. */
    private static function generateSecret(int $length = 20): string
    {
        $bytes = random_bytes($length);
        return self::base32Encode($bytes);
    }

    /** Verify a TOTP code against a secret. Allows ±1 time step for clock drift. */
    private static function verifyTotp(string $secret, string $code, int $window = 1): bool
    {
        $binarySecret = self::base32Decode($secret);
        $timeStep = 30;
        $currentTime = (int) floor(time() / $timeStep);

        for ($i = -$window; $i <= $window; $i++) {
            $calculatedCode = self::generateTotp($binarySecret, $currentTime + $i);
            if (hash_equals($calculatedCode, $code)) {
                return true;
            }
        }

        return false;
    }

    /** Generate a 6-digit TOTP code for a given time counter. */
    private static function generateTotp(string $binarySecret, int $counter): string
    {
        // Pack counter as 8-byte big-endian
        $counterBytes = pack('N*', 0, $counter);
        $hash = hash_hmac('sha1', $counterBytes, $binarySecret, true);

        // Dynamic truncation
        $offset = ord($hash[19]) & 0x0F;
        $code = (
            ((ord($hash[$offset]) & 0x7F) << 24) |
            ((ord($hash[$offset + 1]) & 0xFF) << 16) |
            ((ord($hash[$offset + 2]) & 0xFF) << 8) |
            (ord($hash[$offset + 3]) & 0xFF)
        ) % 1000000;

        return str_pad((string) $code, 6, '0', STR_PAD_LEFT);
    }

    /** Base32 encode bytes to string. */
    private static function base32Encode(string $data): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $binary = '';
        foreach (str_split($data) as $char) {
            $binary .= str_pad(decbin(ord($char)), 8, '0', STR_PAD_LEFT);
        }
        $result = '';
        foreach (str_split($binary, 5) as $chunk) {
            $chunk = str_pad($chunk, 5, '0', STR_PAD_RIGHT);
            $result .= $alphabet[bindec($chunk)];
        }
        return $result;
    }

    /** Base32 decode string to bytes. */
    private static function base32Decode(string $data): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $data = strtoupper(rtrim($data, '='));
        $binary = '';
        foreach (str_split($data) as $char) {
            $index = strpos($alphabet, $char);
            if ($index === false) continue;
            $binary .= str_pad(decbin($index), 5, '0', STR_PAD_LEFT);
        }
        $result = '';
        foreach (str_split($binary, 8) as $byte) {
            if (strlen($byte) < 8) break;
            $result .= chr(bindec($byte));
        }
        return $result;
    }
}
