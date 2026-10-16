<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;
use NotificationChannels\WebPush\WebPushChannel;

class PembayaranBerhasilNotification extends Notification
{
    use Queueable;

    public $pesan;

    public function __construct($pesan)
    {
        $this->pesan = $pesan;
    }

    public function via($notifiable)
    {
        return [WebPushChannel::class];
    }

    public function toWebPush($notifiable, $notification)
    {
        return (new WebPushMessage)
            ->title('Pembayaran Berhasil')
            ->icon('/logo.jpg')
            ->body($this->pesan)
            ->action('Lihat Tagihan', '/tagihan')
            ->data(['url' => '/tagihan']);
    }
}
