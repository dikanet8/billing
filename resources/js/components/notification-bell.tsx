import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';

type Notification = {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link: string | null;
    is_read: boolean;
    created_at: string;
};

export function NotificationBell() {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const showPushNotification = (title: string, options: any) => {
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        
        if (navigator.serviceWorker) {
            navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(title, options).catch(err => {
                    console.error("SW showNotification error:", err);
                    try {
                        new Notification(title, options);
                    } catch (e) {
                        console.error("Fallback Notification error:", e);
                    }
                });
            }).catch(err => {
                try {
                    new Notification(title, options);
                } catch (e) {
                    console.error("ServiceWorker ready error:", e);
                }
            });
        } else {
            try {
                new Notification(title, options);
            } catch (e) {
                console.error("No SW fallback error:", e);
            }
        }
    };


    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            
            const storedLastId = parseInt(localStorage.getItem('billing_last_notified_id') || '0', 10);
            
            if (data.length > 0) {
                const newNotifications = data.filter((n: Notification) => n.id > storedLastId && !n.is_read);
                
                newNotifications.forEach((n: Notification) => {
                    showPushNotification(n.title, { body: n.message, icon: '/logo.png' });
                });
                
                const maxId = Math.max(...data.map((n: Notification) => n.id));
                if (maxId > storedLastId) {
                    localStorage.setItem('billing_last_notified_id', maxId.toString());
                }
            }

            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEcho(user?.id ? `App.Models.User.${user.id}` : '', 'NotificationCreated', (e: any) => {
        const n = e.notification;
        if (!n) return;

        setNotifications(prev => {
            if (prev.find(p => p.id === n.id)) return prev;
            return [n, ...prev];
        });
        setUnreadCount(prev => prev + 1);

        const storedLastId = parseInt(localStorage.getItem('billing_last_notified_id') || '0', 10);
        if (n.id <= storedLastId) return; // Prevent duplicate if already shown by fetch
        
        localStorage.setItem('billing_last_notified_id', n.id.toString());

        showPushNotification(n.title, { body: n.message, icon: '/logo.png' });
    }, [user], 'private');

    const markAsRead = async (id: number) => {
        try {
            await fetch(`/api/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications/read-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
            case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    const timeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Baru saja';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                    <Bell className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-neutral-950">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden shadow-xl rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between px-4 py-3 bg-neutral-50/80 dark:bg-neutral-900/50 backdrop-blur border-b border-neutral-100 dark:border-neutral-800">
                    <div className="font-semibold text-sm">Notifikasi</div>
                    <div className="flex items-center gap-2">
                        
                        {unreadCount > 0 && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-auto px-2 py-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                onClick={(e) => {
                                    e.preventDefault();
                                    markAllAsRead();
                                }}
                            >
                                Tandai semua dibaca
                            </Button>
                        )}
                    </div>
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-neutral-500">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <span className="text-sm">Belum ada notifikasi</span>
                        </div>
                    ) : (
                        <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
                            {notifications.map((notification) => {
                                const Content = (
                                    <div className={`flex gap-3 p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer ${!notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                         onClick={() => {
                                             if (!notification.is_read) markAsRead(notification.id);
                                             setIsOpen(false);
                                         }}>
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!notification.is_read ? 'font-semibold text-neutral-900 dark:text-neutral-100' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p suppressHydrationWarning className="text-[10px] text-neutral-400 mt-2 font-medium">
                                                {timeAgo(notification.created_at)}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <div className="flex-shrink-0 flex items-center justify-center">
                                                <div className="h-2 w-2 rounded-full bg-blue-600" />
                                            </div>
                                        )}
                                    </div>
                                );

                                return notification.link ? (
                                    <Link href={notification.link} key={notification.id} className="block outline-none">
                                        {Content}
                                    </Link>
                                ) : (
                                    <div key={notification.id} className="outline-none">
                                        {Content}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
