<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SetoranPenagih extends Model
{
    use \App\Traits\HasTenant;

    use HasFactory;

    protected $table = 'setoran_penagih';
    protected $primaryKey = 'id_setoran';
    const UPDATED_AT = null;
    protected $fillable = ['id_user', 'nominal', 'tgl_setoran', 'status', 'id_admin', 'keterangan', 'tenant_id'];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id');
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'id_admin', 'id');
    }
}
