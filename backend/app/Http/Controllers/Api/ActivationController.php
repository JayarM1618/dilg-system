<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

/**
 * Multi-step account activation flow:
 *
 *   Step 1  GET  /api/activate/{token}       → show invite info
 *   Step 2  POST /api/activate/terms          → accept T&C
 *   Step 3  POST /api/activate/profile        → fill profile details + set password
 *   Step 4  POST /api/activate/photo          → upload selfie / capture photo
 *   Step 5  POST /api/activate/complete       → finalize → status becomes "pending" verification
 *
 * Each step validates the token. The user can do steps 2-4 in one session.
 * After step 5, the user can log in but is restricted until an admin verifies.
 */
class ActivationController extends Controller
{
    private function find(string $token): ?User
    {
        return User::with('barangay:id,name')
            ->where('activation_token', hash('sha256', $token))
            ->where('activation_expires_at', '>', now())
            ->where('is_active', true)
            ->first();
    }

    /** Step 1: Validate token and return account info. */
    public function show(string $token)
    {
        $user = $this->find($token);
        abort_unless($user, 404, 'This activation link is invalid or has expired. Ask the DILG office to send a new one.');

        return response()->json([
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'barangay' => $user->barangay?->name,
            // Tell the frontend which steps are already done (resume support)
            'steps_completed' => [
                'terms' => $user->terms_accepted_at !== null,
                'profile' => $user->first_name !== null && $user->last_name !== null,
                'photo' => $user->profile_photo_path !== null,
            ],
        ]);
    }

    /** Step 2: Accept Terms & Conditions. */
    public function acceptTerms(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'accepted' => ['required', 'accepted'],
        ]);

        $user = $this->find($data['token']);
        abort_unless($user, 404, 'This activation link is invalid or has expired. Ask the DILG office to send a new one.');

        $user->forceFill([
            'terms_accepted_at' => now(),
        ])->save();

        return response()->json(['message' => 'Terms accepted.']);
    }

    /** Step 3: Fill profile details + set password. */
    public function saveProfile(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['required', 'string', 'max:120'],
            'contact_number' => ['nullable', 'string', 'max:30'],
            'position' => ['nullable', 'string', 'max:120'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $user = $this->find($data['token']);
        abort_unless($user, 404, 'This activation link is invalid or has expired. Ask the DILG office to send a new one.');

        if (!$user->terms_accepted_at) {
            return response()->json(['message' => 'You must accept the Terms & Conditions first.'], 422);
        }

        $user->forceFill([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'name' => $data['first_name'] . ' ' . $data['last_name'],
            'contact_number' => $data['contact_number'] ?? null,
            'position' => $data['position'] ?? null,
            'password' => $data['password'], // hashed by the model cast
        ])->save();

        return response()->json(['message' => 'Profile saved.']);
    }

    /** Step 4: Upload selfie / captured photo. */
    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'token' => ['required', 'string'],
            'photo' => ['required', 'image', 'max:5120'], // max 5MB
        ]);

        $user = $this->find($request->input('token'));
        abort_unless($user, 404, 'This activation link is invalid or has expired. Ask the DILG office to send a new one.');

        if (!$user->terms_accepted_at) {
            return response()->json(['message' => 'You must accept the Terms & Conditions first.'], 422);
        }
        if (!$user->first_name || !$user->last_name) {
            return response()->json(['message' => 'You must fill in your profile details first.'], 422);
        }

        // Delete old photo if re-uploading
        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
        }

        $path = $request->file('photo')->store('profile-photos', 'public');

        $user->forceFill([
            'profile_photo_path' => $path,
        ])->save();

        return response()->json([
            'message' => 'Photo uploaded.',
            'photo_url' => url('storage/' . $path),
        ]);
    }

    /** Step 5: Finalize activation — account enters "pending verification" state. */
    public function complete(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
        ]);

        $user = $this->find($data['token']);
        abort_unless($user, 404, 'This activation link is invalid or has expired. Ask the DILG office to send a new one.');

        // Ensure all steps are complete
        if (!$user->terms_accepted_at) {
            return response()->json(['message' => 'You must accept the Terms & Conditions first.'], 422);
        }
        if (!$user->first_name || !$user->last_name) {
            return response()->json(['message' => 'You must fill in your profile details first.'], 422);
        }
        if (!$user->profile_photo_path) {
            return response()->json(['message' => 'You must take a photo of yourself first.'], 422);
        }

        $user->forceFill([
            'activated_at' => now(),
            'email_verified_at' => now(),
            'activation_token' => null,
            'activation_expires_at' => null,
            'verification_status' => 'pending',
        ])->save();

        ActivityLog::record('account.activated', $user, ['email' => $user->email], $user->id);

        // Notify admins that someone completed activation and needs verification
        $roleLabel = match ($user->role) {
            'barangay_rep' => 'Barangay Representative',
            'office_supervisor' => 'Office Supervisor',
            'super_admin' => 'Super Admin',
            default => $user->role,
        };

        NotificationService::notifyOffice(
            'account.pending_verification',
            "Account awaiting verification: {$user->name}",
            "{$user->name} ({$roleLabel}) has completed activation and is waiting for account verification.",
            '/talaghayan/users',
            null,
            true,
        );

        return response()->json([
            'message' => 'Account activated! Your account is now pending verification by a DILG administrator. You can sign in, but access is restricted until verified.',
        ]);
    }

    /**
     * Legacy single-step activation (kept for backward compatibility).
     * If a user somehow hits this old endpoint, it still works but sets verification_status to 'pending'.
     */
    public function activate(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $user = $this->find($data['token']);
        abort_unless($user, 404, 'This activation link is invalid or has expired. Ask the DILG office to send a new one.');

        $user->forceFill([
            'password' => $data['password'],
            'activated_at' => now(),
            'email_verified_at' => now(),
            'activation_token' => null,
            'activation_expires_at' => null,
            'verification_status' => 'pending',
        ])->save();

        ActivityLog::record('account.activated', $user, ['email' => $user->email], $user->id);

        return response()->json(['message' => 'Account activated. Your account is pending verification.']);
    }
}
