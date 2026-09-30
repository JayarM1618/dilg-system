<?php

namespace App\Policies;

use App\Models\Submission;
use App\Models\User;

class SubmissionPolicy
{
    /** Office staff/supervisors see all; barangay reps only their own list. */
    public function viewAny(User $user): bool
    {
        return true; // scoping happens in the controller query, this just gates route access
    }

    public function view(User $user, Submission $submission): bool
    {
        if ($user->hasOfficeOversight()) {
            return true;
        }

        return $user->barangay_id === $submission->barangay_id;
    }

    public function create(User $user): bool
    {
        // Only barangay reps upload their own submissions; office staff don't submit on their behalf.
        return $user->isBarangayRep();
    }

    public function update(User $user, Submission $submission): bool
    {
        // A barangay rep may only edit their own submission, and only before it's reviewed.
        if ($user->isBarangayRep()) {
            return $user->barangay_id === $submission->barangay_id
                && in_array($submission->status, ['pending', 'submitted']);
        }

        return $user->hasOfficeOversight();
    }

    /** Reviewing/marking compliant is an office-side action only. */
    public function review(User $user, Submission $submission): bool
    {
        return $user->hasOfficeOversight();
    }

    public function delete(User $user, Submission $submission): bool
    {
        return $user->isSuperAdmin();
    }
}
