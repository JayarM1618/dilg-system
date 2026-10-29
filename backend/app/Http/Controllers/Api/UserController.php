<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\AccountActivation;
use App\Mail\AccountVerified;
use App\Mail\AccountRejected;
use App\Models\ActivityLog;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Accounts are issued by the DILG super admin (route middleware: role:super_admin).
 * Nobody registers themselves: DILG creates the account with an email, the owner only activates it.
 *
 * UPDATED: destroy() now archives instead of permanently deleting.
 */
class UserController extends Controller
{
    private const LINK_VALID_DAYS = 7;

    public function index(Request $request)
    {
        $query = User::with('barangay:id,name,code', 'verifier:id,name');

        // By default, exclude archived users unless ?include_archived=1
        if (!$request->boolean('include_archived')) {
            $query->whereNull('archived_at');
        }

        return response()->json([
            'data' => $query->orderBy('name')->get(),
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
            $data['barangay_id'] = null;
        }

        $user = new User([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'barangay_id' => $data['barangay_id'],
            'is_active' => true,
            'password' => Str::random(40),
            'verification_status' => 'unverified',
        ]);
        $user->created_by = $request->user()->id;
        $user->save();

        $link = $this->issueActivation($user);
        $emailError = null;
        $emailed = $this->sendInvite($user, $link, $emailError);

        ActivityLog::record('account.created', $user, [
            'role' => $user->role,
            'barangay_id' => $user->barangay_id,
            'email' => $user->email,
        ]);

        $roleLabel = match ($user->role) {
            'barangay_rep' => 'Barangay Representative',
            'office_supervisor' => 'Office Supervisor',
            'super_admin' => 'Super Admin',
            default => $user->role,
        };
        NotificationService::notifyOffice(
            'account.created',
            "New account created: {$user->name}",
            "A {$roleLabel} account was created for {$user->email}.",
            '/talaghayan/users',
            $request->user(),
            false,
        );

        return response()->json([
            'user' => $user->load('barangay:id,name,code'),
            'activation_link' => $link,
            'emailed' => $emailed,
            'email_error' => $emailError,
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

            if ($data['is_active']) {
                NotificationService::send(
                    $user,
                    'account.reactivated',
                    'Your account has been reactivated',
                    'Your Talaghayan account is now active again. You can sign in.',
                    '/',
                    $request->user(),
                );
            }
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
            $user->forceFill([
                'password' => Hash::make(Str::random(40)),
                'activated_at' => null,
                'remember_token' => null,
                'verification_status' => 'unverified',
                'verified_at' => null,
                'verified_by' => null,
                'terms_accepted_at' => null,
                'profile_photo_path' => null,
                'first_name' => null,
                'last_name' => null,
                'contact_number' => null,
                'position' => null,
                'rejection_reason' => null,
            ])->save();
        }

        $link = $this->issueActivation($user);
        $emailError = null;
        $emailed = $this->sendInvite($user, $link, $emailError);

        ActivityLog::record($wasActive ? 'account.access_reset' : 'account.invite_resent', $user, ['email' => $user->email]);

        return response()->json([
            'user' => $user->fresh()->load('barangay:id,name,code'),
            'activation_link' => $link,
            'emailed' => $emailed,
            'email_error' => $emailError,
        ]);
    }

    /** Admin verifies (approves) a user's account after reviewing their profile + photo. */
    public function verify(Request $request, User $user)
    {
        if ($user->verification_status !== 'pending') {
            return response()->json([
                'message' => 'This account is not pending verification.',
            ], 422);
        }

        $user->forceFill([
            'verification_status' => 'verified',
            'verified_at' => now(),
            'verified_by' => $request->user()->id,
            'rejection_reason' => null,
        ])->save();

        ActivityLog::record('account.verified', $user, [
            'email' => $user->email,
            'verified_by' => $request->user()->email,
        ]);

        NotificationService::send(
            $user,
            'account.verified',
            'Your account has been verified!',
            'Your Talaghayan account has been verified by a DILG administrator. You now have full access to the system.',
            '/',
            $request->user(),
        );

        try {
            Mail::to($user->email)->send(new AccountVerified($user));
        } catch (\Throwable $e) {
            Log::warning('Verification email failed for ' . $user->email . ': ' . $e->getMessage());
        }

        return response()->json([
            'user' => $user->fresh()->load('barangay:id,name,code', 'verifier:id,name'),
            'message' => 'Account verified successfully.',
        ]);
    }

    /** Admin rejects a user's account (they need to re-activate or contact DILG). */
    public function reject(Request $request, User $user)
    {
        $data = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        if ($user->verification_status !== 'pending') {
            return response()->json([
                'message' => 'This account is not pending verification.',
            ], 422);
        }

        $user->forceFill([
            'verification_status' => 'rejected',
            'rejection_reason' => $data['reason'] ?? null,
        ])->save();

        ActivityLog::record('account.rejected', $user, [
            'email' => $user->email,
            'reason' => $data['reason'] ?? 'No reason provided',
            'rejected_by' => $request->user()->email,
        ]);

        NotificationService::send(
            $user,
            'account.rejected',
            'Your account verification was rejected',
            'Your Talaghayan account verification was not approved. Reason: ' . ($data['reason'] ?? 'No reason provided.') . ' Contact the DILG office for assistance.',
            '/',
            $request->user(),
        );

        try {
            Mail::to($user->email)->send(new AccountRejected($user, $data['reason'] ?? null));
        } catch (\Throwable $e) {
            Log::warning('Rejection email failed for ' . $user->email . ': ' . $e->getMessage());
        }

        return response()->json([
            'user' => $user->fresh()->load('barangay:id,name,code'),
            'message' => 'Account rejected.',
        ]);
    }

    /**
     * ARCHIVE instead of permanent delete.
     * Moves the user to archived state — they can be restored later from the Archive Center.
     * Their sessions are revoked immediately so they cannot log in.
     */
    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot archive your own account.'], 422);
        }

        DB::transaction(function () use ($user, $request) {
            // Revoke all sessions/tokens so the archived user is immediately logged out
            if (Schema::hasTable('personal_access_tokens')) {
                DB::table('personal_access_tokens')
                    ->where('tokenable_type', User::class)
                    ->where('tokenable_id', $user->id)
                    ->delete();
            }
            if (Schema::hasTable('sessions')) {
                DB::table('sessions')->where('user_id', $user->id)->delete();
            }

            // Archive the user (soft archive)
            $user->forceFill([
                'archived_at' => now(),
                'archived_by' => $request->user()->id,
                'is_active'   => false,
            ])->save();

            ActivityLog::record('account.archived', $user, [
                'email'       => $user->email,
                'archived_by' => $request->user()->email,
            ]);
        });

        NotificationService::notifyOffice(
            'account.archived',
            "Account archived: {$user->name}",
            "The account for {$user->email} has been moved to the archive.",
            '/talaghayan/archive',
            $request->user(),
            false,
        );

        return response()->json([
            'message' => "Account {$user->name} ({$user->email}) has been archived. You can restore it from the Archive Center.",
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

    private function sendInvite(User $user, string $link, ?string &$error = null): bool
    {
        if (config('mail.default') === 'log') {
            $error = 'Email delivery is set to log (MAIL_MAILER=log). Configure MAIL_MAILER in Railway variables.';
            return false;
        }

        try {
            Mail::to($user->email)->send(new AccountActivation($user, $link));
            return true;
        } catch (\Throwable $e) {
            $error = $e->getMessage();
            Log::warning('Invite email failed for ' . $user->email . ': ' . $error);
            return false;
        }
    }
}
