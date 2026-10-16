import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Users, Receipt, Wallet, Router, Ticket, CalendarDays, XCircle, AlertTriangle, BarChart3, Banknote } from 'lucide-react';

export function MobileBottomNav() {
    const { url } = usePage();

    const { auth } = usePage().props;
    const isPenagih = (auth?.user as any)?.role === 'PENAGIH';
    const isOwner = (auth?.user as any)?.role === 'OWNER';

    const baseItems = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
            active: url === '/dashboard',
        },
        {
            title: 'Pelanggan',
            href: '/pelanggan',
            icon: Users,
            active: url.startsWith('/pelanggan'),
        },
        ...(isOwner ? [{
            title: 'Laporan Keuangan',
            href: '/laporan',
            icon: BarChart3,
            active: url.startsWith('/laporan'),
        }] : [{
            title: 'Tagihan',
            href: '/tagihan',
            icon: Receipt,
            active: url.startsWith('/tagihan'),
        }]),
    ];

    const adminItems = [
        {
            title: 'Transaksi',
            href: '/transaksi',
            icon: Wallet,
            active: url.startsWith('/transaksi'),
        },
        {
            title: 'Mikrotik',
            href: '/mikrotik',
            icon: Router,
            active: url.startsWith('/mikrotik'),
        },
    ];

    const isTeknisi = (auth?.user as any)?.role === 'TEKNISI';

    const penagihItems = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
            active: url === '/dashboard',
        },
        {
            title: 'Tagihan',
            href: '/tagihan',
            icon: Receipt,
            active: url === '/tagihan',
        },
        {
            title: 'Isolir',
            href: '/tagihan?filter=isolir',
            icon: XCircle,
            active: url.includes('filter=isolir'),
        },
        {
            title: 'Setoran',
            href: '/riwayat-setoran',
            icon: Banknote,
            active: url.startsWith('/riwayat-setoran'),
        },
        {
            title: 'Pembayaran',
            href: '/transaksi',
            icon: Wallet,
            active: url.startsWith('/transaksi'),
        },
    ];

    let items;
    if (isPenagih) {
        items = penagihItems;
    } else if (isTeknisi) {
        items = [
            { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid, active: url === '/dashboard' },
            { title: 'Pelanggan', href: '/pelanggan', icon: Users, active: url.startsWith('/pelanggan') },
            { title: 'Tiket', href: '/tiket', icon: Ticket, active: url.startsWith('/tiket') },
            { title: 'Mikrotik', href: '/mikrotik', icon: Router, active: url.startsWith('/mikrotik') },
        ];
    } else {
        if (isOwner) {
            // Swap Laporan and Mikrotik
            // Original: [Dashboard, Pelanggan, Laporan, Transaksi, Mikrotik]
            // New: [Dashboard, Pelanggan, Mikrotik, Transaksi, Laporan]
            items = [
                baseItems[0], // Dashboard
                baseItems[1], // Pelanggan
                adminItems[1], // Mikrotik
                adminItems[0], // Transaksi
                baseItems[2] // Laporan Keuangan
            ];
        } else {
            items = [...baseItems, ...adminItems];
        }
    }

    return (
        <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
            <div className={`grid h-full max-w-lg mx-auto font-medium ${isPenagih ? 'grid-cols-5' : isTeknisi ? 'grid-cols-4' : 'grid-cols-5'}`}>
                {items.map((item) => (
                    <Link
                        key={item.title}
                        href={String(item.href)}
                        className={`inline-flex flex-col items-center justify-center px-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 group ${
                            item.active ? 'text-blue-600 dark:text-blue-500' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        <item.icon className={`w-5 h-5 mb-1 ${item.active ? 'fill-blue-100 dark:fill-blue-900/30 text-blue-600 dark:text-blue-500' : 'group-hover:scale-110 transition-transform'}`} />
                        <span className="text-[10px] truncate max-w-full">{item.title}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
