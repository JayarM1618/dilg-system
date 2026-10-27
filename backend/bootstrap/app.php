<?php
use App\Http\Middleware\BagwisReadOnly;
use App\Http\Middleware\CheckPasswordExpiry;
use App\Http\Middleware\EnsureAccountVerified;
use App\Http\Middleware\EnsureUserHasRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->validateCsrfTokens(except: [
            'api/logout',
        ]);
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
            'bagwis.readonly' => BagwisReadOnly::class,
            'verified' => EnsureAccountVerified::class,
            'password.expired' => CheckPasswordExpiry::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(function ($request, $e) {
            return $request->is('api/*') || $request->expectsJson();
        });
    })->create();
