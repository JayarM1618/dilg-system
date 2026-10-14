<?php

namespace App\Services;

use App\Mail\SystemNotification;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Central hub for sending in-app + email notifications.
 * Every controller calls NotificationService::send() instead of handling its own.
 */
class NotificationService
{
    /**
     * Send a notification to one or more users.
     *
     * @param  Collection|array|User  $recipients  User(s) to notify
     * @param  string  $type       Category slug (requirement.new, submission.reviewed, etc.)
     * @param  string  $title      Short heading shown in the notification bell
     * @param  string  $body       One-line description
     * @param  string|null  $actionUrl  Frontend path (e.g. /user/requirements)
     * @param  User|null  $actor     Who triggered this (shown as "Name did X")
     * @param  bool  $email       Also send an email notification
     */
    public static function send(
        Collection|array|User $recipients,
        string $type,
        string $title,
        string $body,
        ?string $actionUrl = null,
        ?User $actor = null,
        bool $email = true,
    ): void {
        if ($recipients instanceof User) {
            $recipients = collect([$recipients]);
        }
        if (is_array($recipients)) {
            $recipients = collect($recipients);
        }

        // Don't notify yourself
        $actorId = $actor?->id;
        $recipients = $recipients->filter(fn (User $u) => $u->id !== $actorId && $u->is_active);

        foreach ($recipients as $user) {
            // 1. In-app notification (always)
            Notification::create([
                'user_id'    => $user->id,
                'type'       => $type,
                'title'      => $title,
                'body'       => $body,
                'action_url' => $actionUrl,
                'actor_id'   => $actorId,
            ]);

            // 2. Email notification (if enabled and mailer is configured)
            if ($email && config('mail.default') !== 'log') {
                try {
                    Mail::to($user->email)->send(
                        new SystemNotification($user, $title, $body, $actionUrl, $actor)
                    );
                } catch (\Throwable $e) {
                    Log::warning("Notification email failed for {$user->email}: {$e->getMessage()}");
                }
            }
        }
    }

    /** Notify all users with office oversight (supervisors + super admins). */
    public static function notifyOffice(
        string $type, string $title, string $body,
        ?string $actionUrl = null, ?User $actor = null, bool $email = true,
    ): void {
        $staff = User::where('is_active', true)
            ->whereIn('role', ['super_admin', 'office_supervisor'])
            ->get();

        static::send($staff, $type, $title, $body, $actionUrl, $actor, $email);
    }

    /** Notify all barangay reps (optionally filtered to one barangay). */
    public static function notifyBarangay(
        ?int $barangayId, string $type, string $title, string $body,
        ?string $actionUrl = null, ?User $actor = null, bool $email = true,
    ): void {
        $query = User::where('is_active', true)->where('role', 'barangay_rep');

        if ($barangayId) {
            $query->where('barangay_id', $barangayId);
        }

        static::send($query->get(), $type, $title, $body, $actionUrl, $actor, $email);
    }

    /** Notify all barangay reps for multiple barangays. */
    public static function notifyBarangays(
        array $barangayIds, string $type, string $title, string $body,
        ?string $actionUrl = null, ?User $actor = null, bool $email = true,
    ): void {
        $reps = User::where('is_active', true)
            ->where('role', 'barangay_rep')
            ->whereIn('barangay_id', $barangayIds)
            ->get();

        static::send($reps, $type, $title, $body, $actionUrl, $actor, $email);
    }
}
