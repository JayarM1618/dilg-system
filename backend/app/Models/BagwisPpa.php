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
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function entries()
    {
        return $this->hasMany(BagwisPpaEntry::class);
    }
}
