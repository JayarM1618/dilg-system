<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BagwisPpa;
use App\Models\BagwisPpaEntry;
use App\Services\NotificationService;
use Database\Seeders\BagwisPpaSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * BAGWIS PPAs — city-level programs tracked by DILG Makati.
 *
 * Everyone can read and download guidelines;
 * only office staff (supervisors / super admin) can create, upload, edit, and review PPAs.
 * Barangay reps get VIEW-ONLY and download access (enforced by bagwis.readonly middleware).
 */
class BagwisPpaController extends Controller
{
    /** List all active PPAs with their creator and latest entries. */
    public function index()
    {
        // Auto-seed default Makati PPAs if none exist
        if (BagwisPpa::count() === 0) {
            (new BagwisPpaSeeder())->run();
        }

        return BagwisPpa::where('is_active', true)
            ->with(['creator:id,name'])
            ->withCount('entries')
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get();
    }

    /** Office supervisor creates a new Makati City Program/PPA with optional guideline attachment. */
    public function store(Request $request)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403, 'Only DILG supervisors can upload city programs.');

        $data = $request->validate([
            'name'                 => ['required', 'string', 'max:255'],
            'slug'                 => ['nullable', 'string', 'max:100'],
            'frequency'            => ['required', 'string', 'max:50'],
            'responsible_office'   => ['required', 'string', 'max:255'],
            'description'          => ['nullable', 'string', 'max:5000'],
            'deadline_description' => ['nullable', 'string', 'max:255'],
            'sort_order'           => ['nullable', 'integer', 'min:0'],
            'attachment'           => ['nullable', 'file', 'max:25600'], // max 25MB
        ]);

        $baseSlug = !empty($data['slug']) ? Str::slug($data['slug']) : Str::slug($data['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (BagwisPpa::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $attachmentPath = null;
        $attachmentName = null;
        $attachmentSize = null;
        $attachmentMime = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentPath = $file->store('bagwis_ppas', 'local');
            $attachmentName = $file->getClientOriginalName();
            $attachmentSize = $file->getSize();
            $attachmentMime = $file->getClientMimeType();
        }

        $ppa = BagwisPpa::create([
            'name'                 => $data['name'],
            'slug'                 => $slug,
            'frequency'            => $data['frequency'],
            'responsible_office'   => $data['responsible_office'],
            'description'          => $data['description'] ?? null,
            'deadline_description' => $data['deadline_description'] ?? null,
            'sort_order'           => $data['sort_order'] ?? 0,
            'is_active'            => true,
            'attachment_path'      => $attachmentPath,
            'attachment_name'      => $attachmentName,
            'attachment_size'      => $attachmentSize,
            'attachment_mime'      => $attachmentMime,
            'created_by'           => $request->user()->id,
        ]);

        ActivityLog::record('bagwis.ppa_created', $ppa, [
            'name' => $ppa->name,
            'has_attachment' => !empty($attachmentPath),
        ]);

        // Notify all barangays that a new Makati City Program/Guideline is published
        NotificationService::notifyBarangay(
            null,
            'bagwis.ppa_published',
            "New Makati City Program: {$ppa->name}",
            "DILG Makati has published a new city-level program for Makati barangays.",
            '/bagwis',
            $request->user(),
            false
        );

        return response()->json($ppa->load(['creator:id,name']), 201);
    }

    /** Office supervisor updates an existing Makati City Program/PPA. */
    public function update(Request $request, BagwisPpa $ppa)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $data = $request->validate([
            'name'                 => ['sometimes', 'required', 'string', 'max:255'],
            'frequency'            => ['sometimes', 'required', 'string', 'max:50'],
            'responsible_office'   => ['sometimes', 'required', 'string', 'max:255'],
            'description'          => ['nullable', 'string', 'max:5000'],
            'deadline_description' => ['nullable', 'string', 'max:255'],
            'sort_order'           => ['nullable', 'integer', 'min:0'],
            'attachment'           => ['nullable', 'file', 'max:25600'],
        ]);

        if ($request->hasFile('attachment')) {
            // Delete old file if present
            if ($ppa->attachment_path && Storage::disk('local')->exists($ppa->attachment_path)) {
                Storage::disk('local')->delete($ppa->attachment_path);
            }
            $file = $request->file('attachment');
            $data['attachment_path'] = $file->store('bagwis_ppas', 'local');
            $data['attachment_name'] = $file->getClientOriginalName();
            $data['attachment_size'] = $file->getSize();
            $data['attachment_mime'] = $file->getClientMimeType();
        }

        $ppa->update($data);

        ActivityLog::record('bagwis.ppa_updated', $ppa, ['name' => $ppa->name]);

        return response()->json($ppa->fresh()->load(['creator:id,name']));
    }

    /** Office supervisor uploads or replaces guideline attachment for an existing PPA. */
    public function uploadAttachment(Request $request, BagwisPpa $ppa)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $request->validate([
            'attachment' => ['required', 'file', 'max:25600'],
        ]);

        if ($ppa->attachment_path && Storage::disk('local')->exists($ppa->attachment_path)) {
            Storage::disk('local')->delete($ppa->attachment_path);
        }

        $file = $request->file('attachment');
        $ppa->update([
            'attachment_path' => $file->store('bagwis_ppas', 'local'),
            'attachment_name' => $file->getClientOriginalName(),
            'attachment_size' => $file->getSize(),
            'attachment_mime' => $file->getClientMimeType(),
        ]);

        ActivityLog::record('bagwis.ppa_guideline_uploaded', $ppa, [
            'file_name' => $ppa->attachment_name,
        ]);

        NotificationService::notifyBarangay(
            null,
            'bagwis.ppa_guideline_updated',
            "Updated Guidelines: {$ppa->name}",
            "DILG Makati uploaded new guidelines for {$ppa->name}.",
            '/bagwis',
            $request->user(),
            false
        );

        return response()->json($ppa->fresh()->load(['creator:id,name']));
    }

    /** Office supervisor deletes a PPA. */
    public function destroy(Request $request, BagwisPpa $ppa)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        if ($ppa->attachment_path && Storage::disk('local')->exists($ppa->attachment_path)) {
            Storage::disk('local')->delete($ppa->attachment_path);
        }

        $ppaName = $ppa->name;
        $ppa->delete();

        ActivityLog::record('bagwis.ppa_deleted', null, ['name' => $ppaName]);

        return response()->json(['message' => "Program {$ppaName} removed successfully."]);
    }

    /** Download PPA City Guideline / Document (open to all authenticated users, including barangay reps). */
    public function download(Request $request, BagwisPpa $ppa)
    {
        abort_unless($ppa->attachment_path, 404, 'No guideline document has been uploaded for this program.');
        abort_unless(Storage::disk('local')->exists($ppa->attachment_path), 404, 'The stored guideline file was not found.');

        ActivityLog::record('bagwis.ppa_downloaded', $ppa, [
            'file_name' => $ppa->attachment_name,
        ]);

        return Storage::disk('local')->download(
            $ppa->attachment_path,
            $ppa->attachment_name ?: "{$ppa->slug}-guidelines.pdf"
        );
    }

    /** List entries for a specific PPA, optionally filtered by period. */
    public function entries(Request $request, BagwisPpa $ppa)
    {
        $query = $ppa->entries()->with(['submitter:id,name', 'reviewer:id,name']);

        if ($period = $request->query('period_label')) {
            $query->where('period_label', $period);
        }

        return $query->orderByDesc('created_at')->paginate(15);
    }

    /** Office creates or updates an entry for a PPA period, optionally attaching an MOV file. */
    public function storeEntry(Request $request, BagwisPpa $ppa)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $data = $request->validate([
            'period_label' => ['required', 'string', 'max:40'],
            'status'       => ['required', 'in:pending,submitted,compliant,non_compliant'],
            'remarks'      => ['nullable', 'string', 'max:2000'],
            'attachment'   => ['nullable', 'file', 'max:25600'],
        ]);

        $entry = BagwisPpaEntry::where('bagwis_ppa_id', $ppa->id)
            ->where('period_label', $data['period_label'])
            ->first();

        $attachmentPath = $entry?->attachment_path;
        $attachmentName = $entry?->attachment_name;
        $attachmentSize = $entry?->attachment_size;
        $attachmentMime = $entry?->attachment_mime;

        if ($request->hasFile('attachment')) {
            if ($attachmentPath && Storage::disk('local')->exists($attachmentPath)) {
                Storage::disk('local')->delete($attachmentPath);
            }
            $file = $request->file('attachment');
            $attachmentPath = $file->store('bagwis_entries', 'local');
            $attachmentName = $file->getClientOriginalName();
            $attachmentSize = $file->getSize();
            $attachmentMime = $file->getClientMimeType();
        }

        $entry = BagwisPpaEntry::updateOrCreate(
            [
                'bagwis_ppa_id' => $ppa->id,
                'period_label'  => $data['period_label'],
            ],
            [
                'status'          => $data['status'],
                'remarks'         => $data['remarks'] ?? null,
                'attachment_path' => $attachmentPath,
                'attachment_name' => $attachmentName,
                'attachment_size' => $attachmentSize,
                'attachment_mime' => $attachmentMime,
                'submitted_by'    => $request->user()->id,
                'submitted_at'    => now(),
            ]
        );

        return response()->json($entry->load(['submitter:id,name']), 201);
    }

    /** Download entry MOV/attachment. */
    public function downloadEntryAttachment(Request $request, BagwisPpaEntry $entry)
    {
        abort_unless($entry->attachment_path, 404, 'No document attached to this entry.');
        abort_unless(Storage::disk('local')->exists($entry->attachment_path), 404, 'File not found on server.');

        return Storage::disk('local')->download(
            $entry->attachment_path,
            $entry->attachment_name ?: "entry-attachment.pdf"
        );
    }

    /** Office reviews/updates an entry's status. */
    public function reviewEntry(Request $request, BagwisPpaEntry $entry)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $data = $request->validate([
            'status'  => ['required', 'in:compliant,non_compliant'],
            'remarks' => ['nullable', 'string', 'max:2000'],
        ]);

        $entry->update([
            'status'      => $data['status'],
            'remarks'     => $data['remarks'] ?? $entry->remarks,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return $entry->load(['submitter:id,name', 'reviewer:id,name']);
    }
}
