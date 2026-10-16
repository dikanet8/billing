<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Paket extends Model
{
    use \App\Traits\HasTenant;

    protected $table = 'paket';
    protected $primaryKey = 'id_paket';
    public $timestamps = false;
    protected $guarded = [];

    public function pelanggan()
    {
        return $this->hasMany(Pelanggan::class, 'id_paket', 'id_paket');
    }
}
