<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PembayaranBerhasil implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $tenantId;
    public $bulan;
    public $nama;
    public $nominal;
    public $metode;
    public $admin;

    /**
     * Create a new event instance.
     */
    public function __construct($tenantId, $bulan, $nama, $nominal, $metode, $admin)
    {
        $this->tenantId = $tenantId;
        $this->bulan = $bulan;
        $this->nama = $nama;
        $this->nominal = $nominal;
        $this->metode = $metode;
        $this->admin = $admin;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('Tenant.' . $this->tenantId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'PembayaranBerhasil';
    }

    public function broadcastWith(): array
    {
        return [
            'bulan' => $this->bulan,
            'nama' => $this->nama,
            'nominal' => $this->nominal,
            'metode' => $this->metode,
            'admin' => $this->admin,
        ];
    }
}
