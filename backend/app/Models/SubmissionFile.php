<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubmissionFile extends Model
{
    protected $fillable = [
        'submission_id',
        'version',
        'path',
        'original_filename',
        'mime_type',
        'size_bytes',
        'sha256',
        'uploaded_by',
    ];

    // The storage path is internal - never send it to the browser.
    protected $hidden = ['path'];

    public function submission()
    {
        return $this->belongsTo(Submission::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
