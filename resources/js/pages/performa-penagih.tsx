import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Users, Banknote, Calendar, BarChart3, TrendingUp, AlertCircle, ArrowUpRight, Filter } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { TablePagination } from '@/components/ui/table-pagination';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

interface PerformaData {
    id_user: number;
    username: string;
    areas: string;
    target: number;
    berhasil: number;
    setoran: number;
    mengendap: number;
}

export default function PerformaPenagih({ 
    performaData = [], 
    availableYears = [], 
    reqBulan = '', 
    reqTahun = '',
    overallTarget = 0,
    overallBerhasil = 0
}: { 
    performaData: PerformaData[], 
    availableYears: string[], 
    reqBulan: string, 
    reqTahun: string,
    overallTarget?: number,
    overallBerhasil?: number
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPenagih, setSelectedPenagih] = useState<PerformaData | null>(null);
    const [setoranData, setSetoranData] = useState({ 
        nominal: '', 
        keterangan: '',
        tgl_setoran: (() => {
            const today = new Date();
            const offset = today.getTimezoneOffset() * 60000;
            return new Date(today.getTime() - offset).toISOString().split('T')[0];
        })()
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number).replace(/\u00A0/g, ' ').replace(/\u202f/g, ' ');
    };

    const handleOpenModal = (penagih: PerformaData) => {
        setSelectedPenagih(penagih);
        setSetoranData({ 
            nominal: '', 
            keterangan: '',
            tgl_setoran: (() => {
                const today = new Date();
                const offset = today.getTimezoneOffset() * 60000;
                return new Date(today.getTime() - offset).toISOString().split('T')[0];
            })()
        });
        setIsModalOpen(true);
    };

    const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setSetoranData({ ...setoranData, nominal: value });
    };

    const handleSubmitSetoran = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPenagih || !setoranData.nominal) return;

        setIsSubmitting(true);
        router.post('/performa-penagih/setoran', {
            id_user: selectedPenagih.id_user,
            nominal: setoranData.nominal,
            keterangan: setoranData.keterangan,
            tgl_setoran: setoranData.tgl_setoran
        }, {
            onSuccess: (page) => {
                setIsSubmitting(false);
                setIsModalOpen(false);
                const flash = page.props.flash as any;
                if (flash?.success) {
                    toast.success(flash.success);
                } else {
                    toast.success('Setoran berhasil dicatat.');
                }
            },
            onError: () => {
                setIsSubmitting(false);
                toast.error('Terjadi kesalahan saat mencatat setoran.');
            }
        });
    };

    const normalizedData = performaData.map(item => ({
        ...item,
        target: Number(item.target) || 0,
        berhasil: Number(item.berhasil) || 0,
        setoran: Number(item.setoran) || 0,
        mengendap: Number(item.mengendap) || 0
    }));

    const totalTarget = Number(overallTarget) || 0;
    const totalBerhasil = Number(overallBerhasil) || 0;
    const totalSetoran = normalizedData.reduce((sum, item) => sum + item.setoran, 0);
    const totalMengendap = totalBerhasil - totalSetoran;

    const paginatedData = normalizedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <>
            <Head title="Performa Penagih" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 lg:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full mb-1 sm:mb-0">
                    <div className="hidden sm:flex flex-col">
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Performa Penagih</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Pantau performa, target, dan setoran dari masing-masing penagih.</p>
                    </div>
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
                                            onClick={() => router.get('/performa-penagih', { bulan: month, tahun: reqTahun }, { preserveState: true })}
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
                                                onClick={() => router.get('/performa-penagih', { bulan: reqBulan, tahun: year }, { preserveState: true })}
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

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Target Area Card */}
                    <Card className="relative overflow-hidden border border-blue-100 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-900/20 dark:to-neutral-950 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
                        <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            <BarChart3 className="w-16 h-16 sm:w-32 sm:h-32" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Total Target Area</span>
                                <span className="text-lg sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{formatRupiah(totalTarget)}</span>
                            </div>
                            <div className="p-1 sm:p-2 bg-blue-100/50 dark:bg-blue-900/50 rounded-lg">
                                <BarChart3 className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs relative z-10">
                            <div className="w-fit flex items-center gap-1 font-medium text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 px-1.5 py-0.5 sm:px-2 rounded-md">
                                <span>Target</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400">Keseluruhan tagihan area</span>
                        </div>
                    </Card>
                    
                    {/* Berhasil Ditagih Card */}
                    <Card className="relative overflow-hidden border border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-900/20 dark:to-neutral-950 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
                        <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            <TrendingUp className="w-16 h-16 sm:w-32 sm:h-32" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Berhasil Ditagih</span>
                                <span className="text-lg sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{formatRupiah(totalBerhasil)}</span>
                            </div>
                            <div className="p-1 sm:p-2 bg-emerald-100/50 dark:bg-emerald-900/50 rounded-lg">
                                <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs relative z-10">
                            <div className="w-fit flex items-center gap-1 font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-1.5 py-0.5 sm:px-2 rounded-md">
                                <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span>{(totalTarget > 0 ? (totalBerhasil/totalTarget)*100 : 0).toFixed(1)}%</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400">Tercapai dari target</span>
                        </div>
                    </Card>
                    
                    {/* Total Setoran Card */}
                    <Card className="relative overflow-hidden border border-amber-100 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/20 dark:to-neutral-950 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
                        <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            <Banknote className="w-16 h-16 sm:w-32 sm:h-32" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Total Setoran</span>
                                <span className="text-lg sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{formatRupiah(totalSetoran)}</span>
                            </div>
                            <div className="p-1 sm:p-2 bg-amber-100/50 dark:bg-amber-900/50 rounded-lg">
                                <Banknote className="w-3 h-3 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs relative z-10">
                            <div className="w-fit flex items-center gap-1 font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 px-1.5 py-0.5 sm:px-2 rounded-md">
                                <span>{(totalBerhasil > 0 ? (totalSetoran/totalBerhasil)*100 : 0).toFixed(1)}%</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400">Disetorkan dari hasil tagih</span>
                        </div>
                    </Card>
                    
                    {/* Dana Belum Disetor Card */}
                    <Card className="relative overflow-hidden border border-rose-100 dark:border-rose-900/30 bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-900/20 dark:to-neutral-950 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
                        <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            <AlertCircle className="w-16 h-16 sm:w-32 sm:h-32" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Dana Belum Disetor</span>
                                <span className="text-lg sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{formatRupiah(totalMengendap)}</span>
                            </div>
                            <div className="p-1 sm:p-2 bg-rose-100/50 dark:bg-rose-900/50 rounded-lg">
                                <AlertCircle className="w-3 h-3 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs relative z-10">
                            <div className="w-fit flex items-center gap-1 font-medium text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 px-1.5 py-0.5 sm:px-2 rounded-md">
                                <span>Pending</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400">Sisa uang tunai di penagih</span>
                        </div>
                    </Card>
                </div>

                {/* Table Data */}
                <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-none overflow-hidden p-0 gap-0">
                    <div className="p-4 border-b border-sidebar-border/70 dark:border-sidebar-border flex items-center gap-2 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-md text-neutral-600 dark:text-neutral-400">
                            <Users className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Rincian Per Penagih</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="hidden md:table w-full text-sm text-left">
                            <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-3.5 font-medium">Nama Penagih</th>
                                    <th className="px-6 py-3.5 font-medium">Cakupan Area</th>
                                    <th className="px-6 py-3.5 font-medium">Target Tagihan</th>
                                    <th className="px-6 py-3.5 font-medium">Berhasil Ditagih (Lunas)</th>
                                    <th className="px-6 py-3.5 font-medium">Total Setoran</th>
                                    <th className="px-6 py-3.5 font-medium">Sisa Uang/Mengendap</th>
                                    <th className="px-6 py-3.5 font-medium text-center">Pencapaian</th>
                                    <th className="px-6 py-3.5 font-medium text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {paginatedData.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-neutral-500">
                                            Tidak ada data penagih.
                                        </td>
                                    </tr>
                                )}
                                {paginatedData.map((data, index) => {
                                    const percent = data.target > 0 ? (data.berhasil / data.target) * 100 : 0;
                                    return (
                                        <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-neutral-900 dark:text-white">
                                                    {data.username}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300 text-xs">
                                                {data.areas || '-'}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">
                                                {formatRupiah(data.target)}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                                                {formatRupiah(data.berhasil)}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-amber-600 dark:text-amber-400">
                                                {formatRupiah(data.setoran)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-bold ${data.mengendap > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-500'}`}>
                                                    {formatRupiah(data.mengendap)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{percent.toFixed(1)}%</span>
                                                    <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => handleOpenModal(data)}
                                                    className="h-8 text-[11px] px-3 bg-white dark:bg-neutral-900"
                                                    disabled={data.berhasil === 0}
                                                >
                                                    Catat Setoran
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Mobile Cards */}
                    <div className="flex flex-col md:hidden divide-y divide-sidebar-border/70 dark:divide-sidebar-border border-t border-sidebar-border/70">
                        {paginatedData.length === 0 && (
                            <div className="p-8 text-center text-neutral-500 text-sm">
                                Tidak ada data penagih.
                            </div>
                        )}
                        {paginatedData.map((data, index) => {
                            const percent = data.target > 0 ? (data.berhasil / data.target) * 100 : 0;
                            return (
                                <div key={index} className="p-4 bg-white dark:bg-neutral-900 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 border border-blue-100 dark:border-blue-800/50">
                                                <Users className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm text-neutral-900 dark:text-white line-clamp-1">{data.username}</span>
                                                <span className="text-[10px] text-neutral-500 line-clamp-1">{data.areas || 'Semua Area'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] font-semibold text-neutral-500">{percent.toFixed(1)}%</span>
                                            <div className="w-16 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
                                        <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                                            <span className="text-neutral-500">Target</span>
                                            <span className="font-semibold text-neutral-900 dark:text-white">{formatRupiah(data.target)}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                                            <span className="text-neutral-500">Berhasil</span>
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatRupiah(data.berhasil)}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                                            <span className="text-neutral-500">Setoran</span>
                                            <span className="font-semibold text-amber-600 dark:text-amber-400">{formatRupiah(data.setoran)}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                                            <span className="text-neutral-500">Sisa</span>
                                            <span className={`font-semibold ${data.mengendap > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-900 dark:text-white'}`}>{formatRupiah(data.mengendap)}</span>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleOpenModal(data)}
                                        className="w-full mt-1 bg-white dark:bg-neutral-900"
                                        disabled={data.berhasil === 0}
                                    >
                                        Catat Setoran
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                    
                    <TablePagination 
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        setItemsPerPage={setItemsPerPage}
                        totalItems={performaData.length}
                        paginatedLength={paginatedData.length}
                        itemName="penagih"
                    />
                </Card>
            </div>

            {/* Modal Input Setoran */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[95vw] max-h-[90vh] sm:max-w-xl border-sidebar-border/70 p-0 overflow-hidden gap-0 bg-white dark:bg-neutral-950 rounded-xl" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <form onSubmit={handleSubmitSetoran} className="flex flex-col">
                        <DialogHeader className="relative px-6 py-4 border-b border-sidebar-border/70 overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/20">
                            <div className="relative z-10 flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-blue-600 dark:text-blue-400 rounded-lg shadow-sm">
                                    <Banknote className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 text-left">
                                    <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                        Catat Setoran Tunai
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Masukkan jumlah uang tunai yang disetorkan oleh penagih <strong>{selectedPenagih?.username}</strong>.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="flex flex-col px-6 py-6 gap-6 overflow-y-auto max-h-[65vh]">
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="nominal" className="text-neutral-700 dark:text-neutral-300">Nominal Setoran <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                                <span className="text-neutral-500 sm:text-sm font-medium">Rp</span>
                                            </div>
                                            <Input
                                                id="nominal"
                                                type="text"
                                                inputMode="numeric"
                                                value={setoranData.nominal ? new Intl.NumberFormat('id-ID').format(parseInt(setoranData.nominal)) : ''}
                                                onChange={handleNominalChange}
                                                className="pl-10 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500"
                                                placeholder="0"
                                                required
                                                autoComplete="off"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="tgl_setoran" className="text-neutral-700 dark:text-neutral-300">Tanggal Setoran <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="tgl_setoran"
                                            type="date"
                                            value={setoranData.tgl_setoran}
                                            onChange={(e) => setSetoranData({ ...setoranData, tgl_setoran: e.target.value })}
                                            className="block w-full bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <Label htmlFor="keterangan" className="text-neutral-700 dark:text-neutral-300">Keterangan (Opsional)</Label>
                                        <Input
                                            id="keterangan"
                                            type="text"
                                            value={setoranData.keterangan}
                                            onChange={(e) => setSetoranData({ ...setoranData, keterangan: e.target.value })}
                                            className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500"
                                            placeholder="Contoh: Setoran minggu pertama"
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 border-t border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20 sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                className="bg-white dark:bg-neutral-950"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !setoranData.nominal}
                                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                            >
                                {isSubmitting && <Spinner className="w-4 h-4 mr-2" />}
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Setoran'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

PerformaPenagih.layout = {
    breadcrumbs: [
        {
            title: 'Performa Penagih',
            href: '/performa-penagih',
        },
    ],
};
