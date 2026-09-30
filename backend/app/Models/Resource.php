<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Resource extends Model
{
    protected $fillable = [
        'report_category_id',
        'title',
        'file_path',
        'version',
        'uploaded_by',
    ];

    public function category()
    {
        return $this->belongsTo(ReportCategory::class, 'report_category_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
