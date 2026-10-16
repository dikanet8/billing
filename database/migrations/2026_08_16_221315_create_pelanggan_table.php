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
        Schema::create('pelanggan', function (Blueprint $table) {
            $table->increments('id');
            $table->string('nomor_pelanggan')->nullable();
            $table->string('nama', 150);
            $table->string('telepon', 20)->nullable();
            $table->string('pppoe', 100);
            $table->integer('tanggal')->nullable();
            $table->integer('id_area')->nullable();
            $table->integer('id_paket')->nullable();
            $table->text('alamat')->nullable();
            $table->date('tanggal_register')->nullable();
            $table->integer('id_mikrotik')->nullable();
            $table->string('modem', 100)->nullable();
            $table->enum('status', ['aktif','isolir'])->nullable()->default('AKTIF');
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pelanggan');
    }
};
