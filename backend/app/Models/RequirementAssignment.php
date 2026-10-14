<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequirementAssignment extends Model
{
    protected $fillable = [
        'requirement_id', 'barangay_id', 'status', 'received_at', 'submitted_at',
        'reviewed_by', 'reviewed_at', 'review_notes',
    ];

    protected function casts(): array
    {
        return [
            'received_at' => 'datetime',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function requirement()
    {
        return $this->belongsTo(Requirement::class);
    }

    public function barangay()
    {
        return $this->belongsTo(Barangay::class);
    }

    public function responses()
    {
        return $this->hasMany(RequirementResponse::class, 'assignment_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
