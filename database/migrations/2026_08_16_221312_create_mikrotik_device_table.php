<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('mikrotik_devices', function (Blueprint $table) {
            $table->increments('id');
            $table->string('nama', 100)->unique();
            $table->string('ip', 50);
            $table->integer('port')->nullable()->default(8728);
            $table->string('username', 50)->nullable()->default('admin');
            $table->string('password', 50)->nullable();
            $table->string('status', 20)->nullable()->default('Offline');
            $table->string('isolir_profile', 100)->nullable();
            $table->boolean('is_isolir_enabled')->default(false);
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
            $table->timestamp('created_at')->nullable()->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mikrotik_devices');
    }
};
