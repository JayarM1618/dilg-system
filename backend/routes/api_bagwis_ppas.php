<?php

/**
 * ADD THESE ROUTES TO YOUR routes/api.php
 *
 * 1. At the top, add the import:
 *    use App\Http\Controllers\Api\BagwisPpaController;
 *
 * 2. Inside the Route::middleware('auth:sanctum') group,
 *    inside the Route::middleware('bagwis.readonly') group,
 *    add these GET routes:
 */

// --- Inside Route::middleware('bagwis.readonly') group ---
// Route::get('/bagwis/ppas', [BagwisPpaController::class, 'index']);
// Route::get('/bagwis/ppas/{ppa}/entries', [BagwisPpaController::class, 'entries']);

// --- Inside Route::middleware('role:super_admin,office_supervisor') group ---
// Route::post('/bagwis/ppas/{ppa}/entries', [BagwisPpaController::class, 'storeEntry']);
// Route::patch('/bagwis/ppa-entries/{entry}/review', [BagwisPpaController::class, 'reviewEntry']);
