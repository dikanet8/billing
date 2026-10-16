<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tiket extends Model
{
    use \App\Traits\HasTenant;

    protected $table = 'tiket';
    protected $primaryKey = 'id_tiket';
    public $timestamps = false;
    protected $guarded = [];

    public function pelanggan()
    {
        return $this->belongsTo(Pelanggan::class, 'id_pelanggan', 'id');
    }

    public function teknisi()
    {
        return $this->belongsTo(User::class, 'teknisi_id', 'id');
    }
}
