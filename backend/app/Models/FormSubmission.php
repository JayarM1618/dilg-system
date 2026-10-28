<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FormSubmission extends Model
{
    protected $fillable = [
        'form_template_id',
        'requirement_id',
        'barangay_id',
        'data',
        'status',
        'submitted_at',
        'submitted_by',
        'reviewed_at',
        'reviewed_by',
        'review_notes',
        'signature_data',
        'signature_name',
        'signature_position',
        'signed_at',
    ];

    protected $hidden = ['signature_data']; // Large base64 — only load when needed

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'signed_at' => 'datetime',
        ];
    }

    public function template()
    {
        return $this->belongsTo(FormTemplate::class, 'form_template_id');
    }

    public function requirement()
    {
        return $this->belongsTo(Requirement::class);
    }

    public function barangay()
    {
        return $this->belongsTo(Barangay::class);
    }

    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /** Whether the form has a valid e-signature. */
    public function isSigned(): bool
    {
        return $this->signature_data !== null && $this->signed_at !== null;
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeSubmitted($query)
    {
        return $query->where('status', 'submitted');
    }
}
