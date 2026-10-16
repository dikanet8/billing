<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckReadOnlyRole
{
    /**
     * Routes that  are allowed for read-only roles (e.g. PENAGIH, TEKNISI).
     */
    protected array $allowedPaths = [
        'push-subscriptions',
        'logout',
        'broadcasting/auth',
        'tagihan/*/bayar',
        'riwayat-setoran',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'])) {
            // Skip check for allowed paths
            foreach ($this->allowedPaths as $path) {
                if ($request->is($path)) {
                    return $next($request);
                }
            }

            if (in_array(auth()->user()->role ?? '', ['TEKNISI', 'PENAGIH'])) {
                abort(403, 'Mode Read-Only: Akses ditolak.');
            }
        }
        
        return $next($request);
    }
}
