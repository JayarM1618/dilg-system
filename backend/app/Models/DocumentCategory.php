<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentCategory extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'sort_order', 'parent_id', 'group_slug'];

    public function documents()
    {
        return $this->hasMany(RepositoryDocument::class);
    }

    public function parent()
    {
        return $this->belongsTo(DocumentCategory::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(DocumentCategory::class, 'parent_id')->orderBy('sort_order');
    }
}
