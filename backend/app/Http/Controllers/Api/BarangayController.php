<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barangay;
use Illuminate\Http\Request;

class BarangayController extends Controller
{
    /**
     * PUBLIC list for the landing page (no login needed).
     * Only exposes what the picker tiles need - never contact details.
     */
    public function publicIndex()
    {
        return response()->json([
            'data' => Barangay::where('is_active', true)
                ->orderBy('code')
                ->get(['id', 'name', 'code']),
        ]);
    }

    /** List all barangays - office-side only, used for admin dropdowns and dashboard rows. */
    public function index(Request $request)
    {
        abort_unless($request->user()->hasOfficeOversight(), 403);

        return Barangay::orderBy('name')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'unique:barangays,name'],
            'code' => ['required', 'string', 'unique:barangays,code'],
            'contact_person' => ['nullable', 'string'],
            'contact_number' => ['nullable', 'string'],
            'contact_email' => ['nullable', 'email'],
        ]);

        return response()->json(Barangay::create($data), 201);
    }

    public function update(Request $request, Barangay $barangay)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'unique:barangays,name,' . $barangay->id],
            'contact_person' => ['nullable', 'string'],
            'contact_number' => ['nullable', 'string'],
            'contact_email' => ['nullable', 'email'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $barangay->update($data);

        return $barangay;
    }
}
