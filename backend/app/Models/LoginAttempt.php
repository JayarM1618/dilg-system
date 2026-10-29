<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginAttempt extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'email', 'ip_address', 'user_agent', 'successful',
        'user_id', 'failure_reason', 'attempted_at',
    ];

    protected $casts = [
        'successful'   => 'boolean',
        'attempted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Record a login attempt.
     */
    public static function record(string $email, string $ip, ?string $ua, bool $success, ?int $userId = null, ?string $reason = null): static
    {
        return static::create([
            'email'          => $email,
            'ip_address'     => $ip,
            'user_agent'     => $ua ? substr($ua, 0, 255) : null,
            'successful'     => $success,
            'user_id'        => $userId,
            'failure_reason' => $reason,
            'attempted_at'   => now(),
        ]);
    }

    /**
     * Count recent failed attempts from an IP.
     */
    public static function recentFailedFromIp(string $ip, int $minutes = 30): int
    {
        return static::where('ip_address', $ip)
            ->where('successful', false)
            ->where('attempted_at', '>=', now()->subMinutes($minutes))
            ->count();
    }
}
