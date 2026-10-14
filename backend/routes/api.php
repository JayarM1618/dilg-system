<?php

use App\Http\Controllers\Api\ActivationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BarangayContentController;
use App\Http\Controllers\Api\BarangayController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MonitoringController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\ReportCategoryController;
use App\Http\Controllers\Api\RepositoryController;
use App\Http\Controllers\Api\RequirementController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ResourceController;
use App\Http\Controllers\Api\SecurityIncidentController;
use App\Http\Controllers\Api\SubmissionController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// --- Public ---
// Public: the landing page reads the barangay list from the database through this.
Route::get('/public/barangays', [BarangayController::class, 'publicIndex']);
// Public: read-only data for the Citizens View.
Route::get('/public/overview', [PublicController::class, 'overview']);
Route::get('/public/barangays/{id}', [PublicController::class, 'barangay'])->whereNumber('id');
Route::get('/public/analytics', [PublicController::class, 'analytics']);

Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::get('/auth/providers', [AuthController::class, 'providers']);

// Account activation (DILG-issued accounts): open the emailed link, choose a password.
Route::middleware('throttle:20,1')->group(function () {
    Route::get('/activate/{token}', [ActivationController::class, 'show']);
    Route::post('/activate', [ActivationController::class, 'activate']);
});

Route::get('/me', [AuthController::class, 'me']);

// --- Authenticated (any active role) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // ──── Notifications ────
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->whereNumber('notification');
    Route::delete('/notifications', [NotificationController::class, 'clearAll']);

    // What citizens see about a barangay. A rep manages only their own barangay;
    // the controller enforces that (office staff may manage any).
    Route::patch('/barangays/{barangay}/profile', [BarangayContentController::class, 'updateProfile']);
    Route::post('/barangays/{barangay}/announcements', [BarangayContentController::class, 'storeAnnouncement']);
    Route::patch('/announcements/{announcement}', [BarangayContentController::class, 'updateAnnouncement']);
    Route::delete('/announcements/{announcement}', [BarangayContentController::class, 'destroyAnnouncement']);
    Route::post('/barangays/{barangay}/programs', [BarangayContentController::class, 'storeProgram']);
    Route::patch('/programs/{program}', [BarangayContentController::class, 'updateProgram']);
    Route::delete('/programs/{program}', [BarangayContentController::class, 'destroyProgram']);

    // Resources ("Resources" of the 3 Rs) - everyone can browse/download
    Route::get('/resources', [ResourceController::class, 'index']);
    Route::get('/resources/library', [ResourceController::class, 'library']);
    Route::get('/resources/{resource}/download', [ResourceController::class, 'download']);

    // Submissions ("Reports" of the 3 Rs) - scoping handled inside the controller/policy
    Route::get('/submissions', [SubmissionController::class, 'index']);
    Route::get('/submissions/options', [SubmissionController::class, 'options']); // what a barangay can file now
    Route::get('/submissions/{submission}', [SubmissionController::class, 'show']);
    Route::post('/submissions', [SubmissionController::class, 'store']);
    Route::get('/submissions/{submission}/download', [SubmissionController::class, 'download']);
    Route::get('/submissions/{submission}/files', [SubmissionController::class, 'files']);
    Route::get('/submissions/{submission}/files/{file}/download', [SubmissionController::class, 'downloadVersion']);

    // Repository: centralized document storage (separate from submissions/reports)
    Route::get('/repository', [RepositoryController::class, 'index']);
    Route::get('/repository/categories', [RepositoryController::class, 'categories']);
    Route::get('/repository/summary', [RepositoryController::class, 'summary']);
    Route::get('/repository/{document}', [RepositoryController::class, 'show'])->whereNumber('document');
    Route::post('/repository', [RepositoryController::class, 'store']);
    Route::get('/repository/{document}/download', [RepositoryController::class, 'download'])->whereNumber('document');

    // Requirements: DILG sends files/complaints/memos to barangays; barangays comply back.
    Route::get('/requirements', [RequirementController::class, 'index']);
    Route::get('/requirements/summary', [RequirementController::class, 'summary']);
    Route::get('/requirements/{requirement}', [RequirementController::class, 'show'])->whereNumber('requirement');
    Route::get('/requirements/{requirement}/files/{file}/download', [RequirementController::class, 'downloadFile'])->whereNumber(['requirement', 'file']);
    Route::get('/requirement-responses/{response}/download', [RequirementController::class, 'downloadResponse'])->whereNumber('response');
    Route::post('/requirements/{requirement}/received', [RequirementController::class, 'markReceived'])->whereNumber('requirement');
    Route::post('/requirements/{requirement}/respond', [RequirementController::class, 'respond'])->whereNumber('requirement');

    // Security incident reporting - open to all roles, formalizing what used to be
    // informal email forwarding to ICTO
    Route::get('/security-incidents', [SecurityIncidentController::class, 'index']);
    Route::post('/security-incidents', [SecurityIncidentController::class, 'store']);

    // --- Office staff / supervisors only ---
    Route::middleware('role:super_admin,office_supervisor')->group(function () {
        Route::get('/barangays', [BarangayController::class, 'index']);
        Route::patch('/submissions/{submission}/review', [SubmissionController::class, 'review']);
        Route::post('/submissions/open-periods', [SubmissionController::class, 'openPeriods']);
        Route::post('/report-categories', [ReportCategoryController::class, 'store']);
        Route::patch('/security-incidents/{securityIncident}/status', [SecurityIncidentController::class, 'updateStatus']);

        // Repository: office management
        Route::patch('/repository/{document}', [RepositoryController::class, 'update'])->whereNumber('document');
        Route::patch('/repository/{document}/archive', [RepositoryController::class, 'archive'])->whereNumber('document');
        Route::patch('/repository/{document}/restore', [RepositoryController::class, 'restore'])->whereNumber('document');

        // Requirements: send, track and review (supervisor and super admin)
        Route::get('/requirements/tracker', [RequirementController::class, 'tracker']);
        Route::post('/requirements', [RequirementController::class, 'store']);
        Route::post('/requirements/{requirement}/close', [RequirementController::class, 'close'])->whereNumber('requirement');
        Route::post('/requirements/{requirement}/reopen', [RequirementController::class, 'reopen'])->whereNumber('requirement');
        Route::patch('/requirement-assignments/{assignment}/review', [RequirementController::class, 'review'])->whereNumber('assignment');

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

        Route::delete('/requirements/{requirement}', [RequirementController::class, 'destroy'])->whereNumber('requirement');

        // Repository: permanent deletion (super admin only)
        Route::delete('/repository/{document}', [RepositoryController::class, 'destroy'])->whereNumber('document');

        // Audit trail
        Route::get('/reports/audit-logs', [ReportController::class, 'auditLogs']);

        // Accounts: DILG issues every account; owners only activate it.
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::patch('/users/{user}', [UserController::class, 'update']);
        Route::post('/users/{user}/invite', [UserController::class, 'invite']);

        // Monitoring: everything the DILG admins and barangay representatives do
        Route::get('/monitoring/summary', [MonitoringController::class, 'summary']);
        Route::get('/monitoring/activity', [MonitoringController::class, 'activity']);
    });
});
