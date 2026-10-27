<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Checks every barangay_rep and office_supervisor whose password
 * is older than 7 days and forces them to change it on next login.
 *
 * Runs daily via Laravel scheduler. Does NOT auto-reset the password;
 * it sets a flag so the user chooses their own new one.
 */
class RotatePasswords extends Command
{
    protected $signature = 'passwords:check-expiry';
    protected $description = 'Flag accounts with expired passwords (>7 days) to force a change on next login';

    /** Password lifetime in days for non-super_admin roles. */
    private const EXPIRE_DAYS = 7;

    public function handle(): int
    {
        $cutoff = now()->subDays(self::EXPIRE_DAYS);

        // Find users whose password is expired and hasn't been flagged yet
        $users = User::whereIn('role', ['barangay_rep', 'office_supervisor'])
            ->where('is_active', true)
            ->where('force_password_change', false)
            ->whereNotNull('activated_at') // only activated accounts
            ->where(function ($q) use ($cutoff) {
                $q->where('password_changed_at', '<', $cutoff)
                  ->orWhereNull('password_changed_at'); // never set = expired
            })
            ->get();

        $flagged = 0;

        foreach ($users as $user) {
            $user->forceFill([
                'force_password_change' => true,
                'password_expires_at' => now(), // mark as expired now
            ])->save();

            // Notify the user
            try {
                NotificationService::send(
                    $user,
                    'security.password_expired',
                    'Your password has expired',
                    'Your password is older than 7 days. You must create a new password on your next sign-in.',
                    '/',
                    null,
                    false,
                );
            } catch (\Throwable $e) {
                Log::warning("Could not notify user {$user->id} about password expiry: {$e->getMessage()}");
            }

            ActivityLog::record('security.password_expired', $user, [
                'email' => $user->email,
                'days_since_change' => $user->password_changed_at
                    ? (int) $user->password_changed_at->diffInDays(now())
                    : 'never',
            ]);

            $flagged++;
        }

        $this->info("Flagged {$flagged} account(s) for password change.");

        return self::SUCCESS;
    }
}
