<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TenantController extends Controller
{
    public function index()
    {
        // Only SUPERADMIN should access this ideally, checked by middleware or gate
        if (auth()->user()->role !== 'SUPERADMIN') {
            abort(403);
        }

        // Load tenants and their owner
        $tenants = Tenant::all()->map(function($tenant) {
            $owner = \App\Models\User::where('tenant_id', $tenant->id)->where('role', 'OWNER')->first();
            $tenant->owner = $owner;
            return $tenant;
        });
        
        return Inertia::render('tenants/index', [
            'tenants' => $tenants
        ]);
    }

    public function store(Request $request)
    {
        if (auth()->user()->role !== 'SUPERADMIN') abort(403);

        $validated = $request->validate([
            'nama' => 'required|string|max:100',
            'owner_name' => 'required|string|max:255',
            'owner_email' => 'required|email|unique:users,email',
            'owner_password' => 'required|string|min:4',
        ]);

        $tenant = Tenant::create([
            'nama' => $validated['nama'],
        ]);

        \App\Models\User::create([
            'name' => $validated['owner_name'],
            'nama' => $validated['owner_name'],
            'username' => explode('@', $validated['owner_email'])[0],
            'email' => $validated['owner_email'],
            'password' => bcrypt($validated['owner_password']),
            'role' => 'OWNER',
            'status' => 'AKTIF',
            'tenant_id' => $tenant->id,
        ]);

        return back();
    }

    public function update(Request $request, $id)
    {
        if (auth()->user()->role !== 'SUPERADMIN') abort(403);

        $tenant = Tenant::findOrFail($id);
        
        // Find owner or null
        $owner = \App\Models\User::where('tenant_id', $tenant->id)->where('role', 'OWNER')->first();
        
        $validated = $request->validate([
            'nama' => 'required|string|max:100',
            'owner_name' => 'required|string|max:255',
            'owner_email' => 'required|email|unique:users,email' . ($owner ? ',' . $owner->id : ''),
            'owner_password' => 'nullable|string|min:4',
        ]);

        $tenant->update([
            'nama' => $validated['nama'],
        ]);

        if ($owner) {
            $owner->name = $validated['owner_name'];
            $owner->nama = $validated['owner_name'];
            $owner->email = $validated['owner_email'];
            if (!empty($validated['owner_password'])) {
                $owner->password = bcrypt($validated['owner_password']);
            }
            $owner->save();
        } else {
            // If owner didn't exist for some reason, create one
            \App\Models\User::create([
                'name' => $validated['owner_name'],
                'nama' => $validated['owner_name'],
                'username' => explode('@', $validated['owner_email'])[0],
                'email' => $validated['owner_email'],
                'password' => bcrypt($validated['owner_password'] ?? 'password'),
                'role' => 'OWNER',
                'status' => 'AKTIF',
                'tenant_id' => $tenant->id,
            ]);
        }

        return back();
    }

    public function destroy($id)
    {
        if (auth()->user()->role !== 'SUPERADMIN') abort(403);
        
        Tenant::findOrFail($id)->delete();
        return back();
    }

    // API to set active tenant in session
    public function switchTenant(Request $request)
    {
        if (auth()->user()->role !== 'SUPERADMIN') abort(403);

        $tenantId = $request->input('tenant_id');
        
        // If null, it means 'All Tenants'
        if ($tenantId) {
            session(['active_tenant_id' => $tenantId]);
        } else {
            session()->forget('active_tenant_id');
        }

        return back();
    }
}
