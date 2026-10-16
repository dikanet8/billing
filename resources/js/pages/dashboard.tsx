import { Head, router } from '@inertiajs/react';

import { dashboard } from '@/routes';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, UserCheck, UserX, UserMinus, TrendingUp, TrendingDown, UserPlus, CreditCard, AlertCircle, Wrench, Filter, CheckCircle2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard({ 
    totalPelanggan = 0, 
    pelangganAktif = 0,
    pelangganBaruBulanIni = 0, 
    pelangganIsolir = 0, 
    pelangganBerhenti = 0,
    pelangganMenunggak = 0,
    totalPendapatan = 0, 
    totalPembayaran = 0,
    totalTagihan = 0,
    pertumbuhanPelanggan = 0,
    pertumbuhanPendapatan = 0,
    transaksiTerakhir = [],
    availableYears = [],
    reqBulan = '',
    reqTahun = '',
    selectedMonth = '',
    kinerjaPenagih = []
}: any) {
    const formatRupiah = (number: number) => {
        return 'Rp ' + Number(number).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
                {/* Baris 1: Status Pelanggan */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                    <Card 
                        onClick={() => router.get('/pelanggan')}
                        className="col-span-2 lg:col-span-1 relative overflow-hidden border border-blue-100 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-900/20 dark:to-neutral-950 rounded-xl shadow-none p-4 flex flex-col gap-2 sm:gap-3 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition duration-200 active:scale-[0.98]"
                    >
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-xs lg:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Total Pelanggan</span>
                                <span className="text-sm sm:text-lg lg:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{totalPelanggan}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-fit flex items-center gap-1 font-medium px-1.5 py-0.5 sm:px-2 rounded-md text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400">
                                    <UserPlus className="w-3 h-3" />
                                    <span>+{pelangganBaruBulanIni} Baru</span>
                                </div>
                                <div className={`w-fit flex items-center gap-1 font-medium px-1.5 py-0.5 sm:px-2 rounded-md ${pertumbuhanPelanggan >= 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400'}`}>
                                    {pertumbuhanPelanggan >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    <span>{Math.abs(pertumbuhanPelanggan)}%</span>
                                </div>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                                Perbandingan dengan bulan lalu
                            </span>
                        </div>
                    </Card>

                    <Card 
                        onClick={() => router.get('/pelanggan', { status: 'AKTIF' })}
                        className="relative overflow-hidden border border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-900/20 dark:to-neutral-950 rounded-xl shadow-none p-4 flex flex-col gap-2 sm:gap-3 cursor-pointer hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition duration-200 active:scale-[0.98]"
                    >
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-xs lg:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Pelanggan Aktif</span>
                                <span className="text-sm sm:text-lg lg:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{pelangganAktif}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <div className="w-fit flex items-center gap-1 font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-1.5 py-0.5 sm:px-2 rounded-md">
                                <span>{totalPelanggan > 0 ? ((pelangganAktif / totalPelanggan) * 100).toFixed(1) : 0}%</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400">Dari total pelanggan</span>
                        </div>
                    </Card>

                    <Card 
                        onClick={() => router.get('/pelanggan', { status: 'ISOLIR' })}
                        className="relative overflow-hidden border border-rose-100 dark:border-rose-900/30 bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-900/20 dark:to-neutral-950 rounded-xl shadow-none p-4 flex flex-col gap-2 sm:gap-3 cursor-pointer hover:shadow-md hover:border-rose-300 dark:hover:border-rose-700 transition duration-200 active:scale-[0.98]"
                    >
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-xs lg:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Pelanggan Isolir</span>
                                <span className="text-sm sm:text-lg lg:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{pelangganIsolir}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <div className="w-fit flex items-center gap-1 font-medium text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 px-1.5 py-0.5 sm:px-2 rounded-md">
                                <span>{totalPelanggan > 0 ? ((pelangganIsolir / totalPelanggan) * 100).toFixed(1) : 0}%</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400">Dari total pelanggan</span>
                        </div>
                    </Card>
                    
                    <Card 
                        onClick={() => router.get('/laporan-tunggakan')}
                        className="relative overflow-hidden border border-amber-100 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/20 dark:to-neutral-950 rounded-xl shadow-none p-4 flex flex-col gap-2 sm:gap-3 cursor-pointer hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition duration-200 active:scale-[0.98]"
                    >
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-xs lg:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Pelanggan Menunggak</span>
                                <span className="text-sm sm:text-lg lg:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{pelangganMenunggak}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <div className="w-fit flex items-center gap-1 font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 px-1.5 py-0.5 sm:px-2 rounded-md">
                                <span>{totalPelanggan > 0 ? ((pelangganMenunggak / totalPelanggan) * 100).toFixed(1) : 0}%</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400">Menunggak &gt; 1 bulan</span>
                        </div>
                    </Card>

                    <Card 
                        onClick={() => router.get('/pelanggan', { status: 'BERHENTI' })}
                        className="relative overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-neutral-50/80 to-white dark:from-neutral-900/20 dark:to-neutral-950 rounded-xl shadow-none p-4 flex flex-col gap-2 sm:gap-3 cursor-pointer hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition duration-200 active:scale-[0.98]"
                    >
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-xs lg:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Pelanggan Berhenti</span>
                                <span className="text-sm sm:text-lg lg:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{pelangganBerhenti}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <div className="w-fit flex items-center gap-1 font-medium text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 px-1.5 py-0.5 sm:px-2 rounded-md">
                                <span>{totalPelanggan > 0 ? ((pelangganBerhenti / totalPelanggan) * 100).toFixed(1) : 0}%</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400">Dari total pelanggan</span>
                        </div>
                    </Card>
                </div>

                {/* Baris 2: Ringkasan Keuangan */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-2">
                    <Card 
                        onClick={() => router.get('/tagihan')}
                        className="relative overflow-hidden border border-amber-100 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/20 dark:to-neutral-950 rounded-xl shadow-none p-4 flex flex-col gap-2 sm:gap-3 cursor-pointer hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition duration-200 active:scale-[0.98]"
                    >
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-xs lg:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Total Tagihan</span>
                                <span className="text-sm sm:text-lg lg:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{formatRupiah(totalTagihan)}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <div className="w-fit flex items-center gap-1 font-medium text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 px-1.5 py-0.5 sm:px-2 rounded-md">
                                <span>-</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400">Keseluruhan tagihan tercatat</span>
                        </div>
                    </Card>

                    <Card 
                        onClick={() => router.get('/laporan')}
                        className="relative overflow-hidden border border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-900/20 dark:to-neutral-950 rounded-xl shadow-none p-4 flex flex-col gap-2 sm:gap-3 cursor-pointer hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition duration-200 active:scale-[0.98]"
                    >
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-xs lg:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Pembayaran Diterima</span>
                                <span className="text-sm sm:text-lg lg:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{formatRupiah(totalPembayaran)}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <div className={`w-fit flex items-center gap-1 font-medium px-1.5 py-0.5 sm:px-2 rounded-md ${pertumbuhanPendapatan >= 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400'}`}>
                                {pertumbuhanPendapatan >= 0 ? <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                                <span>{Math.abs(pertumbuhanPendapatan)}%</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400">
                                {pertumbuhanPendapatan >= 0 ? 'Peningkatan' : 'Penurunan'} dari bln lalu
                            </span>
                        </div>
                    </Card>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 flex flex-col gap-3">
                        <div className="flex items-center justify-between px-1">
                            <div>
                                <h3 className="font-semibold text-base text-neutral-800 dark:text-neutral-200">Transaksi Pembayaran Terakhir</h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Riwayat pembayaran terbaru yang masuk ke sistem.</p>
                            </div>
                            <Button variant="outline" size="sm" className="hidden sm:flex h-7 text-xs px-3 bg-white dark:bg-neutral-900 border-sidebar-border/70 transition-none" onClick={() => router.get('/transaksi')}>Lihat Semua</Button>
                        </div>
                        <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden p-0 gap-0 h-[400px]">
                            <div className="hidden md:block overflow-auto relative h-full">
                                <table className="w-full text-xs text-left">
                                    <thead className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-neutral-800/20 border-b border-sidebar-border/70 dark:border-sidebar-border sticky top-0 z-10 backdrop-blur-sm">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold whitespace-nowrap">Pelanggan</th>
                                            <th className="px-6 py-3 font-semibold whitespace-nowrap">Layanan & Invoice</th>
                                            <th className="px-6 py-3 font-semibold whitespace-nowrap">Tanggal Bayar</th>
                                            <th className="px-6 py-3 font-semibold text-right whitespace-nowrap">Nominal Bayar</th>
                                            <th className="px-6 py-3 font-semibold text-center whitespace-nowrap">Oleh</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                        {transaksiTerakhir.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                                                    Belum ada transaksi pembayaran.
                                                </td>
                                            </tr>
                                        ) : transaksiTerakhir.map((trx: any) => (
                                            <tr key={trx.id_pembayaran} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-neutral-900 dark:text-white mb-0.5">{trx.pelanggan?.nama || 'Unknown'}</div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">{trx.pelanggan?.nomor_pelanggan || '-'}</span>
                                                        <span className="text-neutral-300 dark:text-neutral-600">&bull;</span>
                                                        <span>{trx.pelanggan?.telepon || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-neutral-900 dark:text-white mb-0.5">{trx.pelanggan?.paket?.paket_nama || '-'}</div>
                                                    <div className="text-[10px] text-neutral-500">INV-{trx.id_tagihan} ({trx.tagihan?.bulan_tagihan || '-'})</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span suppressHydrationWarning className="font-medium text-neutral-900 dark:text-white">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(trx.tgl_bayar))}</span>
                                                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium px-1.5 py-0.5 rounded-sm">
                                                            LUNAS
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <div className="font-medium text-neutral-900 dark:text-white">{formatRupiah(trx.jumlah_bayar)}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <span className="inline-flex items-center text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded gap-1">
                                                        <UserCheck className="w-3 h-3 text-blue-500 dark:text-blue-400 opacity-80" />
                                                        {trx.user ? (trx.user.nama || trx.user.name || 'Sistem') : 'Sistem'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="md:hidden overflow-auto relative h-full flex flex-col p-4 gap-3 bg-neutral-50/50 dark:bg-neutral-950/50">
                                {transaksiTerakhir.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-neutral-500">
                                        Belum ada transaksi pembayaran.
                                    </div>
                                ) : transaksiTerakhir.map((trx: any) => (
                                    <div key={trx.id_pembayaran} className="shrink-0 flex flex-col p-4 rounded-sm shadow-sm border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 relative overflow-hidden transition-transform duration-200 active:scale-[0.98]">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex flex-col min-w-0 pr-2">
                                                <div className="font-bold text-sm text-neutral-900 dark:text-white leading-tight line-clamp-1 pb-0.5 flex items-center gap-2">
                                                    {trx.pelanggan?.nama || 'Unknown'}
                                                </div>
                                                <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-1">
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">{trx.pelanggan?.nomor_pelanggan || '-'}</span>
                                                    <span className="text-neutral-300 dark:text-neutral-600">&bull;</span>
                                                    <span className="truncate">{trx.pelanggan?.paket?.paket_nama || '-'}</span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 flex flex-col items-end gap-1.5 mt-0.5">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                                                    LUNAS
                                                </span>
                                                <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                                                    {formatRupiah(trx.jumlah_bayar)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-neutral-500 leading-none mb-1">Diterima oleh</span>
                                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 leading-none">
                                                    <UserCheck className="w-3 h-3 text-blue-500" />
                                                    <span className="truncate max-w-[90px]">{trx.user ? (trx.user.nama || trx.user.name || 'Sistem') : 'Sistem'}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end justify-end">
                                                <span suppressHydrationWarning className="text-[9px] text-neutral-500 leading-none mb-1">Waktu Pembayaran</span>
                                                <span suppressHydrationWarning className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 leading-none">
                                                    {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(trx.tgl_bayar))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between px-1">
                            <div>
                                <h3 className="font-semibold text-base text-neutral-800 dark:text-neutral-200">Kinerja Penagih Bulan Ini</h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Performa setoran dan tagihan per area/penagih.</p>
                            </div>
                            <Button variant="outline" size="sm" className="hidden sm:flex h-7 text-xs px-3 bg-white dark:bg-neutral-900 border-sidebar-border/70 transition-none" onClick={() => router.get('/performa-penagih')}>Lihat Semua</Button>
                        </div>
                        <Card className="p-0 gap-0 flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden h-[400px]">
                            <div className="overflow-auto relative h-full">
                                {kinerjaPenagih && kinerjaPenagih.length > 0 ? (
                                    <ul className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                        {kinerjaPenagih.map((penagih: any, index: number) => {
                                            const progress = penagih.target > 0 ? (penagih.berhasil / penagih.target) * 100 : 0;
                                            return (
                                                <li key={index} className="shrink-0 flex flex-col gap-2 px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-shrink-0 p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                                                                <UserCheck className="w-4 h-4" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <p className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">{penagih.nama || penagih.username}</p>
                                                                <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">{penagih.areas || 'Tidak ada area'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex flex-col">
                                                            <p className="text-xs font-semibold text-neutral-900 dark:text-white leading-tight">{formatRupiah(penagih.setoran)}</p>
                                                            <p className="text-[10px] text-neutral-500 mt-0.5">Disetor dari {formatRupiah(penagih.berhasil)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                                        </div>
                                                        <span className="text-[10px] font-medium text-neutral-500 w-8 text-right">{Math.round(progress)}%</span>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Belum ada data kinerja penagih.</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
