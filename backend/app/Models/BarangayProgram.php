<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BarangayProgram extends Model
{
    public const KINDS = ['event', 'program'];

    public const CATEGORIES = [
        'health', 'livelihood', 'education', 'peace_and_order',
        'environment', 'sports_youth', 'social_services', 'other',
    ];

    protected $fillable = [
        'barangay_id', 'kind', 'title', 'description', 'category',
        'venue', 'starts_at', 'ends_at', 'schedule_note', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function barangay()
    {
        return $this->belongsTo(Barangay::class);
    }
}
