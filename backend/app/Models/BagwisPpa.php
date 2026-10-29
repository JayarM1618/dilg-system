<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BagwisPpa extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'frequency',
        'responsible_office',
        'description',
        'deadline_description',
        'attachment_path',
        'attachment_name',
        'attachment_size',
        'attachment_mime',
        'created_by',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'attachment_size' => 'integer',
        ];
    }

    public function entries()
    {
        return $this->hasMany(BagwisPpaEntry::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
