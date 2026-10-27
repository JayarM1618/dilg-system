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
        'first_name',
        'last_name',
        'contact_number',
        'position',
        'email',
        'password',
        'role',
        'barangay_id',
        'is_active',
        'invited_at',
        'activated_at',
        'activation_token',
        'activation_expires_at',
        'terms_accepted_at',
        'profile_photo_path',
        'verification_status',
        'verified_at',
        'verified_by',
        'rejection_reason',
        'created_by',
        // Password rotation
        'password_changed_at',
        'password_expires_at',
        'force_password_change',
        // 2FA
        'two_factor_enabled',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'activation_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected $appends = ['status', 'profile_photo_url'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'invited_at' => 'datetime',
            'activated_at' => 'datetime',
            'activation_expires_at' => 'datetime',
            'terms_accepted_at' => 'datetime',
            'verified_at' => 'datetime',
            'password_changed_at' => 'datetime',
            'password_expires_at' => 'datetime',
            'force_password_change' => 'boolean',
            'two_factor_enabled' => 'boolean',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function barangay()
    {
        return $this->belongsTo(Barangay::class);
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class, 'submitted_by');
    }

    public function securityIncidents()
    {
        return $this->hasMany(SecurityIncident::class, 'reported_by');
    }

    public function passwordHistories()
    {
        return $this->hasMany(PasswordHistory::class)->orderByDesc('created_at');
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

    /**
     * Account status displayed across the system:
     * - 'deactivated': account disabled by admin
     * - 'pending': issued by DILG, user hasn't completed activation link yet
     * - 'pending_verification': user completed activation link (profile + selfie), waiting for admin review & activation
     * - 'rejected': admin reviewed and rejected
     * - 'active': verified and fully active
     */
    public function getStatusAttribute(): string
    {
        if (!$this->is_active) {
            return 'deactivated';
        }

        if ($this->isPending()) {
            return 'pending';
        }

        if ($this->verification_status === 'pending') {
            return 'pending_verification';
        }

        if ($this->verification_status === 'rejected') {
            return 'rejected';
        }

        return 'active';
    }

    public function getProfilePhotoUrlAttribute(): ?string
    {
        return $this->profile_photo_path ? url('storage/' . $this->profile_photo_path) : null;
    }

    public function isPendingVerification(): bool
    {
        return $this->verification_status === 'pending';
    }

    public function isVerified(): bool
    {
        return $this->verification_status === 'verified';
    }

    public function isRejected(): bool
    {
        return $this->verification_status === 'rejected';
    }

    public function isUnverified(): bool
    {
        return $this->verification_status === 'unverified' || $this->verification_status === null;
    }

    /** Check if this user's password is expired (older than 7 days). Super admins exempt. */
    public function isPasswordExpired(): bool
    {
        if ($this->isSuperAdmin()) {
            return false;
        }

        if ($this->force_password_change) {
            return true;
        }

        if (!$this->password_changed_at) {
            // If never set and account is activated, it's expired
            return $this->activated_at !== null;
        }

        return $this->password_changed_at->diffInDays(now()) >= 7;
    }
}
