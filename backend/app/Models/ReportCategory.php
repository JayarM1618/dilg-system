<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'cycle',
        'description',
        'sector',
        'scope',
        'deadline_description',
        'barangay_action',
        'supervisor_action',
        'sort_order',
    ];

    public function resources()
    {
        return $this->hasMany(Resource::class);
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }

    /** The current/latest template version for this category. */
    public function latestResource()
    {
        return $this->hasOne(Resource::class)
            ->where('type', 'template')
            ->where('is_current', true)
            ->whereNull('archived_at')
            ->latestOfMany();
    }
}
