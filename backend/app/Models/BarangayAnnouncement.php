<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BarangayAnnouncement extends Model
{
    protected $fillable = ['barangay_id', 'title', 'body', 'is_pinned', 'published_at', 'created_by'];

    protected function casts(): array
    {
        return [
            'is_pinned' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function barangay()
    {
        return $this->belongsTo(Barangay::class);
    }
}
