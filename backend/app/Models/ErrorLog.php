<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ErrorLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'level', 'channel', 'message', 'context', 'trace',
        'file', 'line', 'url', 'method',
        'user_id', 'ip_address', 'logged_at',
    ];

    protected $casts = [
        'logged_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Log an application error.
     */
    public static function capture(\Throwable $e, ?int $userId = null, ?string $ip = null, ?string $url = null, ?string $method = null): static
    {
        return static::create([
            'level'      => 'error',
            'channel'    => 'application',
            'message'    => substr($e->getMessage(), 0, 1000),
            'context'    => json_encode(['class' => get_class($e)]),
            'trace'      => substr($e->getTraceAsString(), 0, 5000),
            'file'       => $e->getFile(),
            'line'       => $e->getLine(),
            'url'        => $url,
            'method'     => $method,
            'user_id'    => $userId,
            'ip_address' => $ip,
            'logged_at'  => now(),
        ]);
    }
}
