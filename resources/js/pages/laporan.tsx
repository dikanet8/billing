import { Head, router } from '@inertiajs/react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Download, Calendar, Activity, ArrowUpRight, ArrowDownRight, Users, CheckCircle2, AlertCircle, Package, PieChart, Wallet , Receipt, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface UnpaidByArea {
    name: string;
    amount: number;
    count: number;
}

interface ExpenseBreakdown {
    name: string;
    amount: number;
    percent: number;
}

interface MonthlyData {
    month: string;
    income: number;
    expense: number;
    profit: number;
    status: 'Naik' | 'Turun';
}

interface CurrentMonthStats {
    income: number;
    expense: number;
    profit: number;
    unpaid: number;
    incomeGrowth: number;
    expenseGrowth: number;
}

interface TagihanStats {
    totalAmount: number;
    totalCount: number;
    lunasAmount: number;
    lunasCount: number;
    unpaidAmount: number;
    unpaidCount: number;
}

interface ChartData {
    date: number;
    income: number;
    expense: number;
}

interface UnpaidList {
    id: string;
    customer_name: string;
    area_name: string;
    package_name: string;
    amount: number;
}

interface LaporanProps {
    availableYears?: string[];
    reqBulan?: string;
    reqTahun?: string;
    selectedMonth?: string;
    currentMonthStats?: CurrentMonthStats;
    unpaidByArea?: UnpaidByArea[];
    expenseBreakdown?: ExpenseBreakdown[];
    monthlyData?: MonthlyData[];
    tagihanStats?: TagihanStats;
    chartData?: ChartData[];
    unpaidList?: UnpaidList[];
}

export default function Laporan({ 
    availableYears = [], 
    reqBulan = '', 
    reqTahun = '', 
    selectedMonth = '', 
    currentMonthStats = { income: 0, expense: 0, profit: 0, unpaid: 0, incomeGrowth: 0, expenseGrowth: 0 }, 
    unpaidByArea = [], 
    expenseBreakdown = [], 
    monthlyData = [],
    tagihanStats = { totalAmount: 0, totalCount: 0, lunasAmount: 0, lunasCount: 0, unpaidAmount: 0, unpaidCount: 0 },
    chartData = [],
    unpaidList = []
}: LaporanProps) {
    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number).replace(/\u00A0/g, ' ').replace(/\u202f/g, ' ');
    };

    const currentMonth = currentMonthStats;
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

    return (
        <>
            <Head title="Laporan Keuangan" />
            <div className="flex flex-col gap-4 p-4 pb-6 md:pb-6 lg:p-6 lg:pb-6">
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
                                            onClick={(e) => {
                                                e.preventDefault();
                                                router.get('/laporan', { bulan: month, tahun: reqTahun }, { preserveState: true });
                                            }}
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
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    router.get('/laporan', { bulan: reqBulan, tahun: year }, { preserveState: true });
                                                }}
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
                        <Button 
                            onClick={() => window.open(`/laporan/cetak?bulan=${reqBulan}&tahun=${reqTahun}`, '_blank', 'noreferrer')}
                            className="w-full sm:w-auto h-9 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 text-white shadow-sm transition-all hover:shadow-md"
                        >
                            <Download className="w-4 h-4 mr-2" /> Unduh Laporan PDF
                        </Button>
                    </div>
                </div>

                {/* 1. Empat Kartu Utama (KPI) - Desain diperbarui sesuai referensi gambar */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Total Tagihan Card */}
                    <Card className="relative overflow-hidden flex flex-col gap-2 sm:gap-4 border border-indigo-100/60 dark:border-indigo-900/30 bg-white dark:bg-neutral-900 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <Receipt className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-16 h-16 sm:w-32 sm:h-32 text-indigo-500/[0.04] dark:text-indigo-500/10 pointer-events-none" strokeWidth={1.5} />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-1">Total Tagihan</span>
                                <span className="text-base sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0 sm:mt-1 truncate">{formatRupiah(tagihanStats?.totalAmount || 0)}</span>
                            </div>
                            <div className="p-1 sm:p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg sm:rounded-xl">
                                <Receipt className="w-3 h-3 sm:w-5 sm:h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-1">
                            <span className="flex items-center text-neutral-600 dark:text-neutral-400 font-medium bg-neutral-100 dark:bg-neutral-800 px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[11px]">
                                {tagihanStats?.totalCount || 0} Invoice
                            </span>
                            <span className="text-neutral-400 dark:text-neutral-500 truncate hidden sm:inline">Diterbitkan bulan ini</span>
                        </div>
                    </Card>

                    {/* Unpaid Card (Belum Terbayar) */}
                    <Card className="relative overflow-hidden flex flex-col gap-2 sm:gap-4 border border-amber-100/60 dark:border-amber-900/30 bg-white dark:bg-neutral-900 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <AlertCircle className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-16 h-16 sm:w-32 sm:h-32 text-amber-500/[0.04] dark:text-amber-500/10 pointer-events-none" strokeWidth={1.5} />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-1">Belum Terbayar</span>
                                <span className="text-base sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0 sm:mt-1 truncate">{formatRupiah(tagihanStats?.unpaidAmount || 0)}</span>
                            </div>
                            <div className="p-1 sm:p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg sm:rounded-xl">
                                <AlertCircle className="w-3 h-3 sm:w-5 sm:h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-1">
                            <span className="flex items-center text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/30 px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[11px]">
                                {tagihanStats?.unpaidCount || 0} Invoice
                            </span>
                            <span className="text-neutral-400 dark:text-neutral-500 truncate hidden sm:inline">Tagihan pending</span>
                        </div>
                    </Card>

                    {/* Paid Card (Terbayar) */}
                    <Card className="relative overflow-hidden flex flex-col gap-2 sm:gap-4 border border-emerald-100/60 dark:border-emerald-900/30 bg-white dark:bg-neutral-900 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <CheckCircle2 className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-16 h-16 sm:w-32 sm:h-32 text-emerald-500/[0.04] dark:text-emerald-500/10 pointer-events-none" strokeWidth={1.5} />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-1">Terbayar</span>
                                <span className="text-base sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0 sm:mt-1 truncate">{formatRupiah(tagihanStats?.lunasAmount || 0)}</span>
                            </div>
                            <div className="p-1 sm:p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg sm:rounded-xl">
                                <CheckCircle2 className="w-3 h-3 sm:w-5 sm:h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-1">
                            <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[11px]">
                                {tagihanStats?.lunasCount || 0} Invoice
                            </span>
                            <span className="text-neutral-400 dark:text-neutral-500 truncate hidden sm:inline">Tagihan terbayar lunas</span>
                        </div>
                    </Card>

                    {/* Income Card */}
                    <Card className="relative overflow-hidden flex flex-col gap-2 sm:gap-4 border border-emerald-100/60 dark:border-emerald-900/30 bg-white dark:bg-neutral-900 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <TrendingUp className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-16 h-16 sm:w-32 sm:h-32 text-emerald-500/[0.04] dark:text-emerald-500/10 pointer-events-none" strokeWidth={1.5} />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-1">Total Pemasukan</span>
                                <span className="text-base sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0 sm:mt-1 truncate">{formatRupiah(currentMonth.income)}</span>
                            </div>
                            <div className="p-1 sm:p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg sm:rounded-xl">
                                <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-1">
                            <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[11px]">
                                <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" /> {currentMonth.incomeGrowth}%
                            </span>
                            <span className="text-neutral-400 dark:text-neutral-500 truncate hidden sm:inline">Peningkatan dari bulan lalu</span>
                        </div>
                    </Card>
                </div>

                {/* 2. Ringkasan Pemasukan & Pengeluaran */}
                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {/* Expense Card */}
                        <Card className="relative overflow-hidden flex flex-col gap-2 sm:gap-4 border border-rose-100/60 dark:border-rose-900/30 bg-white dark:bg-neutral-900 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <TrendingDown className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-16 h-16 sm:w-32 sm:h-32 text-rose-500/[0.04] dark:text-rose-500/10 pointer-events-none" strokeWidth={1.5} />
                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                    <span className="text-[10px] sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-1">Total Pengeluaran</span>
                                    <span className="text-base sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0 sm:mt-1 truncate">{formatRupiah(currentMonth.expense)}</span>
                                </div>
                                <div className="p-1 sm:p-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg sm:rounded-xl">
                                    <TrendingDown className="w-3 h-3 sm:w-5 sm:h-5" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-1">
                                <span className="flex items-center text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-900/30 px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[11px]">
                                    <ArrowDownRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" /> {Math.abs(currentMonth.expenseGrowth)}%
                                </span>
                                <span className="text-neutral-400 dark:text-neutral-500 truncate hidden sm:inline">vs bulan lalu</span>
                            </div>
                        </Card>

                        {/* Net Profit Card */}
                        <Card className="relative overflow-hidden flex flex-col gap-2 sm:gap-4 border border-blue-100/60 dark:border-blue-900/30 bg-white dark:bg-neutral-900 p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <DollarSign className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-16 h-16 sm:w-32 sm:h-32 text-blue-500/[0.04] dark:text-blue-500/10 pointer-events-none" strokeWidth={1.5} />
                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                    <span className="text-[10px] sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-1">Laba Bersih</span>
                                    <span className="text-base sm:text-2xl font-bold text-neutral-900 dark:text-white mt-0 sm:mt-1 truncate">{formatRupiah(currentMonth.profit)}</span>
                                </div>
                                <div className="p-1 sm:p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg sm:rounded-xl">
                                    <DollarSign className="w-3 h-3 sm:w-5 sm:h-5" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-1">
                                <span className="flex items-center text-neutral-600 dark:text-neutral-400 font-medium bg-neutral-100 dark:bg-neutral-800 px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[11px]">
                                    Aktual
                                </span>
                                <span className="text-neutral-400 dark:text-neutral-500 truncate hidden sm:inline">Profit bulan berjalan</span>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* 3. Metrik Pelanggan & Rekapitulasi Kas (Baris Bawah) */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                    {/* Table Data Arus Kas */}
                    <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden p-0 gap-0 w-full">
                        <div className="px-4 py-3 border-b border-sidebar-border/70 dark:border-sidebar-border flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/20">
                            <div className="flex items-center gap-2">
                                <div className="p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-md text-neutral-600 dark:text-neutral-400">
                                    <Wallet className="w-3.5 h-3.5" />
                                </div>
                                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Arus Kas Bulan Ini</h3>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="hidden md:table w-full text-xs text-left">
                                <thead className="text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                    <tr>
                                        <th className="px-4 py-2.5 font-medium">Periode Bulan</th>
                                        <th className="px-4 py-2.5 font-medium">Pendapatan</th>
                                        <th className="px-4 py-2.5 font-medium">Pengeluaran</th>
                                        <th className="px-4 py-2.5 font-medium">Net Laba Bersih</th>
                                        <th className="px-4 py-2.5 font-medium text-center">Trend Laba</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {monthlyData.map((data, index) => (
                                        <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                                            <td className="px-4 py-2.5">
                                                <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-neutral-400" /> {data.month}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-200">
                                                {formatRupiah(data.income)}
                                            </td>
                                            <td className="px-4 py-2.5 font-medium text-rose-600 dark:text-rose-400">
                                                - {formatRupiah(data.expense)}
                                            </td>
                                            <td className="px-4 py-2.5 font-bold text-emerald-600 dark:text-emerald-500">
                                                {formatRupiah(data.profit)}
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                {data.status === 'Naik' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold px-1.5 py-0.5 rounded">
                                                        <ArrowUpRight className="w-2.5 h-2.5" /> Naik
                                                    </span>
                                                )}
                                                {data.status === 'Turun' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-semibold px-1.5 py-0.5 rounded">
                                                        <ArrowDownRight className="w-2.5 h-2.5" /> Turun
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="flex flex-col md:hidden divide-y divide-sidebar-border/70 dark:divide-sidebar-border border-t border-sidebar-border/70">
                            {monthlyData.length === 0 && (
                                <div className="p-8 text-center text-neutral-500 text-sm">
                                    Tidak ada data bulanan.
                                </div>
                            )}
                            {monthlyData.map((data, index) => (
                                <div key={index} className="p-4 bg-white dark:bg-neutral-900 flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <div className="font-semibold text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-neutral-400" /> {data.month}
                                        </div>
                                        {data.status === 'Naik' && (
                                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold px-1 sm:px-2 py-0.5 rounded">
                                                <ArrowUpRight className="w-3 h-3" /> Naik
                                            </span>
                                        )}
                                        {data.status === 'Turun' && (
                                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-semibold px-1 sm:px-2 py-0.5 rounded">
                                                <ArrowDownRight className="w-3 h-3" /> Turun
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                                            <span className="text-neutral-500">Pendapatan</span>
                                            <span className="font-semibold text-neutral-900 dark:text-white">{formatRupiah(data.income)}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                                            <span className="text-neutral-500">Pengeluaran</span>
                                            <span className="font-semibold text-rose-600 dark:text-rose-400">- {formatRupiah(data.expense)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-sidebar-border/70 pt-2 mt-1">
                                        <span className="text-xs text-neutral-500">Net Laba Bersih</span>
                                        <span className="font-bold text-sm text-emerald-600 dark:text-emerald-500">{formatRupiah(data.profit)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* 4. Grafik & Tabel Transaksi */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    {/* Grafik Pemasukan vs Pengeluaran */}
                    <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden p-0 gap-0 w-full h-[400px]">
                        <div className="px-4 py-3 border-b border-sidebar-border/70 dark:border-sidebar-border flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/20">
                            <div className="flex items-center gap-2">
                                <div className="p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-md text-neutral-600 dark:text-neutral-400">
                                    <Activity className="w-3.5 h-3.5" />
                                </div>
                                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Tren Harian ({selectedMonth})</h3>
                            </div>
                        </div>
                        <div className="p-4 flex-1 w-full h-full pb-10">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-neutral-800" />
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                        <YAxis tickFormatter={(val) => `Rp ${new Intl.NumberFormat('id-ID').format(val)}`} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} width={90} />
                                        <Tooltip 
                                            formatter={(value: any) => formatRupiah(Number(value) || 0)}
                                            labelFormatter={(label) => `Tanggal ${label}`}
                                            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend verticalAlign="top" height={36}/>
                                        <Area type="monotone" name="Pemasukan" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                                        <Area type="monotone" name="Pengeluaran" dataKey="expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-neutral-500">Tidak ada data tren harian</div>
                            )}
                        </div>
                    </Card>

                    {/* Rincian Yang Belum Bayar */}
                    <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden p-0 gap-0 w-full h-[400px]">
                        <div className="px-4 py-3 border-b border-sidebar-border/70 dark:border-sidebar-border flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/20">
                            <div className="flex items-center gap-2">
                                <div className="p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-md text-neutral-600 dark:text-neutral-400">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                </div>
                                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Daftar Yang Belum Bayar</h3>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-0">
                            <table className="w-full text-xs text-left">
                                <thead className="sticky top-0 text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="px-4 py-2.5 font-medium">Pelanggan</th>
                                        <th className="px-4 py-2.5 font-medium">Area</th>
                                        <th className="px-4 py-2.5 font-medium text-right">Nominal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {unpaidList.length > 0 ? unpaidList.map((t, index) => (
                                        <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                                            <td className="px-4 py-3 text-neutral-900 dark:text-neutral-200">
                                                <div className="font-medium line-clamp-1">{t.customer_name}</div>
                                                <div className="text-[10px] text-neutral-500">{t.package_name}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-neutral-500 dark:text-neutral-400">{t.area_name}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-rose-600 dark:text-rose-400">
                                                {formatRupiah(t.amount)}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-neutral-500 text-sm">Tidak ada tagihan yang belum dibayar bulan ini</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* 5. Grafik Statistik Tambahan */}
                <div className="grid grid-cols-1 gap-4 mt-4">

                    {/* Rincian Pengeluaran */}
                    <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden p-0 gap-0 w-full h-[350px]">
                        <div className="px-4 py-3 border-b border-sidebar-border/70 dark:border-sidebar-border flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/20">
                            <div className="flex items-center gap-2">
                                <div className="p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-md text-neutral-600 dark:text-neutral-400">
                                    <PieChart className="w-3.5 h-3.5" />
                                </div>
                                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Rincian Pengeluaran</h3>
                            </div>
                        </div>
                        <div className="p-4 flex-1 w-full h-full pb-4">
                            {expenseBreakdown.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={expenseBreakdown} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" tickFormatter={(val) => `Rp ${new Intl.NumberFormat('id-ID').format(val)}`} tick={{ fontSize: 11 }} />
                                        <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                                        <Tooltip formatter={(value: any) => formatRupiah(Number(value) || 0)} />
                                        <Bar dataKey="amount" name="Nominal" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20}>
                                            {expenseBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-neutral-500">Tidak ada data pengeluaran</div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}

Laporan.layout = {
    breadcrumbs: [
        {
            title: 'Laporan Keuangan',
            href: '/laporan',
        },
    ],
};
