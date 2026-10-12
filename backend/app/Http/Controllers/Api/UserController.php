<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Accounts are issued by the DILG super admin (route middleware: role:super_admin).
 * Nobody registers themselves: DILG creates the account with an email, the owner only activates it.
 */
class UserController extends Controller
{
    private const LINK_VALID_DAYS = 7;

    public function index()
    {
        return response()->json([
            'data' => User::with('barangay:id,name,code')->orderBy('name')->get(),
        ]);
    }

    /** Issue a new account (pending until its owner activates it). */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:150', 'unique:users,email'],
            'role' => ['required', Rule::in(['barangay_rep', 'office_supervisor', 'super_admin'])],
            'barangay_id' => ['nullable', 'integer', 'exists:barangays,id'],
        ]);

        if ($data['role'] === 'barangay_rep' && empty($data['barangay_id'])) {
            return response()->json([
                'message' => 'Pick the barangay this representative belongs to.',
                'errors' => ['barangay_id' => ['Pick the barangay this representative belongs to.']],
            ], 422);
        }
        if ($data['role'] !== 'barangay_rep') {
            $data['barangay_id'] = null; // office accounts are not tied to a barangay
        }

        $user = new User([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'barangay_id' => $data['barangay_id'],
            'is_active' => true,
            'password' => Str::random(40), // unusable until the owner chooses their own
        ]);
        $user->created_by = $request->user()->id;
        $user->save();

        $link = $this->issueActivation($user);
        $emailed = $this->sendInvite($user, $link);

        ActivityLog::record('account.created', $user, [
            'role' => $user->role,
            'barangay_id' => $user->barangay_id,
            'email' => $user->email,
        ]);

        return response()->json([
            'user' => $user->load('barangay:id,name,code'),
            'activation_link' => $link,
            'emailed' => $emailed,
        ], 201);
    }

    /** Change name / barangay, or deactivate / reactivate. */
    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'barangay_id' => ['sometimes', 'nullable', 'integer', 'exists:barangays,id'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('is_active', $data) && !$data['is_active'] && $user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 422);
        }
        if ($user->role !== 'barangay_rep') {
            unset($data['barangay_id']);
        } elseif (array_key_exists('barangay_id', $data) && empty($data['barangay_id'])) {
            return response()->json(['message' => 'A barangay representative needs a barangay.'], 422);
        }

        $user->update($data);

        if (array_key_exists('is_active', $data)) {
            ActivityLog::record($data['is_active'] ? 'account.reactivated' : 'account.deactivated', $user, ['email' => $user->email]);
        } else {
            ActivityLog::record('account.updated', $user, ['email' => $user->email]);
        }

        return $user->load('barangay:id,name,code');
    }

    /**
     * New activation link. For a pending account this is a resend; for an activated one it resets
     * access: the old password stops working until the owner activates again.
     */
    public function invite(Request $request, User $user)
    {
        $wasActive = !$user->isPending();

        if ($wasActive && $user->id === $request->user()->id) {
            return response()->json(['message' => 'Use another super admin to reset your own access.'], 422);
        }

        if ($wasActive) {
            $user->forceFill(['password' => Hash::make(Str::random(40)), 'activated_at' => null, 'remember_token' => null])->save();
        }

        $link = $this->issueActivation($user);
        $emailed = $this->sendInvite($user, $link);

        ActivityLog::record($wasActive ? 'account.access_reset' : 'account.invite_resent', $user, ['email' => $user->email]);

        return response()->json([
            'user' => $user->fresh()->load('barangay:id,name,code'),
            'activation_link' => $link,
            'emailed' => $emailed,
        ]);
    }

    /* ---------------- helpers ---------------- */

    private function issueActivation(User $user): string
    {
        $plain = Str::random(48);

        $user->forceFill([
            'activation_token' => hash('sha256', $plain),
            'activation_expires_at' => now()->addDays(self::LINK_VALID_DAYS),
            'invited_at' => now(),
        ])->save();

        return rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/') . '/activate?token=' . $plain;
    }

    /** Best effort: with MAIL_MAILER=log the message lands in storage/logs/laravel.log. */
    private function sendInvite(User $user, string $link): bool
    {
        $where = $user->barangay ? "Barangay {$user->barangay->name}" : 'the DILG Makati office';
        $body = "Hello {$user->name},\n\n"
            . "The DILG Makati office created your Talaghayan account for {$where}.\n"
            . "Open this link to activate it and choose your password (valid for " . self::LINK_VALID_DAYS . " days):\n\n"
            . "{$link}\n\n"
            . "Your sign-in email is {$user->email}. If you did not expect this message, ignore it.\n";

        try {
            Mail::raw($body, fn ($m) => $m->to($user->email)->subject('Activate your Talaghayan account'));

            return config('mail.default') !== 'log';
        } catch (\Throwable $e) {
            Log::warning('Invite email failed: ' . $e->getMessage());

            return false;
        }
    }
}
