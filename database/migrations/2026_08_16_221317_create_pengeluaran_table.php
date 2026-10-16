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
        Schema::create('pengeluaran', function (Blueprint $table) {
            $table->increments('id_pengeluaran');
            $table->decimal('nominal', 10, 2);
            $table->string('keterangan', 255);
            $table->dateTime('tgl_pengeluaran');
            $table->timestamp('created_at')->nullable()->useCurrent();
            $table->string('kategori', 100)->nullable()->default('Lain-lain');
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengeluaran');
    }
};
