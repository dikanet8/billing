import { Link } from '@inertiajs/react';
import { LayoutGrid, Users, MapPin, Package, Receipt, Router, UserCog, Server, Map as MapIcon, Ticket, Send, Wallet, BarChart3, Settings, Wifi, Banknote, Cpu, FileText, Activity, Network, PlusCircle, CalendarDays, Handshake } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { 
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const navGroups = [
    {
        title: 'Utama',
        items: [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
            },
        ],
    },
    {
        title: 'Pelanggan',
        items: [
            {
                title: 'Pelanggan',
                href: '/pelanggan',
                icon: Users,
            },
            {
                title: 'Pelanggan Baru',
                href: '/pelanggan-baru',
                icon: Users,
            },
        ],
    },
    {
        title: 'Master Data',
        items: [
            {
                title: 'Mitra / Reseller',
                href: '/mitra',
                icon: Handshake,
            },
            {
                title: 'Area',
                href: '/area',
                icon: MapPin,
            },
            {
                title: 'Area Penagih',
                href: '/area-penagih',
                icon: MapIcon,
            },
            {
                title: 'Paket',
                href: '/paket',
                icon: Package,
            },
            {
                title: 'Periode Tagihan',
                href: '/periode-tagihan',
                icon: CalendarDays,
            },
        ],
    },
    {
        title: 'Keuangan & Tagihan',
        items: [
            {
                title: 'Tagihan',
                href: '/tagihan',
                icon: Receipt,
            },
            {
                title: 'Transaksi',
                href: '/transaksi',
                icon: Wallet,
            },
            {
                title: 'Kas & Pengeluaran',
                href: '/pengeluaran',
                icon: Banknote,
            },
            {
                title: 'Riwayat Setoran',
                href: '/riwayat-setoran',
                icon: Wallet,
            },
        ],
    },
    {
        title: 'Laporan',
        items: [
            {
                title: 'Laporan Keuangan',
                href: '/laporan',
                icon: BarChart3,
            },
            {
                title: 'Laporan Tunggakan',
                href: '/laporan-tunggakan',
                icon: FileText,
            },
        ],
    },
    {
        title: 'Dukungan & Bantuan',
        items: [
            {
                title: 'Tiket Gangguan',
                href: '/tiket',
                icon: Ticket,
            },
            {
                title: 'Pesan Masal',
                href: '/pesan',
                icon: Send,
            },
        ],
    },
    {
        title: 'Mikrotik',
        items: [
            {
                title: 'Monitoring Mikrotik',
                href: '/mikrotik',
                icon: Activity,
            },
            {
                title: 'Manajemen Mikrotik',
                href: '/manajemen-mikrotik',
                icon: Router,
            },
            {
                title: 'Voucher Hotspot',
                href: '/voucher',
                icon: Wifi,
            },
        ],
    },
    {
        title: 'OLT',
        items: [
            {
                title: 'Manajemen OLT',
                href: '/olt',
                icon: Cpu,
            },
            {
                title: 'Monitoring OLT',
                href: '/olt-monitoring-index',
                icon: Network,
            },
        ],
    },
    {
        title: 'Sistem & Jaringan',
        items: [
            {
                title: 'User',
                href: '/user',
                icon: UserCog,
            },
            {
                title: 'ACS',
                href: '/acs',
                icon: Server,
            },
            {
                title: 'Map',
                href: '/map',
                icon: MapIcon,
            },
        ],
    },
    {
        title: 'Pengaturan',
        items: [
            {
                title: 'Pengaturan Umum',
                href: '/pengaturan-billing',
                icon: Settings,
            },
        ],
    }
];



import { usePage } from '@inertiajs/react';

export function AppSidebar() {
    const { auth } = usePage().props;
    const userRole = (auth?.user as any)?.role || 'OWNER';
    const isPenagih = userRole === 'PENAGIH';
    const isTeknisi = userRole === 'TEKNISI';
    const isOwnerOrSuper = ['OWNER', 'SUPERADMIN'].includes(userRole);

    // Filter nav groups based on role
    const filteredNavGroups = navGroups.map(group => {
        // PENAGIH filters
        if (isPenagih && !['Utama', 'Pelanggan', 'Keuangan & Tagihan'].includes(group.title)) {
            return null;
        }

        // TEKNISI filters
        if (isTeknisi && ['Keuangan & Tagihan', 'Laporan', 'Pengaturan'].includes(group.title)) {
            return null;
        }

        // Filter items within groups
        const filteredItems = group.items.filter(item => {
            if (isPenagih) {
                // PENAGIH can only see Dashboard, Pelanggan, Pelanggan Baru, Tagihan, Transaksi, Riwayat Setoran
                return ['Dashboard', 'Pelanggan', 'Pelanggan Baru', 'Tagihan', 'Transaksi', 'Riwayat Setoran'].includes(item.title);
            }
            if (isTeknisi) {
                // TEKNISI hides Tagihan, User, Transaksi, Kas & Pengeluaran, Laporan Keuangan, Area, Paket, Area Penagih, Manajemen Mikrotik
                if (['Tagihan', 'Mitra / Reseller', 'User', 'Transaksi', 'Kas & Pengeluaran', 'Laporan Keuangan', 'Laporan Tunggakan', 'Area', 'Paket', 'Area Penagih', 'Manajemen Mikrotik'].includes(item.title)) {
                    return false;
                }
            }

            return true;
        });

        // Add Performa Penagih to Laporan if OWNER or SUPERADMIN
        if (isOwnerOrSuper && group.title === 'Laporan') {
            const hasPerforma = filteredItems.find(i => i.title === 'Performa Penagih');
            if (!hasPerforma) {
                filteredItems.push({
                    title: 'Performa Penagih',
                    href: '/performa-penagih',
                    icon: BarChart3,
                });
            }
        }

        // Add Manajemen Tenant to Pengaturan if SUPERADMIN
        if (userRole === 'SUPERADMIN' && group.title === 'Pengaturan') {
            const hasTenant = filteredItems.find(i => i.title === 'Manajemen Tenant');
            if (!hasTenant) {
                filteredItems.unshift({
                    title: 'Manajemen Tenant',
                    href: '/tenants',
                    icon: Server,
                });
            }
        }

        if (filteredItems.length === 0) return null;
        return { ...group, items: filteredItems };
    }).filter(Boolean) as typeof navGroups;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch className="flex items-center gap-3">
                                <AppLogo />
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold text-neutral-900 dark:text-white">Jaringan Rakyat</span>
                                    <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">Billing System</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={filteredNavGroups} />
            </SidebarContent>
        </Sidebar>
    );
}
