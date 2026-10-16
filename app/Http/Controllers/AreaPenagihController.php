<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AreaPenagihController extends Controller
{
    public function index()
    {
        $tenantId = auth()->user()->role === 'SUPERADMIN' && session('active_tenant_id') ? session('active_tenant_id') : auth()->user()->tenant_id;

        // Get all penagih
        $penagih = User::where('role', 'PENAGIH')
            ->where('tenant_id', $tenantId)
            ->with('areas')
            ->get();
            
        // Get all areas for the tenant
        $areas = Area::where('tenant_id', $tenantId)->get();

        return Inertia::render('area-penagih', [
            'penagih' => $penagih,
            'areas' => $areas,
        ]);
    }

    public function store(Request $request, $userId)
    {
        $request->validate([
            'areas' => 'array',
            'areas.*' => 'exists:area,id_area'
        ]);

        $tenantId = auth()->user()->role === 'SUPERADMIN' && session('active_tenant_id') ? session('active_tenant_id') : auth()->user()->tenant_id;

        $user = User::where('id', $userId)
            ->where('role', 'PENAGIH')
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        // Sync areas
        $user->areas()->sync($request->areas ?? []);

        return redirect()->back()->with('success', 'Area penagih berhasil diperbarui.');
    }
}
