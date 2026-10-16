<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GenieacsServer extends Model
{
    use \App\Traits\HasTenant;

    protected $table = 'genieacs_servers';
    public $timestamps = false;
    protected $guarded = [];
}
