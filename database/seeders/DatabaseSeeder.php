<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create a default tenant
        $tenantId = \Illuminate\Support\Facades\DB::table('tenants')->insertGetId([
            'nama' => 'AJ Net',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create a SUPERADMIN
        User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@example.com',
            'password' => bcrypt('password'),
            'role' => 'SUPERADMIN',
            'tenant_id' => null,
        ]);

        // Create a default OWNER
        User::create([
            'name' => 'Owner',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'role' => 'OWNER',
            'tenant_id' => $tenantId,
        ]);
    }
}
