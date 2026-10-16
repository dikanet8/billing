import { Head, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, AlertCircle, CheckCircle2, Ticket, MapPin, Phone, Clock, Users, UserCheck, UserX } from 'lucide-react';

export default function DashboardTeknisi({ 
    totalTiket = 0, 
    tiketSelesai = 0, 
    tiketTerbuka = 0, 
    tiketPending = [],
    totalPelanggan = 0,
    pelangganOnline = 0,
    pelangganIsolir = 0
}: any) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-4 p-4 lg:p-6 lg:pb-6 w-full">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-2">
                    {/* Total Pelanggan Card */}
                    <Card 
                        onClick={() => router.get('/pelanggan')}
                        className="relative overflow-hidden border border-blue-100 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-900/20 dark:to-neutral-950 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition duration-200 active:scale-[0.98]"
                    >
                        <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none text-blue-500">
                            <Users className="w-16 h-16 sm:w-32 sm:h-32" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Total Pelanggan</span>
                                <span className="text-lg sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{totalPelanggan}</span>
                            </div>
                            <div className="p-1 sm:p-2 bg-blue-100/50 dark:bg-blue-900/50 rounded-lg">
                                <Users className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <div className="w-fit flex items-center gap-1 font-medium text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 px-1.5 py-0.5 sm:px-2 rounded-md">
                                <span>Seluruh Pelanggan</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400">Tercatat dalam sistem</span>
                        </div>
                    </Card>
                    
                    {/* Pelanggan Online Card */}
                    <Card 
                        onClick={() => router.get('/pelanggan', { status: 'AKTIF' })}
                        className="relative overflow-hidden border border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-900/20 dark:to-neutral-950 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition duration-200 active:scale-[0.98]"
                    >
                        <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none text-indigo-500">
                            <UserCheck className="w-16 h-16 sm:w-32 sm:h-32" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Pelanggan Aktif</span>
                                <span className="text-lg sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{pelangganOnline}</span>
                            </div>
                            <div className="p-1 sm:p-2 bg-indigo-100/50 dark:bg-indigo-900/50 rounded-lg">
                                <UserCheck className="w-3 h-3 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <div className="w-fit flex items-center gap-1 font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 px-1.5 py-0.5 sm:px-2 rounded-md">
                                <span>{totalPelanggan > 0 ? Math.round((pelangganOnline / totalPelanggan) * 100) : 0}%</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400">Dari total pelanggan</span>
                        </div>
                    </Card>

                    {/* Pelanggan Isolir Card */}
                    <Card 
                        onClick={() => router.get('/pelanggan', { status: 'ISOLIR' })}
                        className="relative overflow-hidden border border-rose-100 dark:border-rose-900/30 bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-900/20 dark:to-neutral-950 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 cursor-pointer hover:shadow-md hover:border-rose-300 dark:hover:border-rose-700 transition duration-200 active:scale-[0.98]"
                    >
                        <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none text-rose-500">
                            <UserX className="w-16 h-16 sm:w-32 sm:h-32" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Pelanggan Isolir</span>
                                <span className="text-lg sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{pelangganIsolir}</span>
                            </div>
                            <div className="p-1 sm:p-2 bg-rose-100/50 dark:bg-rose-900/50 rounded-lg">
                                <UserX className="w-3 h-3 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <div className="w-fit flex items-center gap-1 font-medium text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 px-1.5 py-0.5 sm:px-2 rounded-md">
                                <span>{totalPelanggan > 0 ? ((pelangganIsolir / totalPelanggan) * 100).toFixed(1) : 0}%</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400">Dari total pelanggan</span>
                        </div>
                    </Card>
                    
                    {/* Tiket Card */}
                    <Card 
                        onClick={() => router.get('/tiket')}
                        className="relative overflow-hidden border border-amber-100 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/20 dark:to-neutral-950 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 cursor-pointer hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition duration-200 active:scale-[0.98]"
                    >
                        <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none text-amber-500">
                            <Ticket className="w-16 h-16 sm:w-32 sm:h-32" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Tiket Penugasan</span>
                                <span className="text-lg sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{totalTiket}</span>
                            </div>
                            <div className="p-1 sm:p-2 bg-amber-100/50 dark:bg-amber-900/50 rounded-lg">
                                <Ticket className="w-3 h-3 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <div className="w-fit flex items-center gap-1 font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 px-1.5 py-0.5 sm:px-2 rounded-md">
                                <span>{tiketTerbuka} Tiket Terbuka</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400">Yang belum diselesaikan</span>
                        </div>
                    </Card>
                </div>

                {/* Tiket List */}
                <div className="flex flex-col gap-3 mt-2">
                    <div className="flex items-center justify-between px-1">
                        <div>
                            <h3 className="font-semibold text-base text-neutral-800 dark:text-neutral-200">Daftar Penugasan Terbuka</h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Tiket gangguan yang harus segera Anda tangani.</p>
                        </div>
                        <Button onClick={() => router.get('/tiket')} variant="outline" size="sm" className="h-8 text-xs px-3 bg-white dark:bg-neutral-900 border-sidebar-border/70 transition-none">Lihat Semua</Button>
                    </div>
                    
                    <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden p-0 gap-0">
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                    <tr>
                                        <th className="px-6 py-3.5 font-medium">Pelanggan & Area</th>
                                        <th className="px-6 py-3.5 font-medium">Laporan</th>
                                        <th className="px-6 py-3.5 font-medium text-center">Status</th>
                                        <th className="px-6 py-3.5 font-medium text-right">Tanggal Lapor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {tiketPending.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                                                Tidak ada tiket gangguan yang terbuka saat ini. 🎉
                                            </td>
                                        </tr>
                                    )}
                                    {tiketPending.map((tiket: any) => (
                                        <tr key={tiket.id_tiket} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-xs shrink-0">
                                                        {tiket.pelanggan?.nama?.substring(0,2).toUpperCase() || 'UN'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-neutral-900 dark:text-white line-clamp-1">{tiket.pelanggan?.nama || 'Unknown'}</span>
                                                        <span className="text-xs text-neutral-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {tiket.pelanggan?.area?.nama_area || 'Tidak ada area'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">
                                                <div className="font-medium text-neutral-900 dark:text-white text-sm">{tiket.judul}</div>
                                                <div className="text-xs text-neutral-500 line-clamp-1">{tiket.deskripsi}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 text-[10px] uppercase px-2 py-0.5 rounded-sm font-medium ${
                                                    tiket.status === 'Selesai' || tiket.status === 'Ditutup' 
                                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                                                        : tiket.status === 'Sedang Diproses' || tiket.status === 'Proses'
                                                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                                            : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                                                }`}>
                                                    {tiket.status}
                                                </span>
                                            </td>
                                            <td suppressHydrationWarning className="px-6 py-4 text-neutral-500 text-xs text-right">
                                                {tiket.tgl_dibuat ? new Date(tiket.tgl_dibuat).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Mobile Cards */}
                        <div className="flex flex-col md:hidden divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                            {tiketPending.length === 0 && (
                                <div className="p-8 text-center text-neutral-500 text-sm">
                                    Tidak ada tiket gangguan yang terbuka saat ini. 🎉
                                </div>
                            )}
                            {tiketPending.map((tiket: any) => (
                                <div key={tiket.id_tiket} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 bg-white dark:bg-neutral-900 transition-colors flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm shrink-0">
                                                {tiket.pelanggan?.nama?.substring(0,2).toUpperCase() || 'UN'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm text-neutral-900 dark:text-white line-clamp-1">{tiket.pelanggan?.nama || 'Unknown'}</span>
                                                <span className="text-xs text-neutral-500 line-clamp-1">{tiket.pelanggan?.area?.nama_area || 'Tidak ada area'}</span>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 text-[10px] uppercase px-2 py-0.5 rounded-sm font-medium ${
                                            tiket.status === 'Selesai' || tiket.status === 'Ditutup' 
                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                                                : tiket.status === 'Sedang Diproses' || tiket.status === 'Proses'
                                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                                    : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                                        }`}>
                                            {tiket.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-col bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                        <span className="text-sm font-medium text-neutral-900 dark:text-white mb-1">{tiket.judul}</span>
                                        <span className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">{tiket.deskripsi}</span>
                                        <div suppressHydrationWarning className="mt-2 flex items-center gap-1 text-[10px] text-neutral-500">
                                            <Clock className="w-3 h-3" />
                                            Dilaporkan: {tiket.tgl_dibuat ? new Date(tiket.tgl_dibuat).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </div>
                                    </div>
                                    {tiket.pelanggan?.telepon && (
                                        <Button variant="outline" size="sm" className="w-full text-xs h-8 bg-white dark:bg-neutral-950" onClick={() => window.open(`https://wa.me/${tiket.pelanggan.telepon.replace(/^0/, '62')}`, '_blank')}>
                                            <Phone className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Hubungi Pelanggan
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}

DashboardTeknisi.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};
