<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportTicket extends Model
{
    public const CATEGORIES = [
        'borms_reporting' => 'BORMS & 3 Rs Reporting',
        'deadline_extension' => 'Deadline Extension Request',
        'technical_issue' => 'Technical System Issue',
        'policy_inquiry' => 'Policy / Memorandum Clarification',
        'compliance_dispute' => 'Compliance / Returned Report Dispute',
        'general_inquiry' => 'General Inquiry',
    ];

    public const PRIORITIES = ['normal', 'urgent', 'critical'];

    public const STATUSES = [
        'pending_acceptance' => 'Waiting for DILG Acceptance',
        'in_progress' => 'Active Communication',
        'escalated' => 'Escalated to Super Admin',
        'resolved' => 'Resolved',
        'closed' => 'Closed',
    ];

    protected $fillable = [
        'ticket_number',
        'barangay_id',
        'user_id',
        'category',
        'subject',
        'description',
        'priority',
        'status',
        'accepted_by',
        'accepted_at',
        'escalated_by',
        'escalation_reason',
        'escalated_at',
        'resolved_by',
        'resolution_notes',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'accepted_at' => 'datetime',
            'escalated_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function barangay()
    {
        return $this->belongsTo(Barangay::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function acceptedBy()
    {
        return $this->belongsTo(User::class, 'accepted_by');
    }

    public function escalatedBy()
    {
        return $this->belongsTo(User::class, 'escalated_by');
    }

    public function resolvedBy()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function messages()
    {
        return $this->hasMany(SupportTicketMessage::class)->orderBy('created_at', 'asc');
    }

    public function isPendingAcceptance(): bool
    {
        return $this->status === 'pending_acceptance';
    }

    public function isInProgress(): bool
    {
        return $this->status === 'in_progress';
    }

    public function isEscalated(): bool
    {
        return $this->status === 'escalated';
    }

    public function isResolved(): bool
    {
        return in_array($this->status, ['resolved', 'closed'], true);
    }
}

