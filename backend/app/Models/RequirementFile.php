<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequirementFile extends Model
{
    protected $fillable = ['requirement_id', 'path', 'original_filename', 'mime_type', 'size_bytes', 'sha256'];

    protected $hidden = ['path'];

    public function requirement()
    {
        return $this->belongsTo(Requirement::class);
    }
}
