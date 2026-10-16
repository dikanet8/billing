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
        Schema::create('tiket', function (Blueprint $table) {
            $table->increments('id_tiket');
            $table->integer('id_pelanggan');
            $table->string('judul', 255);
            $table->text('deskripsi');
            $table->string('kategori', 100)->default('Layanan Lambat');
            $table->string('prioritas', 50)->default('Sedang');
            $table->string('status', 50)->default('Terbuka');
            $table->timestamp('tgl_dibuat')->nullable()->useCurrent();
            $table->dateTime('tgl_diselesaikan')->nullable();
            $table->integer('ditugaskan_ke')->nullable();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tiket');
    }
};
