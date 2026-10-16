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
        Schema::create('olt_devices', function (Blueprint $table) {
            $table->increments('id');
            $table->string('nama', 255);
            $table->string('vendor', 50)->default('ZTE');
            $table->string('ip', 255);
            $table->integer('port')->default(161);
            $table->string('username', 255)->nullable();
            $table->string('password', 255)->nullable();
            $table->string('snmp_community', 255)->default('public');
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
            $table->timestamp('created_at')->nullable()->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('olt_devices');
    }
};
