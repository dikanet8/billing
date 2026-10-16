/* eslint-disable @stylistic/brace-style, @stylistic/padding-line-between-statements */
import { Head, router } from '@inertiajs/react';
import { Users, Banknote, BarChart3, TrendingUp, ArrowUpRight, Filter, Phone, CheckCircle2, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { PwaNotificationCard } from '@/components/pwa-notification-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function DashboardPenagih({ 
    target = 0, 
    berhasil = 0, 
    setoran = 0, 
    mengendap = 0, 
    totalPelanggan = 0,
    pelangganBaru = 0,
    pelangganBelumBayar = 0,
    sisaTarget = 0,
    daftarTunggakan = [],
    availableYears = [],
    reqBulan = '',
    reqTahun = '',
    pendapatanHariIni = 0,
    pelangganDitagihHariIni = 0,
    cashOnHand = 0,
    totalSemuaPembayaran = 0,
    totalSemuaSetoran = 0
}: any) {
    const formatRupiah = (number: number) => {
        return 'Rp ' + Number(number).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const [actionMenuOpenId, setActionMenuOpenId] = useState<number | null>(null);
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleTouchStart = (id: number) => {
        pressTimer.current = setTimeout(() => {
            setActionMenuOpenId(id);
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        }, 500); // 500ms for long press
    };

    const handleTouchEnd = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-4 p-4 lg:p-6 w-full">
                <div className="flex justify-end w-full mb-1 sm:mb-0">
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
                        <div className="flex justify-end items-center w-full sm:w-auto gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto h-10 sm:h-9 bg-white dark:bg-neutral-900 shadow-sm border-neutral-200 dark:border-neutral-800">
                                        <Filter className="w-4 h-4" />
                                        <span>{reqBulan || 'Bulan'}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 z-50 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-lg">
                                    {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((month: string) => (
                                        <DropdownMenuItem 
                                            key={month} 
                                            onClick={() => router.get('/dashboard', { bulan: month, tahun: reqTahun }, { preserveState: true })}
                                            className={`cursor-pointer ${month === reqBulan ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : ""}`}
                                        >
                                            {month}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto h-10 sm:h-9 bg-white dark:bg-neutral-900 shadow-sm border-neutral-200 dark:border-neutral-800">
                                        <span>{reqTahun || 'Tahun'}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-32 z-50 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-lg">
                                    {availableYears && availableYears.length > 0 ? (
                                        availableYears.map((year: any) => (
                                            <DropdownMenuItem 
                                                key={year} 
                                                onClick={() => router.get('/dashboard', { bulan: reqBulan, tahun: year }, { preserveState: true })}
                                                className={`cursor-pointer ${String(year) === String(reqTahun) ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : ""}`}
                                            >
                                                {year}
                                            </DropdownMenuItem>
                                        ))
                                    ) : (
                                        <DropdownMenuItem disabled>
                                            Tidak ada data tahun
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                <PwaNotificationCard />

                {/* Main Cards Area */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    {/* Target Area Card */}
                    <Card 
                        className="relative overflow-hidden flex flex-col gap-2 sm:gap-4 border border-blue-100 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-900/20 dark:to-neutral-950 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-none hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] cursor-pointer"
                        onClick={() => router.get('/tagihan', { bulan: `${reqBulan} ${reqTahun}` })}
                    >
                        <BarChart3 className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-16 h-16 sm:w-32 sm:h-32 text-blue-500/[0.04] dark:text-blue-500/10 pointer-events-none" strokeWidth={1.5} />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-1">Total Target Area</span>
                                <span className="text-base sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0 sm:mt-1 truncate">{formatRupiah(target)}</span>
                            </div>
                            <div className="p-1 sm:p-2.5 bg-blue-100/50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg sm:rounded-xl">
                                <BarChart3 className="w-3 h-3 sm:w-5 sm:h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-1">
                            <span className="flex items-center text-neutral-600 dark:text-neutral-300 font-medium bg-neutral-100 dark:bg-neutral-800 px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[11px]">
                                Target Bulan Ini
                            </span>
                        </div>
                    </Card>

                    {/* Berhasil Ditagih Card */}
                    <Card 
                        className="relative overflow-hidden flex flex-col gap-2 sm:gap-4 border border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-900/20 dark:to-neutral-950 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-none hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] cursor-pointer"
                        onClick={() => router.get('/transaksi', { bulan: `${reqBulan} ${reqTahun}` })}
                    >
                        <TrendingUp className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-16 h-16 sm:w-32 sm:h-32 text-emerald-500/[0.04] dark:text-emerald-500/10 pointer-events-none" strokeWidth={1.5} />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-1">Berhasil Ditagih</span>
                                <span className="text-base sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0 sm:mt-1 truncate">{formatRupiah(berhasil)}</span>
                            </div>
                            <div className="p-1 sm:p-2.5 bg-emerald-100/50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg sm:rounded-xl">
                                <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-1">
                            <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-500/10 px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[11px]">
                                <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" /> {(target > 0 ? (berhasil/target)*100 : 0).toFixed(1)}% Tercapai
                            </span>
                        </div>
                    </Card>
                
                    {/* Sisa Target Card */}
                    <Card 
                        className="relative overflow-hidden flex flex-col gap-2 sm:gap-4 border border-sky-100 dark:border-sky-900/30 bg-gradient-to-br from-sky-50/80 to-white dark:from-sky-900/20 dark:to-neutral-950 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-none hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] cursor-pointer"
                        onClick={() => router.get('/tagihan', { bulan: `${reqBulan} ${reqTahun}` })}
                    >
                        <BarChart3 className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-16 h-16 sm:w-32 sm:h-32 text-sky-500/[0.04] dark:text-sky-500/10 pointer-events-none" strokeWidth={1.5} />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-1">Sisa Target Tagihan</span>
                                <span className="text-base sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0 sm:mt-1 truncate">{formatRupiah(sisaTarget)}</span>
                            </div>
                            <div className="p-1 sm:p-2.5 bg-sky-100/50 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 rounded-lg sm:rounded-xl">
                                <BarChart3 className="w-3 h-3 sm:w-5 sm:h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-1">
                            <span className="flex items-center text-sky-600 dark:text-sky-400 font-medium bg-sky-50 dark:bg-sky-500/10 px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[11px]">
                                Belum Terpenuhi
                            </span>
                        </div>
                    </Card>

                    {/* Pelanggan Belum Bayar Card */}
                    <Card 
                        className="relative overflow-hidden flex flex-col gap-2 sm:gap-4 border border-fuchsia-100 dark:border-fuchsia-900/30 bg-gradient-to-br from-fuchsia-50/80 to-white dark:from-fuchsia-900/20 dark:to-neutral-950 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-none hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] cursor-pointer"
                        onClick={() => router.get('/tagihan', { bulan: `${reqBulan} ${reqTahun}` })}
                    >
                        <Users className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-16 h-16 sm:w-32 sm:h-32 text-fuchsia-500/[0.04] dark:text-fuchsia-500/10 pointer-events-none" strokeWidth={1.5} />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-1">Pelanggan Belum Bayar</span>
                                <span className="text-base sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0 sm:mt-1 truncate">{pelangganBelumBayar}</span>
                            </div>
                            <div className="p-1 sm:p-2.5 bg-fuchsia-100/50 dark:bg-fuchsia-900/50 text-fuchsia-600 dark:text-fuchsia-400 rounded-lg sm:rounded-xl">
                                <Users className="w-3 h-3 sm:w-5 sm:h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-1">
                            <span className="flex items-center text-fuchsia-600 dark:text-fuchsia-400 font-medium bg-fuchsia-50 dark:bg-fuchsia-500/10 px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[11px]">
                                Menunggu Pembayaran
                            </span>
                        </div>
                    </Card>

                    {/* Total Pelanggan Card */}
                    <Card 
                        className="relative overflow-hidden flex flex-col gap-2 sm:gap-4 border border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-900/20 dark:to-neutral-950 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-none hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] cursor-pointer"
                        onClick={() => router.get('/pelanggan')}
                    >
                        <Users className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-16 h-16 sm:w-32 sm:h-32 text-indigo-500/[0.04] dark:text-indigo-500/10 pointer-events-none" strokeWidth={1.5} />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-1">Total Pelanggan</span>
                                <span className="text-base sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0 sm:mt-1 truncate">{totalPelanggan}</span>
                            </div>
                            <div className="p-1 sm:p-2.5 bg-indigo-100/50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg sm:rounded-xl">
                                <Users className="w-3 h-3 sm:w-5 sm:h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-1">
                            <span className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-500/10 px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[11px]">
                                Total Di Area Anda
                            </span>
                        </div>
                    </Card>

                    {/* Pelanggan Baru Card */}
                    <Card 
                        className="relative overflow-hidden flex flex-col gap-2 sm:gap-4 border border-teal-100 dark:border-teal-900/30 bg-gradient-to-br from-teal-50/80 to-white dark:from-teal-900/20 dark:to-neutral-950 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-none hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] cursor-pointer"
                        onClick={() => router.get('/pelanggan-baru', { bulan: reqBulan, tahun: reqTahun })}
                    >
                        <Users className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-16 h-16 sm:w-32 sm:h-32 text-teal-500/[0.04] dark:text-teal-500/10 pointer-events-none" strokeWidth={1.5} />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-1">Pelanggan Baru</span>
                                <span className="text-base sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0 sm:mt-1 truncate">{pelangganBaru}</span>
                            </div>
                            <div className="p-1 sm:p-2.5 bg-teal-100/50 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-lg sm:rounded-xl">
                                <Users className="w-3 h-3 sm:w-5 sm:h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-1">
                            <span className="flex items-center text-teal-600 dark:text-teal-400 font-medium bg-teal-50 dark:bg-teal-500/10 px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[11px]">
                                Baru Bulan Ini
                            </span>
                        </div>
                    </Card>
                    {/* Status Setoran Card */}
                    <Card 
                        className="relative overflow-hidden flex flex-col gap-2 sm:gap-4 border border-amber-100 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/20 dark:to-neutral-950 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-none hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] cursor-pointer col-span-1 lg:col-span-1"
                        onClick={() => router.get('/riwayat-setoran')}
                    >
                        <Banknote className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-16 h-16 sm:w-32 sm:h-32 text-amber-500/[0.04] dark:text-amber-500/10 pointer-events-none" strokeWidth={1.5} />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
                                <span className="text-[10px] sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-1">Status Setoran</span>
                                <div className="flex flex-col xl:flex-row xl:items-baseline gap-0 xl:gap-1 mt-0 sm:mt-1 min-w-0">
                                    <span className="text-base sm:text-xl xl:text-2xl font-bold text-neutral-900 dark:text-white truncate">{formatRupiah(setoran)}</span>
                                </div>
                            </div>
                            <div className="p-1 sm:p-2.5 bg-amber-100/50 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-lg sm:rounded-xl shrink-0 ml-1">
                                <Banknote className="w-3 h-3 sm:w-5 sm:h-5" />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-auto pt-1">
                            <span className="flex items-center text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-500/10 px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[11px]">
                                {(berhasil > 0 ? (setoran/berhasil)*100 : 0).toFixed(1)}% Disetorkan
                            </span>
                        </div>
                    </Card>

                    {/* Cash on Hand Card */}
                    <Card 
                        className="relative overflow-hidden flex flex-col gap-2 sm:gap-4 border border-rose-100 dark:border-rose-900/30 bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-900/20 dark:to-neutral-950 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-none hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] cursor-pointer col-span-1 lg:col-span-1"
                        onClick={() => router.get('/riwayat-setoran')}
                    >
                        <Banknote className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-16 h-16 sm:w-32 sm:h-32 text-rose-500/[0.04] dark:text-rose-500/10 pointer-events-none" strokeWidth={1.5} />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
                                <span className="text-[10px] sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-1">Cash on Hand</span>
                                <span className="text-base sm:text-xl xl:text-2xl font-bold text-neutral-900 dark:text-white mt-0 sm:mt-1 truncate">{formatRupiah(cashOnHand)}</span>
                            </div>
                            <div className="p-1 sm:p-2.5 bg-rose-100/50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg sm:rounded-xl shrink-0 ml-1">
                                <Banknote className="w-3 h-3 sm:w-5 sm:h-5" />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-auto pt-1">
                            <span className="flex items-center text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-500/10 px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[11px] truncate">
                                Belum Disetor (Total)
                            </span>
                        </div>
                    </Card>
                </div>

                {/* Statistik Harian Section */}
                <div className="flex flex-col mb-3 sm:mb-4 px-1">
                    <h3 className="font-semibold text-base sm:text-lg text-neutral-800 dark:text-neutral-200">Statistik Harian</h3>
                    <p suppressHydrationWarning className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                        {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date())}
                    </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                    {/* Pendapatan Harian Card */}
                    <Card 
                        className="relative overflow-hidden flex flex-col gap-2 sm:gap-4 border border-violet-100 dark:border-violet-900/30 bg-gradient-to-br from-violet-50/80 to-white dark:from-violet-900/20 dark:to-neutral-950 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-none hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] cursor-pointer"
                        onClick={() => {
                            const today = new Date();
                            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                            router.get('/transaksi', { date: todayStr });
                        }}
                    >
                        <Banknote className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-16 h-16 sm:w-32 sm:h-32 text-violet-500/[0.04] dark:text-violet-500/10 pointer-events-none" strokeWidth={1.5} />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-1">Total Pendapatan</span>
                                <span className="text-base sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0 sm:mt-1 truncate">{formatRupiah(pendapatanHariIni)}</span>
                            </div>
                            <div className="p-1 sm:p-2.5 bg-violet-100/50 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 rounded-lg sm:rounded-xl">
                                <Banknote className="w-3 h-3 sm:w-5 sm:h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-1">
                            <span className="flex items-center text-violet-600 dark:text-violet-400 font-medium bg-violet-50 dark:bg-violet-500/10 px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[11px]">
                                Dana Masuk Hari Ini
                            </span>
                        </div>
                    </Card>

                    {/* Pelanggan Ditagih Hari Ini Card */}
                    <Card 
                        className="relative overflow-hidden flex flex-col gap-2 sm:gap-4 border border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-900/20 dark:to-neutral-950 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-none hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow] cursor-pointer"
                        onClick={() => {
                            const today = new Date();
                            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                            router.get('/transaksi', { date: todayStr });
                        }}
                    >
                        <CheckCircle2 className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-16 h-16 sm:w-32 sm:h-32 text-emerald-500/[0.04] dark:text-emerald-500/10 pointer-events-none" strokeWidth={1.5} />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-1">Pelanggan Ditagih</span>
                                <span className="text-base sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0 sm:mt-1 truncate">{pelangganDitagihHariIni}</span>
                            </div>
                            <div className="p-1 sm:p-2.5 bg-emerald-100/50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg sm:rounded-xl">
                                <CheckCircle2 className="w-3 h-3 sm:w-5 sm:h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-1">
                            <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-500/10 px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[11px]">
                                Membayar Hari Ini
                            </span>
                        </div>
                    </Card>
                </div>
                {/* Tagihan List */}
                <div className="flex flex-col gap-3 mt-2">
                    <div className="flex items-center justify-between px-1">
                        <div>
                            <h3 className="font-semibold text-base text-neutral-800 dark:text-neutral-200">Daftar Pelanggan Menunggak Area Anda</h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">Pelanggan yang memiliki tanggungan tagihan lebih dari 1 bulan.</p>
                        </div>
                        <Button onClick={() => router.get('/tagihan', { filter: 'tunggakan' })} variant="outline" size="sm" className="h-8 text-xs px-3 bg-white dark:bg-neutral-900 border-sidebar-border/70 transition-none">Lihat Semua</Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {daftarTunggakan.length === 0 && (
                                <div className="p-8 text-center text-neutral-500 text-sm md:col-span-2 lg:col-span-3">
                                    Hebat! Semua tagihan area Anda sudah dilunasi bulan ini.
                                </div>
                            )}
                            {daftarTunggakan.map((tagihan: any) => (
                                <div key={tagihan.id_tagihan}
                                    className={`p-3 rounded-sm shadow-sm border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 select-none cursor-pointer relative transition-colors duration-75 ${actionMenuOpenId === null ? 'hover:bg-neutral-100 dark:hover:bg-neutral-800/80 active:bg-neutral-200 dark:active:bg-neutral-700 active:shadow-inner' : ''}`}
                                    onTouchStart={() => handleTouchStart(tagihan.id_tagihan)}
                                    onTouchEnd={handleTouchEnd}
                                    onTouchMove={handleTouchEnd}
                                    onMouseDown={() => handleTouchStart(tagihan.id_tagihan)}
                                    onMouseUp={handleTouchEnd}
                                    onMouseLeave={handleTouchEnd}
                                    onContextMenu={(e) => { e.preventDefault(); }}
                                >
                                    <div className="flex items-start justify-between gap-2 w-full">
                                        <div className="flex flex-col min-w-0 flex-1 pr-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                                    <span className="font-bold text-base text-neutral-900 dark:text-white leading-none">{tagihan.pelanggan?.nama || '-'}</span>
                                                    {tagihan.pelanggan?.tunggakan_count > 1 && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 shrink-0">
                                                            {tagihan.pelanggan.tunggakan_count} BLN
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                                <span className="font-medium text-neutral-700 dark:text-neutral-300">{tagihan.pelanggan?.nomor_pelanggan || tagihan.id_pelanggan}</span>
                                                <span className="text-[10px]">•</span>
                                                <span>{tagihan.nomor_tagihan || ('INV-'+tagihan.id_tagihan)}</span>
                                            </div>
                                            <div className="flex flex-col mt-1 min-w-0 w-full gap-0.5">
                                                <div className="text-[11px] text-neutral-500">
                                                    {tagihan.pelanggan?.telepon || '-'}
                                                </div>
                                                <div className="text-[11px] text-neutral-500 truncate">
                                                    {tagihan.pelanggan?.area?.nama_area || 'Umum'}
                                                </div>
                                                <div className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 line-clamp-2 leading-relaxed mt-0.5 pr-2">
                                                    {tagihan.pelanggan?.alamat || 'Alamat tidak tersedia'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end justify-between shrink-0 ml-auto h-full min-h-[90px]">
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-lg leading-none text-rose-600 dark:text-rose-400">
                                                    {formatRupiah(tagihan.total_tarif)}
                                                </span>
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 mt-1.5 uppercase tracking-wider">
                                                    {tagihan.pelanggan?.paket?.paket_nama || 'Layanan'}
                                                </span>
                                            </div>
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 mt-auto uppercase tracking-wider">
                                                Jatuh Tempo: Tgl {tagihan.pelanggan?.tanggal || '-'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {tagihan.pelanggan?.telepon && (
                                        <Button variant="outline" size="sm" className="w-full text-xs h-8 bg-white dark:bg-neutral-950 mt-1" onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${tagihan.pelanggan.telepon.replace(/^0/, '62')}`, '_blank'); }}>
                                            <Phone className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Hubungi WhatsApp
                                        </Button>
                                    )}

                                </div>
                            ))}
                        </div>
                        {/* Action Menu Bottom Modal (No Animation) */}
                        {actionMenuOpenId !== null && (
                            (() => {
                                const tagihan = daftarTunggakan.find((item: any) => item.id_tagihan === actionMenuOpenId);
                                if (!tagihan) return null;
                                return (
                                    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
                                        <div 
                                            className="absolute inset-0 bg-black/40"
                                            onClick={(e) => { e.stopPropagation(); setActionMenuOpenId(null); }}
                                            onTouchStart={(e) => { e.stopPropagation(); setActionMenuOpenId(null); }}
                                        />
                                        <div className="relative bg-white dark:bg-neutral-900 rounded-t-2xl shadow-xl border-t border-neutral-200 dark:border-neutral-800 pb-8">
                                            <div className="flex justify-center p-3">
                                                <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                                            </div>
                                            <div className="px-4 pb-2 pt-1">
                                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 px-2">Aksi Tagihan</h3>
                                                <div className="flex flex-col gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                        onClick={(e) => { e.stopPropagation(); setActionMenuOpenId(null); toast.info('Menu edit tagihan belum tersedia.'); }}
                                                    >
                                                        <Edit className="w-5 h-5 mr-3" /> Edit
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        onClick={(e) => { e.stopPropagation(); setActionMenuOpenId(null); toast.error(`Tagihan berhasil dihapus.`); }}
                                                    >
                                                        <Trash2 className="w-5 h-5 mr-3" /> Hapus
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                                        onClick={(e) => { e.stopPropagation(); setActionMenuOpenId(null); toast.success(`Pelanggan telah diisolir.`); }}
                                                    >
                                                        <AlertTriangle className="w-5 h-5 mr-3" /> Isolir
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()
                        )}
                </div>
            </div>
        </>
    );
}

DashboardPenagih.layout = {
    breadcrumbs: [
        { label: 'Beranda' },
    ]
};
