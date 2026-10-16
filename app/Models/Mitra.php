<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class Mitra extends Model
{
    use HasTenant;

    protected $table = 'mitra';
    protected $primaryKey = 'id_mitra';
    protected $guarded = [];
}
