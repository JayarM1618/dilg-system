<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IpBlock extends Model
{
    protected $fillable = [
        'ip_address', 'reason', 'type', 'blocked_by',
        'blocked_at', 'expires_at', 'is_active',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'blocked_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function blocker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocked_by');
    }

    /**
     * Check if an IP is currently blocked.
     */
    public static function isBlocked(string $ip): bool
    {
        return static::where('ip_address', $ip)
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            })
            ->exists();
    }

    /**
     * Auto-block an IP after too many failed login attempts.
     */
    public static function autoBlock(string $ip, int $durationMinutes): static
    {
        return static::updateOrCreate(
            ['ip_address' => $ip],
            [
                'reason'     => 'Auto-blocked: exceeded maximum failed login attempts',
                'type'       => 'auto',
                'blocked_at' => now(),
                'expires_at' => $durationMinutes > 0 ? now()->addMinutes($durationMinutes) : null,
                'is_active'  => true,
            ]
        );
    }
}
