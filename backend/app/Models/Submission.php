<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    protected $fillable = [
        'barangay_id',
        'report_category_id',
        'period_label',
        'period_start',
        'period_end',
        'due_date',
        'file_path',
        'original_filename',
        'status',
        'submitted_by',
        'submitted_at',
        'reviewed_by',
        'reviewed_at',
        'review_remarks',
    ];

    /** Sent to the frontend with every submission so the browser never has to guess dates. */
    protected $appends = ['is_overdue'];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'due_date' => 'date',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function barangay()
    {
        return $this->belongsTo(Barangay::class);
    }

    public function category()
    {
        return $this->belongsTo(ReportCategory::class, 'report_category_id');
    }

    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function files()
    {
        return $this->hasMany(SubmissionFile::class)->orderByDesc('version');
    }

    public function latestFile()
    {
        return $this->hasOne(SubmissionFile::class)->latestOfMany('version');
    }

    public function getIsOverdueAttribute(): bool
    {
        return $this->status === 'pending'
            && $this->due_date !== null
            && now()->isAfter($this->due_date->copy()->endOfDay());
    }

    /** The due date is a whole day: filing at 9am on the due date is still on time. */
    public function isLate(): bool
    {
        $deadline = $this->due_date->copy()->endOfDay();

        if (!$this->submitted_at) {
            return $this->status === 'pending' && now()->isAfter($deadline);
        }

        return $this->submitted_at->isAfter($deadline);
    }
}
