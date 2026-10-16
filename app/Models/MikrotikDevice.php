<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MikrotikDevice extends Model
{
    use \App\Traits\HasTenant;

    protected $table = 'mikrotik_devices';
    public $timestamps = false;
    protected $guarded = [];
}
