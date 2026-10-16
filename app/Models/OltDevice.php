<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OltDevice extends Model
{
    use \App\Traits\HasTenant;

    protected $table = 'olt_devices';
    public $timestamps = false;
    protected $guarded = [];
}
