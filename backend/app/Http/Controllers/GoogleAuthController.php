<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * Optional "Continue with Google". Nobody can register with Google: the email Google returns
 * must already belong to an account the DILG super admin issued. If that account is still waiting
 * to be activated, Google proving the owner controls the email activates it (no password needed)
 * but the user still needs to complete the activation flow (T&C, profile, photo) before being
 * verified.
 *
 * Needs:  composer require laravel/socialite   and the GOOGLE_* values in .env
 */
class GoogleAuthController extends Controller
{
    public static function enabled(): bool
    {
        return class_exists(\Laravel\Socialite\Facades\Socialite::class)
            && filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'));
    }

    private function back(string $error): \Illuminate\Http\RedirectResponse
    {
        return redirect(rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/') . '/login?error=' . urlencode($error));
    }

    public function redirect()
    {
        if (!self::enabled()) {
            return $this->back('Google sign-in is not set up on this server.');
        }

        return \Laravel\Socialite\Facades\Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        if (!self::enabled()) {
            return $this->back('Google sign-in is not set up on this server.');
        }

        try {
            $google = \Laravel\Socialite\Facades\Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            return $this->back('Google sign-in was cancelled or failed. Please try again.');
        }

        $email = Str::lower((string) $google->getEmail());
        $raw = (array) ($google->user ?? []);
        $verified = ($raw['email_verified'] ?? $raw['verified_email'] ?? true) !== false;

        $user = $email && $verified ? User::whereRaw('lower(email) = ?', [$email])->first() : null;

        if (!$user) {
            return $this->back('That Google account has no DILG-issued account. Ask the DILG Makati office to create one for your email.');
        }
        if (!$user->is_active) {
            return $this->back('This account has been deactivated. Contact the DILG office.');
        }

        $wasPending = $user->isPending();
        if ($wasPending) {
            // Google proves they own the email, but they still need to complete
            // the activation flow (T&C, profile, photo). We redirect them there
            // if an activation token exists.
            if ($user->activation_token) {
                return redirect(
                    rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/')
                    . '/activate?token=' . $user->activation_token
                    . '&via=google'
                );
            }

            // No token (edge case) - activate directly but set pending verification
            $user->forceFill([
                'activated_at' => now(),
                'email_verified_at' => now(),
                'activation_token' => null,
                'activation_expires_at' => null,
                'verification_status' => 'pending',
            ])->save();
            ActivityLog::record('account.activated', $user, ['email' => $user->email, 'via' => 'google'], $user->id);
        }

        Auth::login($user);
        request()->session()->regenerate();
        ActivityLog::record('user.login_google', $user, [], $user->id);

        return redirect(rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/') . '/login?signed_in=1');
    }
}
