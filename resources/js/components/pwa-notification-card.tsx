import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BellRing, X } from 'lucide-react';
import { toast } from 'sonner';
import { router, usePage } from '@inertiajs/react';

export function PwaNotificationCard() {
    const [isVisible, setIsVisible] = useState(false);
    const { vapidPublicKey } = usePage().props as any;

    useEffect(() => {
        // Only show if the browser supports notifications and permission is not already granted or denied
        if ("Notification" in window) {
            const hasDismissed = localStorage.getItem('billing_dismissed_pwa_banner');
            if (Notification.permission === 'default' && !hasDismissed) {
                setIsVisible(true);
            }
        }
    }, []);

    const enableNotifications = async () => {
        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                setIsVisible(false);
                toast.success('Notifikasi berhasil diaktifkan!');
                
                // Subscribe to push if WebPush is set up
                if ('serviceWorker' in navigator && vapidPublicKey) {
                    const registration = await navigator.serviceWorker.ready;
                    
                    try {
                        const subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: vapidPublicKey
                        });
                        
                        // Send subscription to server
                        router.post('/push-subscriptions', subscription as any, {
                            preserveScroll: true,
                            preserveState: true,
                        });
                    } catch (pushErr) {
                        console.error('Failed to subscribe to Web Push:', pushErr);
                    }
                }
                
                // Show a welcome notification
                if (navigator.serviceWorker) {
                    navigator.serviceWorker.ready.then(reg => {
                        reg.showNotification("Notifikasi Aktif!", { 
                            body: "Anda akan menerima pembaruan secara langsung.", 
                            icon: '/logo.png' 
                        }).catch(() => {
                            new Notification("Notifikasi Aktif!", { body: "Anda akan menerima pembaruan secara langsung.", icon: '/logo.png' });
                        });
                    }).catch(() => {
                        new Notification("Notifikasi Aktif!", { body: "Anda akan menerima pembaruan secara langsung.", icon: '/logo.png' });
                    });
                }
            } else {
                toast.error('Izin notifikasi ditolak oleh peramban.');
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            toast.error('Terjadi kesalahan saat mengaktifkan notifikasi.');
        }
    };

    const dismissBanner = () => {
        setIsVisible(false);
        localStorage.setItem('billing_dismissed_pwa_banner', 'true');
    };

    if (!isVisible) return null;

    return (
        <Card className="mb-4 sm:mb-6 overflow-hidden border border-blue-200 dark:border-blue-900/40 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg sm:rounded-xl shrink-0">
                        <BellRing className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="font-semibold text-sm sm:text-base text-blue-900 dark:text-blue-100">Aktifkan Notifikasi Langsung</h3>
                        <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                            Terima pemberitahuan transaksi dan tugas secara real-time langsung di perangkat Anda tanpa harus membuka aplikasi.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    <Button 
                        onClick={dismissBanner}
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50 flex-1 sm:flex-auto"
                    >
                        Nanti
                    </Button>
                    <Button 
                        onClick={enableNotifications}
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex-1 sm:flex-auto"
                    >
                        Aktifkan
                    </Button>
                </div>
                
                <button 
                    onClick={dismissBanner}
                    className="absolute top-2 right-2 p-1 text-blue-400 hover:text-blue-600 dark:text-blue-500/50 dark:hover:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors hidden sm:block"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </Card>
    );
}
