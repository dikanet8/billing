<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OltPortDataUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $oltId;
    public $portIndex;
    public $onus;

    /**
     * Create a new event instance.
     */
    public function __construct($oltId, $portIndex, $onus)
    {
        $this->oltId = $oltId;
        $this->portIndex = $portIndex;
        $this->onus = $onus;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('olt.' . $this->oltId . '.port.' . $this->portIndex),
        ];
    }
}
