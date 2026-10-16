<?php

namespace App\Services;

use App\Models\Notification;

class NotificationService
{
    /**
     * Send a notification to a specific user.
     *
     * @param int $userId
     * @param string $title
     * @param string $message
     * @param string $type (info, success, warning, error)
     * @param string|null $link
     * @param int|null $tenantId
     * @return Notification
     */
    public static function send($userId, $title, $message, $type = 'info', $link = null, $tenantId = null)
    {
        return Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'link' => $link,
            'tenant_id' => $tenantId ?? session('tenant_id', 1),
        ]);
    }
}
