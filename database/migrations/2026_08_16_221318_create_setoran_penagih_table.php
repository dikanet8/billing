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
        Schema::create('setoran_penagih', function (Blueprint $table) {
            $table->increments('id_setoran');
            $table->integer('id_user');
            $table->decimal('nominal', 10, 2);
            $table->dateTime('tgl_setoran');
            $table->enum('status', ['pending','diterima','ditolak'])->default('Pending');
            $table->integer('id_admin')->nullable();
            $table->string('keterangan', 255)->nullable();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
            $table->timestamp('created_at')->nullable()->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('setoran_penagih');
    }
};
