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
        Schema::create('genieacs_servers', function (Blueprint $table) {
            $table->increments('id');
            $table->string('nama', 255);
            $table->string('ip', 255);
            $table->integer('port_ui')->default(3000);
            $table->integer('port_api')->default(7557);
            $table->integer('is_active')->default(0);
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
            $table->timestamp('created_at')->nullable()->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('genieacs_servers');
    }
};
