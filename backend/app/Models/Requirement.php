<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Requirement extends Model
{
    protected $fillable = [
        'title', 'kind', 'form_template_id', 'description', 'due_date', 'requires_response',
        'audience', 'status', 'created_by', 'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date:Y-m-d',
            'requires_response' => 'boolean',
            'closed_at' => 'datetime',
        ];
    }

    public function formTemplate()
    {
        return $this->belongsTo(FormTemplate::class, 'form_template_id');
    }

    public function files()
    {
        return $this->hasMany(RequirementFile::class);
    }

    public function assignments()
    {
        return $this->hasMany(RequirementAssignment::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
