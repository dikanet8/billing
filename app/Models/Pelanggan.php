<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pelanggan extends Model
{
    use \App\Traits\HasTenant;

    protected $table = 'pelanggan';
    public $timestamps = false;
    protected $guarded = [];

    public function area()
    {
        return $this->belongsTo(Area::class, 'id_area', 'id_area');
    }

    public function paket()
    {
        return $this->belongsTo(Paket::class, 'id_paket', 'id_paket');
    }
    public function tagihan()
    {
        return $this->hasMany(Tagihan::class, 'id_pelanggan', 'id')->orderByDesc('id_tagihan');
    }
}
