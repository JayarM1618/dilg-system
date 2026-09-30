<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ReportCategory;
use App\Models\Resource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ResourceController extends Controller
{
    /** All barangays and office staff can browse the current templates. */
    public function index()
    {
        return ReportCategory::with('latestResource.uploader')->orderBy('name')->get();
    }

    /** Office staff uploads a new/updated template version. */
    public function store(Request $request)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $data = $request->validate([
            'report_category_id' => ['required', 'exists:report_categories,id'],
            'title' => ['required', 'string'],
            'version' => ['required', 'string'],
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $path = $request->file('file')->store('resources', 'public');

        $resource = Resource::create([
            'report_category_id' => $data['report_category_id'],
            'title' => $data['title'],
            'version' => $data['version'],
            'file_path' => $path,
            'uploaded_by' => $request->user()->id,
        ]);

        ActivityLog::record('resource.uploaded', $resource);

        return response()->json($resource, 201);
    }

    public function download(Resource $resource)
    {
        ActivityLog::record('resource.downloaded', $resource);

        return Storage::disk('public')->download($resource->file_path, $resource->title);
    }
}
