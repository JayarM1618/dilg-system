<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentCategory extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'sort_order'];

    public function documents()
    {
        return $this->hasMany(RepositoryDocument::class);
    }
}
