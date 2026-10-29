<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemSettingsController extends Controller
{
    /**
     * GET /api/admin/settings
     * Return all settings grouped by their group key.
     */
    public function index(): JsonResponse
    {
        $settings = SystemSetting::orderBy('group')->orderBy('key')->get();

        $grouped = $settings->groupBy('group')->map(function ($items) {
            return $items->map(fn (SystemSetting $s) => [
                'key'         => $s->key,
                'value'       => match ($s->type) {
                    'integer' => (int) $s->value,
                    'boolean' => (bool) $s->value,
                    'json'    => json_decode($s->value, true),
                    default   => $s->value,
                },
                'type'        => $s->type,
                'description' => $s->description,
                'updated_at'  => $s->updated_at,
            ]);
        });

        return response()->json(['data' => $grouped]);
    }

    /**
     * PATCH /api/admin/settings
     * Bulk-update settings. Body: { "key1": "value1", "key2": "value2", … }
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'settings' => 'required|array|min:1',
        ]);

        $user    = $request->user();
        $changed = [];

        foreach ($request->input('settings') as $key => $value) {
            $setting = SystemSetting::where('key', $key)->first();
            if (!$setting) continue;

            $old = $setting->value;
            $new = is_array($value) ? json_encode($value) : (string) $value;

            if ($old !== $new) {
                $setting->update(['value' => $new]);
                $changed[$key] = ['from' => $old, 'to' => $new];
            }
        }

        if (!empty($changed)) {
            ActivityLog::record('settings.updated', null, [
                'count'   => count($changed),
                'changes' => $changed,
            ]);
        }

        return response()->json([
            'message' => count($changed) . ' setting(s) updated.',
            'changed' => array_keys($changed),
        ]);
    }
}
