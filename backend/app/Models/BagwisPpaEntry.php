<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BagwisPpaEntry extends Model
{
    protected $fillable = [
        'bagwis_ppa_id',
        'period_label',
        'status',
        'remarks',
        'submitted_by',
        'submitted_at',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'reviewed_at'  => 'datetime',
        ];
    }

    public function ppa()
    {
        return $this->belongsTo(BagwisPpa::class, 'bagwis_ppa_id');
    }

    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
