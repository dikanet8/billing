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
        Schema::create('tagihan', function (Blueprint $table) {
            $table->increments('id_tagihan');
            $table->string('nomor_tagihan')->nullable();
            $table->integer('id_pelanggan');
            $table->string('bulan_tagihan', 20);
            $table->decimal('total_tarif', 10, 2);
            $table->enum('status_bayar', ['belum bayar','lunas','isolasir'])->nullable()->default('Belum Bayar');
            $table->date('tgl_bayar')->nullable();
            $table->enum('metode_bayar', ['tunai','transfer','saldo'])->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamp('created_at')->nullable()->useCurrent();
            $table->timestamp('updated_at')->nullable()->useCurrent();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tagihan');
    }
};
