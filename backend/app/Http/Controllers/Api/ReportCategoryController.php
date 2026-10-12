<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ReportCategory;
use App\Support\PeriodOpener;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * DILG defines the reports barangays must file (name + how often).
 * Creating one immediately opens its current period for every active barangay.
 */
class ReportCategoryController extends Controller
{
    public function store(Request $request)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150', 'unique:report_categories,name'],
            'cycle' => ['required', Rule::in(['weekly', 'monthly', 'quarterly', 'semestral', 'annual'])],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);

        $category = ReportCategory::create($data);
        $opened = PeriodOpener::open(null, $category->id);

        ActivityLog::record('report.category_created', $category, ['title' => $category->name, 'cycle' => $category->cycle, 'opened' => $opened]);

        return response()->json(['category' => $category, 'opened' => $opened], 201);
    }
}
