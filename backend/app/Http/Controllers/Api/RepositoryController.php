<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\DocumentCategory;
use App\Models\RepositoryDocument;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * REPOSITORY of the 3 Rs: centralized document storage for DILG Makati.
 *
 * - Barangay reps can browse public documents and upload documents for their own barangay.
 * - Office staff can upload DILG-wide documents, manage all documents, archive them.
 * - Super admins can permanently delete documents.
 */
class RepositoryController extends Controller
{
    private const PER_PAGE = 15;
    private const MAX_UPLOAD_KB = 10240; // 10 MB
    private const ALLOWED_MIMES = 'pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,csv,txt,zip';

    /**
     * List documents the current user can see, with search and filters.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = RepositoryDocument::with([
            'category:id,name,slug',
            'barangay:id,name',
            'uploader:id,name',
        ])
        ->visibleTo($user);

        // By default show active only. Office can pass ?status=archived or ?status=all
        $statusFilter = $request->query('status', 'active');
        if ($statusFilter === 'active') {
            $query->active();
        } elseif ($statusFilter === 'archived' && $user->hasOfficeOversight()) {
            $query->where('status', 'archived');
        }
        // 'all' = no status filter (office only)

        // Category filter
        if ($categoryId = $request->query('category_id')) {
            $query->where('document_category_id', $categoryId);
        }

        // Access level filter (office only)
        if ($accessLevel = $request->query('access_level')) {
            if ($user->hasOfficeOversight()) {
                $query->where('access_level', $accessLevel);
            }
        }

        // Barangay filter (office only)
        if ($barangayId = $request->query('barangay_id')) {
            if ($user->hasOfficeOversight()) {
                $query->where('barangay_id', $barangayId);
            }
        }

        // Search by title or filename
        if ($search = $request->query('search')) {
            $term = '%' . str_replace(['%', '_'], ['\%', '\_'], $search) . '%';
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', $term)
                  ->orWhere('original_filename', 'like', $term)
                  ->orWhere('description', 'like', $term);
            });
        }

        $rows = $query->orderByDesc('created_at')
                       ->paginate($request->integer('per_page', self::PER_PAGE));

        return response()->json($rows);
    }

    /**
     * List document categories (for the category filter dropdown).
     */
    public function categories()
    {
        return DocumentCategory::orderBy('sort_order')
                               ->orderBy('name')
                               ->get(['id', 'name', 'slug', 'description']);
    }

    /**
     * Summary stats for the repository dashboard.
     */
    public function summary(Request $request)
    {
        $user = $request->user();

        $base = RepositoryDocument::visibleTo($user)->active();

        $total = (clone $base)->count();

        $byCategory = DocumentCategory::withCount([
            'documents' => fn ($q) => $q->visibleTo($user)->active(),
        ])
        ->orderBy('sort_order')
        ->orderBy('name')
        ->get(['id', 'name', 'slug', 'documents_count']);

        $recent = RepositoryDocument::with([
            'category:id,name,slug',
            'uploader:id,name',
            'barangay:id,name',
        ])
        ->visibleTo($user)
        ->active()
        ->orderByDesc('created_at')
        ->limit(5)
        ->get();

        return response()->json([
            'total' => $total,
            'by_category' => $byCategory,
            'recent' => $recent,
        ]);
    }

    /**
     * Show a single document (metadata only - download is separate).
     */
    public function show(Request $request, RepositoryDocument $document)
    {
        $user = $request->user();

        // Check visibility
        $canSee = RepositoryDocument::visibleTo($user)->where('id', $document->id)->exists();
        abort_unless($canSee, 404);

        return $document->load([
            'category:id,name,slug',
            'barangay:id,name',
            'uploader:id,name',
        ]);
    }

    /**
     * Upload a new document into the repository.
     *
     * - Barangay reps: the document belongs to their barangay (access_level defaults to 'barangay').
     * - Office staff: can set barangay_id to null for DILG-wide, or pick a specific barangay.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $rules = [
            'title' => ['required', 'string', 'max:255'],
            'document_category_id' => ['required', 'exists:document_categories,id'],
            'description' => ['nullable', 'string', 'max:2000'],
            'file' => ['required', 'file', 'max:' . self::MAX_UPLOAD_KB, 'mimes:' . self::ALLOWED_MIMES],
        ];

        if ($user->hasOfficeOversight()) {
            $rules['access_level'] = ['sometimes', Rule::in(['public', 'office', 'barangay'])];
            $rules['barangay_id'] = ['nullable', 'exists:barangays,id'];
        }

        $data = $request->validate($rules);

        $upload = $request->file('file');
        $path = $upload->store('repository', 'local');

        $accessLevel = 'public';
        $barangayId = null;

        if ($user->isBarangayRep()) {
            $accessLevel = 'barangay';
            $barangayId = $user->barangay_id;
        } else {
            $accessLevel = $data['access_level'] ?? 'public';
            $barangayId = $data['barangay_id'] ?? null;
        }

        $document = RepositoryDocument::create([
            'document_category_id' => $data['document_category_id'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'access_level' => $accessLevel,
            'barangay_id' => $barangayId,
            'file_path' => $path,
            'original_filename' => $upload->getClientOriginalName(),
            'mime_type' => $upload->getClientMimeType(),
            'size_bytes' => $upload->getSize(),
            'sha256' => hash_file('sha256', $upload->getRealPath()),
            'status' => 'active',
            'uploaded_by' => $user->id,
        ]);

        ActivityLog::record('repository.uploaded', $document, [
            'title' => $document->title,
            'category' => $document->category?->name,
            'filename' => $document->original_filename,
        ]);

        // ── Notify relevant users about the new document ──
        if ($user->hasOfficeOversight()) {
            // Office uploaded a public or barangay document → notify barangay reps
            if ($accessLevel === 'public') {
                NotificationService::notifyBarangay(
                    null,
                    'repository.new',
                    "New document: {$document->title}",
                    'A new document has been added to the Repository.',
                    '/user/repository',
                    $user,
                );
            } elseif ($accessLevel === 'barangay' && $barangayId) {
                NotificationService::notifyBarangay(
                    $barangayId,
                    'repository.new',
                    "New document: {$document->title}",
                    'A new document has been shared with your barangay.',
                    '/user/repository',
                    $user,
                );
            }
        } else {
            // Barangay rep uploaded → notify office
            $bName = $user->barangay?->name ?? 'A barangay';
            NotificationService::notifyOffice(
                'repository.new',
                "New document from Brgy. {$bName}",
                "\"{$document->title}\" was uploaded to the Repository.",
                '/admin/repository',
                $user,
            );
        }

        return response()->json(
            $document->load(['category:id,name,slug', 'barangay:id,name', 'uploader:id,name']),
            201
        );
    }

    /**
     * Update document metadata (title, description, category, access_level).
     * Only the uploader or office staff can edit.
     */
    public function update(Request $request, RepositoryDocument $document)
    {
        $user = $request->user();

        // Only the uploader or office staff can update
        abort_unless(
            $user->hasOfficeOversight() || $document->uploaded_by === $user->id,
            403,
            'You can only edit documents you uploaded.'
        );

        $rules = [
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'document_category_id' => ['sometimes', 'exists:document_categories,id'],
        ];

        if ($user->hasOfficeOversight()) {
            $rules['access_level'] = ['sometimes', Rule::in(['public', 'office', 'barangay'])];
        }

        $data = $request->validate($rules);

        $document->update($data);

        ActivityLog::record('repository.updated', $document, ['changes' => array_keys($data)]);

        return $document->load(['category:id,name,slug', 'barangay:id,name', 'uploader:id,name']);
    }

    /**
     * Download a document file. Logs every download for the audit trail.
     */
    public function download(Request $request, RepositoryDocument $document)
    {
        $user = $request->user();

        // Check visibility
        $canSee = RepositoryDocument::visibleTo($user)->where('id', $document->id)->exists();
        abort_unless($canSee, 404);

        abort_unless(
            Storage::disk('local')->exists($document->file_path),
            404,
            'The stored file could not be found.'
        );

        ActivityLog::record('repository.downloaded', $document, [
            'title' => $document->title,
            'filename' => $document->original_filename,
        ]);

        return Storage::disk('local')->download(
            $document->file_path,
            $document->original_filename ?? $document->title
        );
    }

    /**
     * Archive a document (soft-remove from the active listing).
     * Office staff only.
     */
    public function archive(Request $request, RepositoryDocument $document)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $document->update([
            'status' => 'archived',
            'archived_at' => now(),
        ]);

        ActivityLog::record('repository.archived', $document, ['title' => $document->title]);

        return $document->load(['category:id,name,slug', 'barangay:id,name', 'uploader:id,name']);
    }

    /**
     * Restore an archived document back to active.
     * Office staff only.
     */
    public function restore(Request $request, RepositoryDocument $document)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $document->update([
            'status' => 'active',
            'archived_at' => null,
        ]);

        ActivityLog::record('repository.restored', $document, ['title' => $document->title]);

        return $document->load(['category:id,name,slug', 'barangay:id,name', 'uploader:id,name']);
    }

    /**
     * Permanently delete a document. Super admin only.
     * Removes both the database record and the stored file.
     */
    public function destroy(Request $request, RepositoryDocument $document)
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        // Delete the stored file
        if (Storage::disk('local')->exists($document->file_path)) {
            Storage::disk('local')->delete($document->file_path);
        }

        ActivityLog::record('repository.deleted', $document, [
            'title' => $document->title,
            'filename' => $document->original_filename,
        ]);

        $document->delete();

        return response()->json(['message' => 'Document permanently deleted.']);
    }
}
