<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class TagihanMitra extends Model
{
    use HasTenant;

    protected $table = 'tagihan_mitra';
    protected $primaryKey = 'id_tagihan_mitra';
    protected $guarded = [];

    public function mitra()
    {
        return $this->belongsTo(Mitra::class, 'id_mitra', 'id_mitra');
    }
}
