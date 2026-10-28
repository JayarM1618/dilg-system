<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\FormTemplate;
use Illuminate\Http\Request;

/**
 * EDITABLE FORMS: Supervisors create form templates (JSON field definitions),
 * barangay reps fill them out and e-sign them.
 */
class FormTemplateController extends Controller
{
    /** List all active form templates (everyone can see them). */
    public function index(Request $request)
    {
        $query = FormTemplate::with('creator:id,name');

        // Office staff can see inactive too
        if (!$request->user()->hasOfficeOversight()) {
            $query->active();
        }

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        return response()->json([
            'data' => $query->orderBy('category')->orderBy('title')->get(),
        ]);
    }

    /** Show a single template with its field definitions. */
    public function show(FormTemplate $formTemplate)
    {
        return $formTemplate->load('creator:id,name');
    }

    /** Office creates a new form template. */
    public function store(Request $request)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'category' => ['nullable', 'string', 'max:100'],
            'fields' => ['required', 'array', 'min:1'],
            'fields.*.name' => ['required', 'string', 'max:100'],
            'fields.*.type' => ['required', 'in:text,textarea,number,date,select,checkbox,radio,file,signature,section'],
            'fields.*.label' => ['required', 'string', 'max:255'],
            'fields.*.required' => ['nullable', 'boolean'],
            'fields.*.options' => ['nullable', 'array'],
            'fields.*.placeholder' => ['nullable', 'string', 'max:255'],
            'fields.*.description' => ['nullable', 'string', 'max:1000'],
            'fields.*.col_span' => ['nullable', 'integer', 'in:1,2'],
            'version' => ['nullable', 'string', 'max:20'],
        ]);

        $template = FormTemplate::create([
            ...$data,
            'version' => $data['version'] ?? '1.0',
            'created_by' => $request->user()->id,
        ]);

        ActivityLog::record('form_template.created', $template, ['title' => $template->title]);

        return response()->json($template->load('creator:id,name'), 201);
    }

    /** Update a form template (office only). */
    public function update(Request $request, FormTemplate $formTemplate)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'category' => ['nullable', 'string', 'max:100'],
            'fields' => ['sometimes', 'array', 'min:1'],
            'fields.*.name' => ['required_with:fields', 'string', 'max:100'],
            'fields.*.type' => ['required_with:fields', 'in:text,textarea,number,date,select,checkbox,radio,file,signature,section'],
            'fields.*.label' => ['required_with:fields', 'string', 'max:255'],
            'fields.*.required' => ['nullable', 'boolean'],
            'fields.*.options' => ['nullable', 'array'],
            'fields.*.placeholder' => ['nullable', 'string', 'max:255'],
            'fields.*.description' => ['nullable', 'string', 'max:1000'],
            'fields.*.col_span' => ['nullable', 'integer', 'in:1,2'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $formTemplate->update($data);

        ActivityLog::record('form_template.updated', $formTemplate, ['changes' => array_keys($data)]);

        return $formTemplate->load('creator:id,name');
    }

    /** Archive (deactivate) a form template. */
    public function archive(Request $request, FormTemplate $formTemplate)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $formTemplate->update(['is_active' => false]);

        ActivityLog::record('form_template.archived', $formTemplate);

        return $formTemplate;
    }

    /** Delete a form template (office only). */
    public function destroy(Request $request, FormTemplate $formTemplate)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        $formTemplate->delete();

        ActivityLog::record('form_template.deleted', $formTemplate, ['title' => $formTemplate->title]);

        return response()->json(['message' => 'Template deleted.']);
    }
}
