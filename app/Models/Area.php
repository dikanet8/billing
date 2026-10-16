<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Area extends Model
{
    use \App\Traits\HasTenant;

    protected $table = 'area';
    protected $primaryKey = 'id_area';
    public $timestamps = false;
    protected $guarded = [];

    public function pelanggan()
    {
        return $this->hasMany(Pelanggan::class, 'id_area', 'id_area');
    }

    public function penagih()
    {
        return $this->belongsToMany(User::class, 'area_penagih', 'id_area', 'id_user');
    }
}
