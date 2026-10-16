<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tagihan extends Model
{
    use \App\Traits\HasTenant;

    protected $table = 'tagihan';
    protected $primaryKey = 'id_tagihan';
    
    // has created_at and updated_at
    protected $guarded = [];

    public function pelanggan()
    {
        return $this->belongsTo(Pelanggan::class, 'id_pelanggan', 'id');
    }

    public function pembayaran()
    {
        return $this->hasOne(Pembayaran::class, 'id_tagihan', 'id_tagihan');
    }
}
