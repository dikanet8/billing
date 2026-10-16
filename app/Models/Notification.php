<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\HasTenant;

class Notification extends Model
{
    use HasFactory, HasTenant;

    protected $fillable = [
        'user_id',
        'title',
        'message',
        'type',
        'link',
        'is_read',
        'tenant_id'
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    protected $dispatchesEvents = [
        'created' => \App\Events\NotificationCreated::class,
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
