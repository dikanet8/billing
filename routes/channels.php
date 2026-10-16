<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    \Illuminate\Support\Facades\Log::info("User channel auth: user_id={$user->id}, id={$id}");
    return (int) $user->id === (int) $id;
});

Broadcast::channel('Tenant.{id}', function ($user, $id) {
    \Illuminate\Support\Facades\Log::info("Tenant channel auth: user_tenant={$user->tenant_id}, id={$id}");
    return (int) $user->tenant_id === (int) $id;
});
