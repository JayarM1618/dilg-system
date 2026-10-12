<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Barangay extends Model
{
    protected $fillable = [
        'name',
        'code',
        'about',
        'hall_address',
        'hotline',
        'office_hours',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function announcements()
    {
        return $this->hasMany(BarangayAnnouncement::class);
    }

    public function programs()
    {
        return $this->hasMany(BarangayProgram::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }
}
