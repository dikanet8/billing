<?php

namespace App\Traits;

use App\Models\Scopes\TenantScope;
use Illuminate\Support\Facades\Auth;

trait HasTenant
{
    /**
     * Boot the trait to add the global scope.
     */
    protected static function bootHasTenant()
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function ($model) {
            if (Auth::check() && !$model->tenant_id) {
                $user = Auth::user();
                if ($user->role === 'SUPERADMIN') {
                    $model->tenant_id = session('active_tenant_id');
                } else {
                    $model->tenant_id = $user->tenant_id;
                }
            }
        });
    }
}
