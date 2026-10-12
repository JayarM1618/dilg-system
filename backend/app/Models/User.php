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
        'invited_at',
        'activated_at',
        'activation_token',
        'activation_expires_at',
        'created_by',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'activation_token',
    ];

    protected $appends = ['status'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'invited_at' => 'datetime',
            'activated_at' => 'datetime',
            'activation_expires_at' => 'datetime',
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

    /** Issued by DILG but the owner has not set a password yet. */
    public function isPending(): bool
    {
        return $this->activated_at === null;
    }

    /** pending | active | deactivated - what the Accounts page shows. */
    public function getStatusAttribute(): string
    {
        if (!$this->is_active) {
            return 'deactivated';
        }

        return $this->isPending() ? 'pending' : 'active';
    }
}
