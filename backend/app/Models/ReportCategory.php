<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportCategory extends Model
{
    protected $fillable = [
        'name',
        'cycle',
        'description',
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
        return $this->hasOne(Resource::class)->latestOfMany();
    }
}
