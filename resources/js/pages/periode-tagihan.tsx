import { useState, useMemo, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { CalendarDays, Plus, Receipt, Wallet, Banknote, Search, AlertCircle, TrendingUp, MoreHorizontal, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';
import { TablePagination } from '@/components/ui/table-pagination';
import AppLayout from '@/layouts/app-layout';

export default function PeriodeTagihan({ dataPeriode, monthsList }: { dataPeriode: any[], monthsList: string[] }) {
    const { auth } = usePage().props;
    const canManage = ['SUPERADMIN', 'OWNER'].includes((auth?.user as any)?.role);

    const [searchQuery, setSearchQuery] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
    const [visibleMobileCount, setVisibleMobileCount] = useState(10);

    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setVisibleMobileCount(prev => prev + 10);
            }
        }, { threshold: 0.1 });

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [observerTarget.current]);

    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const touchStartXRef = useRef<number | null>(null);
    const touchStartYRef = useRef<number | null>(null);

    const handleTouchStart = (e: any, id: string) => {
        if (e.touches && e.touches.length > 0) {
            touchStartXRef.current = e.touches[0].clientX;
            touchStartYRef.current = e.touches[0].clientY;
        } else {
            touchStartXRef.current = e.clientX;
            touchStartYRef.current = e.clientY;
        }
        longPressTimerRef.current = setTimeout(() => {
            setActionMenuOpenId(id);
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
            longPressTimerRef.current = null;
        }, 500);
    };

    const handleTouchEnd = (e: any) => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
        if (e.type === 'touchmove' && e.touches && e.touches.length > 0 && touchStartXRef.current !== null && touchStartYRef.current !== null) {
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const moveX = Math.abs(currentX - touchStartXRef.current);
            const moveY = Math.abs(currentY - touchStartYRef.current);
            if (moveX > 10 || moveY > 10) {
                if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                }
            }
        }
    };

    const sortedData = useMemo(() => {
        const indoMonths: Record<string, number> = {
            'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
            'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
        };

        const parseBulan = (bulanStr: string) => {
            if (!bulanStr) return 0;
            const parts = bulanStr.split(' ');
            if (parts.length < 2) return 0;
            const monthName = parts[0].toLowerCase();
            const year = parseInt(parts[1], 10);
            const monthIdx = indoMonths[monthName] ?? 0;
            return year * 100 + monthIdx;
        };

        return [...dataPeriode].sort((a, b) => {
            return parseBulan(b.bulan_tagihan) - parseBulan(a.bulan_tagihan);
        });
    }, [dataPeriode]);

    const filteredPeriode = useMemo(() => {
        if (!searchQuery) return sortedData;
        return sortedData.filter(p => p.bulan_tagihan.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [sortedData, searchQuery]);

    const enhancedPeriode = useMemo(() => {
        return filteredPeriode.map(periode => {
            const totalInvoice = Number(periode.total_invoice || 0);
            const totalNominal = Number(periode.total_nominal || 0);
            const lunasCount = Number(periode.lunas_count || 0);
            const lunasNominal = Number(periode.lunas_nominal || 0);
            const percentLunas = totalInvoice > 0 ? Math.round((lunasCount / totalInvoice) * 100) : 0;
            
            const getMetodeTotal = (metode: string) => {
                const m = periode.metode_breakdown?.find((x: any) => String(x.metode_bayar).toLowerCase() === metode.toLowerCase());
                return Number(m?.total || 0);
            };

            const totalTunai = getMetodeTotal('tunai') || getMetodeTotal('cash');
            const totalTransfer = getMetodeTotal('transfer');

            return {
                ...periode,
                totalInvoice,
                totalNominal,
                lunasCount,
                lunasNominal,
                percentLunas,
                totalTunai,
                totalTransfer
            };
        });
    }, [filteredPeriode]);

    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };

    const totalItems = enhancedPeriode.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const paginatedPeriode = enhancedPeriode.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleOpenAdd = () => {
        setSelectedMonth('');
        setIsAddOpen(true);
    };

    const handleSaveAdd = () => {
        if (!selectedMonth) return;
        setIsSubmitting(true);
        router.post('/tagihan/generate', { bulan: selectedMonth }, {
            onSuccess: () => {
                toast.success(`Periode ${selectedMonth} berhasil digenerate.`);
                setIsAddOpen(false);
                setIsSubmitting(false);
            },
            onError: (err) => {
                toast.error(err.bulan || 'Terjadi kesalahan saat membuat periode tagihan.');
                setIsSubmitting(false);
            },
            preserveScroll: true
        });
    };

    return (
        <>
            <Head title="Periode Tagihan" />

            <div className="flex flex-1 flex-col gap-3 sm:gap-6 p-3 sm:p-4 lg:p-6">
                <div className="hidden sm:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2 sm:mb-0">
                    <div className="hidden sm:block">
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Periode Tagihan</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Kelola daftar bulan tagihan dan laporan per periode.</p>
                    </div>
                    {canManage && (
                        <div className="flex w-full sm:w-auto items-center gap-2 mt-4 sm:mt-0">
                            <Button onClick={handleOpenAdd} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                                <Plus className="w-4 h-4 mr-2" /> Tambah Periode Manual
                            </Button>
                        </div>
                    )}
                </div>

                <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden p-0 gap-0">
                    <div className="p-4 border-b border-sidebar-border/70 dark:border-sidebar-border flex flex-col xl:flex-row items-center justify-between gap-4 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="relative w-full xl:max-w-md">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <Input 
                                type="search"
                                placeholder="Cari bulan periode (Cth: September 2026)..." 
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-white dark:bg-neutral-950 pl-9 border-neutral-200 dark:border-neutral-800 shadow-sm focus-visible:ring-blue-500"
                            />
                        </div>
                    </div>

                    {filteredPeriode.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white dark:bg-neutral-900">
                            <div className="w-20 h-20 bg-neutral-50 dark:bg-neutral-800/50 rounded-full flex items-center justify-center mb-6">
                                <AlertCircle className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Tidak Ada Periode</h3>
                            <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">Data periode tagihan belum tersedia atau tidak cocok dengan pencarian.</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile View (Cards) */}
                            <div className="flex flex-col md:hidden px-4 py-4 gap-3">
                                {enhancedPeriode.slice(0, visibleMobileCount).map((periode, index) => {
                                    return (
                                        <div key={index} 
                                            className={`p-4 rounded-sm shadow-sm border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 select-none cursor-pointer relative overflow-hidden transition-transform duration-200 ${actionMenuOpenId === null ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800/80 active:bg-neutral-50 dark:active:bg-neutral-800 active:scale-[0.98]' : ''}`}
                                            onTouchStart={(e) => handleTouchStart(e, periode.bulan_tagihan)}
                                            onTouchEnd={handleTouchEnd}
                                            onTouchCancel={handleTouchEnd}
                                            onTouchMove={handleTouchEnd}
                                            onContextMenu={(e) => { e.preventDefault(); }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (actionMenuOpenId === null) {
                                                    router.get(`/invoice-periode/${encodeURIComponent(periode.bulan_tagihan)}`);
                                                }
                                            }}
                                        >
                                            <div className="flex flex-col w-full">
                                                <div className="flex items-start justify-between gap-2 w-full">
                                                    <div className="flex flex-col min-w-0 flex-1 pr-2">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <CalendarDays className="w-4 h-4 text-blue-500" />
                                                            <span className="font-bold text-base text-neutral-900 dark:text-white leading-tight truncate pb-0.5">{periode.bulan_tagihan}</span>
                                                        </div>
                                                        <div className="flex flex-col mt-1 min-w-0 w-full gap-1">
                                                            <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                                                                <Receipt className="w-3 h-3 text-neutral-400" /> {periode.totalInvoice} Invoice Dibuat
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end justify-start shrink-0 ml-auto h-full">
                                                        <div className="flex flex-col items-end gap-1.5">
                                                            {periode.percentLunas === 100 ? (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">LUNAS</span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">BERJALAN</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-3">
                                                    <div className="flex justify-between text-[10px] mb-1">
                                                        <span className="text-neutral-500">Progress Pembayaran</span>
                                                        <span className="font-bold text-neutral-900 dark:text-white">{periode.percentLunas}% ({periode.lunasCount}/{periode.totalInvoice})</span>
                                                    </div>
                                                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                                        <div 
                                                            className={`h-1.5 rounded-full transition-all duration-500 ${periode.percentLunas === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                            style={{ width: `${periode.percentLunas}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                                            <Wallet className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] text-neutral-500 leading-none mb-0.5">Lunas Terbayar</span>
                                                            <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                                                                {formatRupiah(periode.lunasNominal)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[9px] text-neutral-500 leading-none mb-0.5">Total Tagihan</span>
                                                            <span className="text-[13px] font-bold text-neutral-700 dark:text-neutral-300 leading-none">
                                                                {formatRupiah(periode.totalNominal)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {enhancedPeriode.length > visibleMobileCount && (
                                    <div ref={observerTarget} className="flex justify-center p-4">
                                        <Spinner className="w-5 h-5 text-neutral-400" />
                                    </div>
                                )}
                            </div>

                            {/* Action Menu Bottom Sheet - Rendered outside transformed elements */}
                            {(() => {
                                const activePeriode = enhancedPeriode.find(p => p.bulan_tagihan === actionMenuOpenId);
                                if (!activePeriode) return null;
                                return (
                                    <div className="fixed inset-0 z-[9999] flex flex-col justify-end md:hidden">
                                        <div
                                            className="absolute inset-0 bg-black/60"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActionMenuOpenId(null); }}
                                            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setActionMenuOpenId(null); }}
                                            onTouchStart={(e) => { e.stopPropagation(); }}
                                        />
                                        <div className="relative bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl border-t border-neutral-200/50 dark:border-neutral-800/50 pb-8 ring-1 ring-black/5 animate-in slide-in-from-bottom-full duration-200">
                                            <div className="flex justify-center p-4">
                                                <div className="w-16 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
                                            </div>
                                            <div className="px-6 mb-2">
                                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">{activePeriode.bulan_tagihan}</h3>
                                                <p className="text-sm text-neutral-500">Pilih aksi untuk periode ini</p>
                                            </div>
                                            <div className="px-4 mt-4">
                                                <div className="flex flex-col gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-start h-14 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl font-semibold text-base transition-colors"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setActionMenuOpenId(null);
                                                            router.get(`/invoice-periode/${encodeURIComponent(activePeriode.bulan_tagihan)}`);
                                                        }}
                                                    >
                                                        <Receipt className="w-5 h-5 mr-3 text-blue-500" /> Lihat Semua Invoice
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                            
                            {/* Desktop View (Table) */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm text-left hidden md:table">
                                    <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                        <tr>
                                            <th className="px-6 py-3.5 font-medium w-[25%]">Periode Bulan</th>
                                            <th className="px-6 py-3.5 font-medium w-[18%]">Total Tagihan</th>
                                            <th className="px-6 py-3.5 font-medium w-[22%]">Status Progress</th>
                                            <th className="px-6 py-3.5 font-medium w-[15%]">Pembayaran (Lunas)</th>
                                            <th className="px-6 py-3.5 font-medium w-[15%]">Metode Pembayaran</th>
                                            <th className="px-6 py-3.5 font-medium w-[5%] text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                        {paginatedPeriode.map((periode, index) => (
                                            <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 rounded-[2px] border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400">
                                                            <CalendarDays className="w-6 h-6 text-blue-500" />
                                                        </div>
                                                        <div className="flex flex-col gap-1 items-start">
                                                            <div className="font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                                {periode.bulan_tagihan}
                                                            </div>
                                                            <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 font-mono bg-transparent px-1.5 py-0.5 rounded-[2px] border border-blue-500/50 flex items-center gap-1">
                                                                <Receipt className="w-3 h-3" /> {periode.totalInvoice} Invoice
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                                                        {formatRupiah(periode.totalNominal)}
                                                    </div>
                                                    <div className="text-[11px] text-neutral-500 mt-0.5">
                                                        Tagihan periode ini
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1.5 w-full max-w-[170px]">
                                                        <div className="flex justify-between text-xs font-medium">
                                                            <span className="text-neutral-900 dark:text-white">{periode.percentLunas}% Lunas</span>
                                                            <span className="text-neutral-500">{periode.lunasCount}/{periode.totalInvoice}</span>
                                                        </div>
                                                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                                            <div 
                                                                className={`h-1.5 rounded-full transition-all duration-500 ${periode.percentLunas === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                                style={{ width: `${periode.percentLunas}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                        {formatRupiah(periode.lunasNominal)}
                                                    </div>
                                                    <div className="text-[10px] font-medium text-neutral-500 mt-0.5">
                                                        {periode.lunasCount} invoice terbayar
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1 text-xs text-neutral-600 dark:text-neutral-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] text-neutral-400">Tunai:</span>
                                                            <span className="text-neutral-900 dark:text-white font-medium">{formatRupiah(periode.totalTunai)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] text-neutral-400">Transfer:</span>
                                                            <span className="text-neutral-900 dark:text-white font-medium">{formatRupiah(periode.totalTransfer)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-44 border-sidebar-border/70 shadow-md">
                                                            <DropdownMenuItem onClick={() => router.get(`/invoice-periode/${encodeURIComponent(periode.bulan_tagihan)}`)} className="cursor-pointer">
                                                                <Eye className="w-4 h-4 mr-2 text-neutral-500" /> Lihat Detail Invoice
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="hidden md:block">
                                <TablePagination 
                                    currentPage={currentPage}
                                    setCurrentPage={setCurrentPage}
                                    itemsPerPage={itemsPerPage}
                                    setItemsPerPage={setItemsPerPage}
                                    totalItems={totalItems}
                                    paginatedLength={paginatedPeriode.length}
                                    itemName="periode"
                                />
                            </div>
                        </>
                    )}
                </Card>
            </div>

            {/* Modal Tambah Manual */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden p-0">
                    <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
                        <DialogTitle className="text-xl font-bold text-neutral-900 dark:text-white flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-3">
                                <Plus className="w-4 h-4" />
                            </div>
                            Tambah Periode Manual
                        </DialogTitle>
                    </div>
                    <div className="px-6 py-6">
                        <DialogDescription className="text-neutral-500 mb-6">
                            Pilih bulan untuk di-*generate* menjadi tagihan baru. Sistem akan secara otomatis membuat invoice untuk seluruh pelanggan aktif yang belum memiliki tagihan di bulan tersebut.
                        </DialogDescription>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Bulan Tagihan</label>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isSubmitting}>
                                    <SelectTrigger className="w-full h-12 rounded-xl">
                                        <SelectValue placeholder="Pilih bulan..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60 rounded-xl">
                                        {monthsList.map((m, idx) => (
                                            <SelectItem key={idx} value={m} className="py-2 cursor-pointer">{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-5 bg-neutral-50 dark:bg-neutral-900/30 border-t border-neutral-100 dark:border-neutral-800 gap-2 sm:gap-0">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsAddOpen(false)}
                            disabled={isSubmitting}
                            className="rounded-xl h-11"
                        >
                            Batal
                        </Button>
                        <Button 
                            onClick={handleSaveAdd} 
                            disabled={isSubmitting || !selectedMonth}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-8"
                        >
                            {isSubmitting ? (
                                <><Spinner className="w-4 h-4 mr-2" /> Proses...</>
                            ) : (
                                "Generate Tagihan"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

PeriodeTagihan.layout = {
    breadcrumbs: [
        {
            title: 'Periode Tagihan',
            href: '/periode-tagihan',
        },
    ],
};
