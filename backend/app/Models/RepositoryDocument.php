<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RepositoryDocument extends Model
{
    protected $table = 'repository_documents';

    protected $fillable = [
        'document_category_id',
        'title',
        'description',
        'access_level',
        'barangay_id',
        'file_path',
        'original_filename',
        'mime_type',
        'size_bytes',
        'sha256',
        'status',
        'archived_at',
        'uploaded_by',
    ];

    // Never expose the internal storage path to the browser.
    protected $hidden = ['file_path'];

    protected function casts(): array
    {
        return [
            'archived_at' => 'datetime',
        ];
    }

    /* ---- Relationships ---- */

    public function category()
    {
        return $this->belongsTo(DocumentCategory::class, 'document_category_id');
    }

    public function barangay()
    {
        return $this->belongsTo(Barangay::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /* ---- Scopes ---- */

    /** Active (not archived) documents only. */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to documents the given user is allowed to see.
     *
     * - Office staff see everything.
     * - Barangay reps see:
     *     - 'public' documents (DILG-wide)
     *     - 'barangay' documents that belong to THEIR barangay
     */
    public function scopeVisibleTo($query, User $user)
    {
        if ($user->hasOfficeOversight()) {
            return $query; // see everything
        }

        // Barangay rep: public docs + own barangay docs
        return $query->where(function ($q) use ($user) {
            $q->where('access_level', 'public')
              ->orWhere(function ($q2) use ($user) {
                  $q2->where('access_level', 'barangay')
                     ->where('barangay_id', $user->barangay_id);
              });
        });
    }
}
