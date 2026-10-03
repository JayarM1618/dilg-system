<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BarangayController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ResourceController;
use App\Http\Controllers\Api\SecurityIncidentController;
use App\Http\Controllers\Api\SubmissionController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// --- Public ---
Route::post('/login', [AuthController::class, 'login']);

// --- Authenticated (any active role) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Resources ("Resources" of the 3 Rs) - everyone can browse/download
    Route::get('/resources', [ResourceController::class, 'index']);
    Route::get('/resources/library', [ResourceController::class, 'library']);
    Route::get('/resources/{resource}/download', [ResourceController::class, 'download']);

    // Submissions ("Repository" of the 3 Rs) - scoping handled inside the controller/policy
    Route::get('/submissions', [SubmissionController::class, 'index']);
    Route::get('/submissions/{submission}', [SubmissionController::class, 'show']);
    Route::post('/submissions', [SubmissionController::class, 'store']);
    Route::get('/submissions/{submission}/download', [SubmissionController::class, 'download']);
    Route::get('/submissions/{submission}/files', [SubmissionController::class, 'files']);
    Route::get('/submissions/{submission}/files/{file}/download', [SubmissionController::class, 'downloadVersion']);

    // Security incident reporting - open to all roles, formalizing what used to be
    // informal email forwarding to ICTO
    Route::get('/security-incidents', [SecurityIncidentController::class, 'index']);
    Route::post('/security-incidents', [SecurityIncidentController::class, 'store']);

    // --- Office staff / supervisors only ---
    Route::middleware('role:super_admin,office_supervisor')->group(function () {
        Route::get('/barangays', [BarangayController::class, 'index']);
        Route::patch('/submissions/{submission}/review', [SubmissionController::class, 'review']);
        Route::patch('/security-incidents/{securityIncident}/status', [SecurityIncidentController::class, 'updateStatus']);

        // "Reporting" of the 3 Rs - the automated Talaghayan dashboard
        Route::get('/dashboard/talaghayan', [DashboardController::class, 'talaghayan']);
        Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

        // Resources management (templates, guidelines, SOPs)
        Route::post('/resources', [ResourceController::class, 'store']);
        Route::patch('/resources/{resource}/archive', [ResourceController::class, 'archive']);

        // "Reports" - compliance + security reporting
        Route::get('/reports/periods', [ReportController::class, 'periods']);
        Route::get('/reports/compliance', [ReportController::class, 'compliance']);
        Route::get('/reports/compliance/export', [ReportController::class, 'exportCompliance']);
        Route::get('/reports/security', [ReportController::class, 'security']);
    });

    // --- Super admin only ---
    Route::middleware('role:super_admin')->group(function () {
        Route::post('/barangays', [BarangayController::class, 'store']);
        Route::patch('/barangays/{barangay}', [BarangayController::class, 'update']);

        // Audit trail
        Route::get('/reports/audit-logs', [ReportController::class, 'auditLogs']);

        // User accounts (read-only list for the dashboard's Users page)
        Route::get('/users', [UserController::class, 'index']);
    });
});
