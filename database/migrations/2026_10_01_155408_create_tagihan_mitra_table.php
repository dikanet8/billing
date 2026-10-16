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
        Schema::create('tagihan_mitra', function (Blueprint $table) {
            $table->id('id_tagihan_mitra');
            $table->string('nomor_invoice', 50)->unique();
            $table->unsignedBigInteger('id_mitra');
            $table->string('periode', 20)->comment('Contoh: 10-2026');
            $table->decimal('nominal', 15, 2);
            $table->enum('status_bayar', ['Belum Bayar', 'Lunas'])->default('Belum Bayar');
            $table->date('tanggal_bayar')->nullable();
            $table->text('keterangan')->nullable();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tagihan_mitra');
    }
};
