import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Settings, Moon, Sun, Bell, BellOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';
import { useAppearance } from '@/hooks/use-appearance';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const { vapidPublicKey } = usePage().props as any;

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(subscription => {
                    if (subscription && Notification.permission === 'granted') {
                        setNotificationsEnabled(true);
                        // Sync subscription to the current user when they log in or switch accounts
                        axios.post('/push-subscriptions', subscription).catch(() => {});
                    } else {
                        setNotificationsEnabled(false);
                    }
                });
            });
        }
    }, []);

    const toggleNotifications = async (e: React.MouseEvent) => {
        e.preventDefault();
        
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            toast.error('Browser ini tidak mendukung notifikasi push.');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            
            if (notificationsEnabled) {
                // Unsubscribe
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();
                    // Optionally tell the backend to delete it, but client-side unsubscribe is enough to stop them
                }
                setNotificationsEnabled(false);
                toast.success('Notifikasi dinonaktifkan.');
            } else {
                // Subscribe
                let permission = Notification.permission;
                if (permission !== 'granted') {
                    permission = await Notification.requestPermission();
                }
                
                if (permission === 'granted' && vapidPublicKey) {
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: vapidPublicKey
                    });
                    
                    await axios.post('/push-subscriptions', subscription);
                    setNotificationsEnabled(true);
                    toast.success('Notifikasi berhasil diaktifkan!');
                } else {
                    toast.error('Izin notifikasi ditolak.');
                }
            }
        } catch (error) {
            console.error('Error toggling notifications:', error);
            toast.error('Terjadi kesalahan saat mengatur notifikasi.');
        }
    };

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="flex items-center gap-2 w-full cursor-pointer"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="h-4 w-4" />
                        <span>Pengaturan Profil</span>
                    </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                    onClick={toggleNotifications}
                    className="cursor-pointer flex items-center justify-between w-full"
                >
                    <div className="flex items-center gap-2">
                        {notificationsEnabled ? <Bell className="h-4 w-4 text-blue-500" /> : <BellOff className="h-4 w-4 text-neutral-500" />}
                        <span>Notifikasi Push</span>
                    </div>
                    <div className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${notificationsEnabled ? 'bg-blue-500' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${notificationsEnabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                    </div>
                </DropdownMenuItem>

                <DropdownMenuItem 
                    onClick={(e) => {
                        e.preventDefault();
                        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');
                    }}
                    className="cursor-pointer flex items-center justify-between w-full"
                >
                    <div className="flex items-center gap-2">
                        {resolvedAppearance === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        <span>Mode Gelap</span>
                    </div>
                    <div className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${resolvedAppearance === 'dark' ? 'bg-emerald-500' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${resolvedAppearance === 'dark' ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                    </div>
                </DropdownMenuItem>

            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" asChild>
                <Link
                    className="flex items-center gap-2 w-full cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                </Link>
            </DropdownMenuItem>
        </>
    );
}
