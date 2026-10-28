<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FormTemplate extends Model
{
    protected $fillable = [
        'title',
        'description',
        'category',
        'fields',
        'version',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'fields' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function submissions()
    {
        return $this->hasMany(FormSubmission::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
