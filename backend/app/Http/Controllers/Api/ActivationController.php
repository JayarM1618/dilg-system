<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

/** Public: the owner of a DILG-issued account opens the emailed link and sets a password. */
class ActivationController extends Controller
{
    private function find(string $token): ?User
    {
        return User::with('barangay:id,name')
            ->where('activation_token', hash('sha256', $token))
            ->where('activation_expires_at', '>', now())
            ->whereNull('activated_at')
            ->where('is_active', true)
            ->first();
    }

    public function show(string $token)
    {
        $user = $this->find($token);
        abort_unless($user, 404, 'This activation link is invalid or has expired. Ask the DILG office to send a new one.');

        return response()->json([
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'barangay' => $user->barangay?->name,
        ]);
    }

    public function activate(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $user = $this->find($data['token']);
        abort_unless($user, 404, 'This activation link is invalid or has expired. Ask the DILG office to send a new one.');

        $user->forceFill([
            'password' => $data['password'], // hashed by the model cast
            'activated_at' => now(),
            'email_verified_at' => now(),
            'activation_token' => null,
            'activation_expires_at' => null,
        ])->save();

        ActivityLog::record('account.activated', $user, ['email' => $user->email], $user->id);

        return response()->json(['message' => 'Account activated. You can now sign in.']);
    }
}
