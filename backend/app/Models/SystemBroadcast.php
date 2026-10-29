<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemBroadcast extends Model
{
    protected $fillable = [
        'title', 'message', 'type', 'target',
        'is_active', 'is_dismissible',
        'starts_at', 'ends_at', 'created_by',
    ];

    protected $casts = [
        'is_active'      => 'boolean',
        'is_dismissible' => 'boolean',
        'starts_at'      => 'datetime',
        'ends_at'        => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get active broadcasts for a given role.
     */
    public static function activeFor(string $role): \Illuminate\Database\Eloquent\Collection
    {
        return static::where('is_active', true)
            ->whereIn('target', ['all', $role])
            ->where(function ($q) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
            })
            ->orderByDesc('created_at')
            ->get();
    }
}
