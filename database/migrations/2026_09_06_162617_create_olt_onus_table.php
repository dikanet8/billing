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
        Schema::create('olt_onus', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('olt_id');
            $table->string('port', 100);
            $table->integer('onu_id');
            $table->string('name', 150)->nullable();
            $table->string('description', 255)->nullable();
            
            // Allow multiple ONUs per port
            $table->unique(['olt_id', 'port', 'onu_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('olt_onus');
    }
};
