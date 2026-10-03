<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ReportCategory;
use App\Models\Resource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * RESOURCES of the 3 Rs: the one trusted place for templates, guidelines, SOPs and security
 * advisories. Barangays only ever see the live version, so outdated forms can't be used.
 */
class ResourceController extends Controller
{
    /** Per report category: the current template (kept as-is for existing pages). */
    public function index()
    {
        return ReportCategory::with('latestResource.uploader:id,name')->orderBy('name')->get();
    }

    /**
     * The full library. Everyone: live versions only.
     * Office: add ?history=1 to also see older/archived versions.
     */
    public function library(Request $request)
    {
        $query = Resource::with(['category:id,name,cycle', 'uploader:id,name']);

        if ($request->boolean('history') && $request->user()->hasOfficeOversight()) {
            // everything
        } else {
            $query->available();
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }
        if ($categoryId = $request->query('report_category_id')) {
            $query->where('report_category_id', $categoryId);
        }

        return response()->json([
            'data' => $query->orderBy('type')->orderBy('title')->orderByDesc('id')->get(),
        ]);
    }

    /** Office uploads a new resource, or a new version of an existing one. */
    public function store(Request $request)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:' . implode(',', config('reporting.resource_types'))],
            'report_category_id' => ['nullable', 'required_if:type,template', 'exists:report_categories,id'],
            'version' => ['required', 'string', 'max:20'],
            'description' => ['nullable', 'string', 'max:2000'],
            'effective_date' => ['nullable', 'date'],
            'file' => ['required', 'file', 'max:' . config('reporting.max_upload_kb'), 'mimes:' . config('reporting.resource_mimes')],
        ]);

        $same = fn ($q) => $q->where('type', $data['type'])
            ->where('title', $data['title'])
            ->where('report_category_id', $data['report_category_id'] ?? null);

        if ($same(Resource::query())->where('version', $data['version'])->exists()) {
            return response()->json(['message' => 'That version already exists. Use a new version number.'], 422);
        }

        $upload = $request->file('file');
        $path = $upload->store('resources', 'local'); // private disk, served only through download()

        $resource = DB::transaction(function () use ($data, $upload, $path, $request, $same) {
            // The new upload becomes the live version; earlier versions stay on record.
            $same(Resource::query())->update(['is_current' => false]);

            return Resource::create([
                'report_category_id' => $data['report_category_id'] ?? null,
                'title' => $data['title'],
                'type' => $data['type'],
                'description' => $data['description'] ?? null,
                'version' => $data['version'],
                'is_current' => true,
                'effective_date' => $data['effective_date'] ?? null,
                'file_path' => $path,
                'original_filename' => $upload->getClientOriginalName(),
                'sha256' => hash_file('sha256', $upload->getRealPath()),
                'uploaded_by' => $request->user()->id,
            ]);
        });

        ActivityLog::record('resource.uploaded', $resource, ['version' => $resource->version, 'type' => $resource->type]);

        return response()->json($resource->load(['category:id,name,cycle', 'uploader:id,name']), 201);
    }

    /** Withdraw a resource (e.g. a wrong form). It disappears for barangays; the record is kept. */
    public function archive(Request $request, Resource $resource)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $resource->update(['archived_at' => now(), 'is_current' => false]);

        ActivityLog::record('resource.archived', $resource, ['version' => $resource->version]);

        return $resource->load(['category:id,name,cycle', 'uploader:id,name']);
    }

    public function download(Request $request, Resource $resource)
    {
        // Barangays can only fetch the live version; this is what stops outdated forms.
        if (!$request->user()->hasOfficeOversight()) {
            abort_unless($resource->is_current && !$resource->archived_at, 404);
        }

        abort_unless(Storage::disk('local')->exists($resource->file_path), 404, 'The stored file could not be found.');

        ActivityLog::record('resource.downloaded', $resource, ['version' => $resource->version]);

        return Storage::disk('local')->download($resource->file_path, $resource->original_filename ?? $resource->title);
    }
}
