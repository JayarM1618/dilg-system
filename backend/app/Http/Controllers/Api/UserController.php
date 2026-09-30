<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;

class UserController extends Controller
{
    /** List every account with its barangay - super admin only (enforced by the route middleware). */
    public function index()
    {
        return response()->json([
            'data' => User::with('barangay:id,name,code')
                ->orderBy('name')
                ->get(),
        ]);
    }
}
