<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'barangay_id',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function barangay()
    {
        return $this->belongsTo(Barangay::class);
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class, 'submitted_by');
    }

    public function securityIncidents()
    {
        return $this->hasMany(SecurityIncident::class, 'reported_by');
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isOfficeSupervisor(): bool
    {
        return $this->role === 'office_supervisor';
    }

    public function isBarangayRep(): bool
    {
        return $this->role === 'barangay_rep';
    }

    /** Office staff/supervisors see everything; barangay reps only their own. */
    public function hasOfficeOversight(): bool
    {
        return in_array($this->role, ['super_admin', 'office_supervisor']);
    }
}
