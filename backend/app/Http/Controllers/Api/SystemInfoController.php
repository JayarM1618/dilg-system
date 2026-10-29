<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SystemInfoController extends Controller
{
    /**
     * System info panel: PHP, Laravel, MySQL, server, disk, memory.
     */
    public function index(): JsonResponse
    {
        $mysqlVersion = 'N/A';
        try {
            $mysqlVersion = DB::selectOne('SELECT VERSION() as v')->v;
        } catch (\Throwable) {}

        $uptime = 'N/A';
        try {
            if (PHP_OS_FAMILY === 'Linux' && is_readable('/proc/uptime')) {
                $secs = (float) explode(' ', file_get_contents('/proc/uptime'))[0];
                $days  = floor($secs / 86400);
                $hours = floor(($secs % 86400) / 3600);
                $mins  = floor(($secs % 3600) / 60);
                $uptime = "{$days}d {$hours}h {$mins}m";
            }
        } catch (\Throwable) {}

        $diskTotal = @disk_total_space(base_path());
        $diskFree  = @disk_free_space(base_path());

        return response()->json([
            'php_version'     => PHP_VERSION,
            'laravel_version' => app()->version(),
            'mysql_version'   => $mysqlVersion,
            'server_os'       => PHP_OS_FAMILY . ' ' . php_uname('r'),
            'server_uptime'   => $uptime,
            'disk_total'      => $diskTotal ?: 0,
            'disk_free'       => $diskFree ?: 0,
            'disk_used'       => $diskTotal && $diskFree ? $diskTotal - $diskFree : 0,
            'memory_limit'    => ini_get('memory_limit'),
            'memory_usage'    => memory_get_usage(true),
            'max_upload'      => ini_get('upload_max_filesize'),
            'post_max_size'   => ini_get('post_max_size'),
            'timezone'        => config('app.timezone'),
            'app_env'         => config('app.env'),
            'app_debug'       => config('app.debug'),
            'cache_driver'    => config('cache.default'),
            'queue_driver'    => config('queue.default'),
            'mail_driver'     => config('mail.default'),
        ]);
    }

    /**
     * Storage breakdown: DB size, per-table, upload folder.
     */
    public function storage(): JsonResponse
    {
        $dbName = config('database.connections.mysql.database');

        // Per-table sizes
        $tables = [];
        $totalDbSize = 0;
        try {
            $rows = DB::select("
                SELECT table_name,
                       ROUND((data_length + index_length)) AS size_bytes,
                       table_rows
                FROM information_schema.TABLES
                WHERE table_schema = ?
                ORDER BY (data_length + index_length) DESC
            ", [$dbName]);

            foreach ($rows as $row) {
                $size = (int) $row->size_bytes;
                $totalDbSize += $size;
                $tables[] = [
                    'table' => $row->table_name,
                    'size'  => $size,
                    'rows'  => (int) $row->table_rows,
                ];
            }
        } catch (\Throwable) {}

        // Upload folder size
        $uploadPath = storage_path('app/public');
        $uploadSize = 0;
        try {
            if (is_dir($uploadPath)) {
                $iterator = new \RecursiveIteratorIterator(
                    new \RecursiveDirectoryIterator($uploadPath, \FilesystemIterator::SKIP_DOTS)
                );
                foreach ($iterator as $file) {
                    if ($file->isFile()) {
                        $uploadSize += $file->getSize();
                    }
                }
            }
        } catch (\Throwable) {}

        // Per-barangay storage (count of uploaded submission files)
        $barangayStorage = [];
        try {
            $barangayStorage = DB::select("
                SELECT b.name AS barangay,
                       COUNT(sf.id) AS file_count
                FROM barangays b
                LEFT JOIN submissions s ON s.barangay_id = b.id
                LEFT JOIN submission_files sf ON sf.submission_id = s.id
                GROUP BY b.id, b.name
                ORDER BY file_count DESC
            ");
        } catch (\Throwable) {}

        return response()->json([
            'database' => [
                'name'       => $dbName,
                'total_size' => $totalDbSize,
                'tables'     => $tables,
            ],
            'uploads' => [
                'path' => $uploadPath,
                'size' => $uploadSize,
            ],
            'barangay_storage' => $barangayStorage,
        ]);
    }

    /**
     * API health checks.
     */
    public function health(): JsonResponse
    {
        $checks = [];

        // Database
        try {
            DB::select('SELECT 1');
            $checks['database'] = ['status' => 'ok', 'latency_ms' => 0];
            $start = microtime(true);
            DB::select('SELECT 1');
            $checks['database']['latency_ms'] = round((microtime(true) - $start) * 1000, 2);
        } catch (\Throwable $e) {
            $checks['database'] = ['status' => 'error', 'message' => $e->getMessage()];
        }

        // Cache
        try {
            Cache::put('health_check', 'ok', 10);
            $val = Cache::get('health_check');
            Cache::forget('health_check');
            $checks['cache'] = ['status' => $val === 'ok' ? 'ok' : 'degraded', 'driver' => config('cache.default')];
        } catch (\Throwable $e) {
            $checks['cache'] = ['status' => 'error', 'message' => $e->getMessage()];
        }

        // Storage writable
        try {
            $testFile = storage_path('app/.health_check');
            file_put_contents($testFile, 'ok');
            unlink($testFile);
            $checks['storage'] = ['status' => 'ok'];
        } catch (\Throwable) {
            $checks['storage'] = ['status' => 'error', 'message' => 'Storage not writable'];
        }

        $allOk = collect($checks)->every(fn ($c) => $c['status'] === 'ok');

        return response()->json([
            'overall' => $allOk ? 'healthy' : 'degraded',
            'checks'  => $checks,
            'checked_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Detailed PHP info (extensions, key settings).
     */
    public function phpinfo(): JsonResponse
    {
        return response()->json([
            'version'    => PHP_VERSION,
            'sapi'       => PHP_SAPI,
            'extensions' => get_loaded_extensions(),
            'settings'   => [
                'memory_limit'       => ini_get('memory_limit'),
                'max_execution_time' => ini_get('max_execution_time'),
                'upload_max_filesize'=> ini_get('upload_max_filesize'),
                'post_max_size'      => ini_get('post_max_size'),
                'max_input_vars'     => ini_get('max_input_vars'),
                'display_errors'     => ini_get('display_errors'),
                'date.timezone'      => ini_get('date.timezone'),
            ],
        ]);
    }
}
