<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Resource extends Model
{
    protected $fillable = [
        'report_category_id',
        'title',
        'type',
        'description',
        'file_path',
        'original_filename',
        'sha256',
        'version',
        'is_current',
        'effective_date',
        'archived_at',
        'uploaded_by',
    ];

    // The storage path is internal - never send it to the browser.
    protected $hidden = ['file_path'];

    protected function casts(): array
    {
        return [
            'is_current' => 'boolean',
            'effective_date' => 'date',
            'archived_at' => 'datetime',
        ];
    }

    public function category()
    {
        return $this->belongsTo(ReportCategory::class, 'report_category_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /** What barangays are allowed to see/download: the live version only. */
    public function scopeAvailable($query)
    {
        return $query->where('is_current', true)->whereNull('archived_at');
    }
}
