<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequirementResponse extends Model
{
    protected $fillable = [
        'assignment_id', 'version', 'note', 'path', 'original_filename',
        'mime_type', 'size_bytes', 'sha256', 'uploaded_by',
    ];

    protected $hidden = ['path'];

    public function assignment()
    {
        return $this->belongsTo(RequirementAssignment::class, 'assignment_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
