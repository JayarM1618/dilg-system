<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\FormTemplate;
use App\Models\RepositoryDocument;
use App\Models\ReportCategory;
use App\Models\Requirement;
use App\Models\Resource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ArchiveController extends Controller
{
    /**
     * Map of type slugs to their Eloquent models and eager-load relations.
     */
    private const TYPE_MAP = [
        'users'                => [User::class,              ['barangay']],
        'resources'            => [Resource::class,           []],
        'repository_documents' => [RepositoryDocument::class, ['category']],
        'form_templates'       => [FormTemplate::class,       []],
        'requirements'         => [Requirement::class,        []],
        'report_categories'    => [ReportCategory::class,     []],
        'document_categories'  => [\App\Models\DocumentCategory::class, []],
    ];

    /**
     * List archived items of a given type.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|string|in:' . implode(',', array_keys(self::TYPE_MAP)),
        ]);

        $type = $request->query('type');
        [$modelClass, $relations] = self::TYPE_MAP[$type];

        $query = $modelClass::whereNotNull('archived_at')
            ->orderByDesc('archived_at');

        // Eager-load the archiver when the model has archived_by
        if (in_array($type, ['users', 'resources', 'repository_documents', 'form_templates', 'requirements'])) {
            $relations[] = 'archiver:id,name';
        }

        if (!empty($relations)) {
            $query->with($relations);
        }

        // Optional text search
        if ($q = $request->query('q')) {
            $query->where(function ($qb) use ($q, $type) {
                if ($type === 'users') {
                    $qb->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%");
                } else {
                    $qb->where('name', 'like', "%{$q}%");
                }
            });
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Restore an archived item.
     */
    public function restore(Request $request, string $type, int $id): JsonResponse
    {
        if (!isset(self::TYPE_MAP[$type])) {
            return response()->json(['message' => 'Invalid archive type.'], 422);
        }

        [$modelClass] = self::TYPE_MAP[$type];
        $item = $modelClass::whereNotNull('archived_at')->findOrFail($id);

        DB::transaction(function () use ($item, $type) {
            $updates = ['archived_at' => null];

            // Clear archived_by if the column exists on this model
            if (in_array($type, ['users', 'resources', 'repository_documents', 'form_templates', 'requirements'])) {
                $updates['archived_by'] = null;
            }

            // Reactivate users on restore
            if ($type === 'users') {
                $updates['is_active'] = true;
            }

            $item->update($updates);
        });

        $label = $item->name ?? $item->title ?? "#{$id}";

        ActivityLog::record('archive.restored', $item, [
            'type'  => $type,
            'label' => $label,
        ]);

        return response()->json([
            'message' => ucfirst(str_replace('_', ' ', $type)) . " \"{$label}\" restored from archive.",
            'item'    => $item->fresh(),
        ]);
    }

    /**
     * Summary counts of all archived items.
     */
    public function summary(): JsonResponse
    {
        $counts = [];
        foreach (self::TYPE_MAP as $type => [$modelClass]) {
            try {
                $counts[$type] = $modelClass::whereNotNull('archived_at')->count();
            } catch (\Throwable) {
                $counts[$type] = 0;
            }
        }

        return response()->json([
            'counts' => $counts,
            'total'  => array_sum($counts),
        ]);
    }
}
