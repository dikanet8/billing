<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AreaPenagih extends Model
{
    use HasFactory;

    protected $table = 'area_penagih';
    public $timestamps = false;
    protected $fillable = ['id_user', 'id_area'];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function area()
    {
        return $this->belongsTo(Area::class, 'id_area', 'id_area');
    }
}
