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
 */
class UserController extends Controller
{
    private const LINK_VALID_DAYS = 7;

    public function index()
    {
        return response()->json([
            'data' => User::with('barangay:id,name,code')
                ->with('verifier:id,name')
                ->orderBy('name')
                ->get(),
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
            'verification_status' => 'unverified', // will become 'pending' after activation
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

        // ── Notify other admins about the new account ──
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
            false, // skip email — the admin who did it is right there
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

            // ── Notify the affected user about activation status change ──
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

        // Notify the user their account is verified
        NotificationService::send(
            $user,
            'account.verified',
            'Your account has been verified!',
            'Your Talaghayan account has been verified by a DILG administrator. You now have full access to the system.',
            '/',
            $request->user(),
        );

        // Send email notification
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

        // Notify the user
        NotificationService::send(
            $user,
            'account.rejected',
            'Your account verification was rejected',
            'Your Talaghayan account verification was not approved. Reason: ' . ($data['reason'] ?? 'No reason provided.') . ' Contact the DILG office for assistance.',
            '/',
            $request->user(),
        );

        // Send email notification
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

    /** Permanent deletion directly from the database (super admin only). */
    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        $adminId = $request->user()->id;
        $userName = $user->name;
        $userEmail = $user->email;

        DB::transaction(function () use ($user, $adminId, $userName, $userEmail, $request) {
            // 1. Delete associated sessions/tokens if tables exist
            if (Schema::hasTable('personal_access_tokens')) {
                DB::table('personal_access_tokens')->where('tokenable_type', User::class)->where('tokenable_id', $user->id)->delete();
            }
            if (Schema::hasTable('sessions')) {
                DB::table('sessions')->where('user_id', $user->id)->delete();
            }

            // 2. Remove notifications directed to this user or nullify actor
            if (Schema::hasTable('notifications')) {
                DB::table('notifications')->where('user_id', $user->id)->delete();
                DB::table('notifications')->where('actor_id', $user->id)->update(['actor_id' => null]);
            }

            // 3. Reassign non-nullable author/uploader foreign keys to the deleting admin
            if (Schema::hasTable('repository_documents')) {
                DB::table('repository_documents')->where('uploaded_by', $user->id)->update(['uploaded_by' => $adminId]);
            }
            if (Schema::hasTable('requirement_responses')) {
                DB::table('requirement_responses')->where('uploaded_by', $user->id)->update(['uploaded_by' => $adminId]);
            }
            if (Schema::hasTable('requirements')) {
                DB::table('requirements')->where('created_by', $user->id)->update(['created_by' => $adminId]);
            }
            if (Schema::hasTable('resources')) {
                DB::table('resources')->where('uploaded_by', $user->id)->update(['uploaded_by' => $adminId]);
            }
            if (Schema::hasTable('security_incidents')) {
                DB::table('security_incidents')->where('reported_by', $user->id)->update(['reported_by' => $adminId]);
                DB::table('security_incidents')->where('acknowledged_by', $user->id)->update(['acknowledged_by' => null]);
            }

            // 4. Nullify nullable references
            if (Schema::hasTable('activity_logs')) {
                DB::table('activity_logs')->where('user_id', $user->id)->update(['user_id' => null]);
            }
            if (Schema::hasTable('bagwis_ppa_entries')) {
                DB::table('bagwis_ppa_entries')->where('submitted_by', $user->id)->update(['submitted_by' => null]);
                DB::table('bagwis_ppa_entries')->where('reviewed_by', $user->id)->update(['reviewed_by' => null]);
            }
            if (Schema::hasTable('barangay_announcements')) {
                DB::table('barangay_announcements')->where('created_by', $user->id)->update(['created_by' => null]);
            }
            if (Schema::hasTable('barangay_programs')) {
                DB::table('barangay_programs')->where('created_by', $user->id)->update(['created_by' => null]);
            }
            if (Schema::hasTable('requirement_assignments')) {
                DB::table('requirement_assignments')->where('reviewed_by', $user->id)->update(['reviewed_by' => null]);
            }
            if (Schema::hasTable('submission_files')) {
                DB::table('submission_files')->where('uploaded_by', $user->id)->update(['uploaded_by' => null]);
            }
            if (Schema::hasTable('submissions')) {
                DB::table('submissions')->where('submitted_by', $user->id)->update(['submitted_by' => null]);
                DB::table('submissions')->where('reviewed_by', $user->id)->update(['reviewed_by' => null]);
            }
            DB::table('users')->where('created_by', $user->id)->update(['created_by' => null]);
            DB::table('users')->where('verified_by', $user->id)->update(['verified_by' => null]);

            // 5. Delete profile photo if stored on disk
            if ($user->profile_photo_path) {
                Storage::disk('public')->delete($user->profile_photo_path);
            }

            // 6. Record activity log
            ActivityLog::record('account.deleted', null, [
                'deleted_user_id' => $user->id,
                'deleted_user_name' => $userName,
                'deleted_user_email' => $userEmail,
                'deleted_by' => $request->user()->email,
            ]);

            // 7. Delete directly from the database
            $user->delete();
        });

        return response()->json([
            'message' => "Account {$userName} ({$userEmail}) was permanently deleted from the database.",
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

    /** Best effort: uses the AccountActivation mailable for styled emails. */
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
