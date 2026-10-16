import { useState, useMemo, useRef, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { Search, Printer, Trash2, ArrowLeft, Users, Receipt, Wallet, Banknote, FileWarning, MoreHorizontal, FileText, Loader2, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { TablePagination } from '@/components/ui/table-pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function InvoicePeriode({
    bulan,
    dataTagihan = [],
    pelangganBelum = [],
    metrics
}: {
    bulan: string;
    dataTagihan: any[];
    pelangganBelum?: any[];
    metrics?: any;
}) {
    const { auth } = usePage().props;
    const canManage = ['SUPERADMIN', 'OWNER'].includes((auth?.user as any)?.role);

    const [activeTab, setActiveTab] = useState<'generated' | 'ungenerated'>('generated');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('semua');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [generatingId, setGeneratingId] = useState<number | null>(null);

    // Mobile States
    const [actionMenuOpenId, setActionMenuOpenId] = useState<string | number | null>(null);
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

    const handleTouchStart = (e: any, id: string | number) => {
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

    const filteredTagihan = useMemo(() => {
        return (dataTagihan || []).filter(t => {
            const matchesSearch = (t.pelanggan?.nama?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                (String(t.nomor_tagihan).toLowerCase().includes(searchQuery.toLowerCase()));
            
            let matchesStatus = true;
            if (statusFilter === 'lunas') {
                matchesStatus = t.status_bayar?.toLowerCase() === 'lunas';
            } else if (statusFilter === 'belum') {
                matchesStatus = t.status_bayar?.toLowerCase() !== 'lunas';
            }
            
            return matchesSearch && matchesStatus;
        });
    }, [dataTagihan, searchQuery, statusFilter]);

    const filteredPelangganBelum = useMemo(() => {
        return (pelangganBelum || []).filter(p => {
            const matchesSearch = (p.nama?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                (String(p.nomor_pelanggan || '').toLowerCase().includes(searchQuery.toLowerCase())) ||
                                (String(p.telepon || '').includes(searchQuery));
            return matchesSearch;
        });
    }, [pelangganBelum, searchQuery]);

    const formatRupiah = (angka: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka).replace(/\u00A0/g, ' ').replace(/\u202f/g, ' ');
    };

    const totalItems = activeTab === 'generated' ? filteredTagihan.length : filteredPelangganBelum.length;
    const paginatedTagihan = filteredTagihan.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const paginatedPelangganBelum = filteredPelangganBelum.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePrint = (invoice: any) => {
        toast.info('Fitur cetak PDF akan segera tersedia.');
    };

    const handlePrintAll = () => {
        toast.info('Fitur cetak semua PDF akan segera tersedia.');
    };

    const handleDelete = () => {
        if (!selectedInvoice) return;
        setIsDeleting(true);
        router.delete(`/tagihan/${selectedInvoice.id_tagihan}`, {
            onSuccess: () => {
                toast.success('Tagihan berhasil dihapus!');
                setIsDeleteOpen(false);
                setSelectedInvoice(null);
            },
            onFinish: () => setIsDeleting(false)
        });
    };

    const handleGenerateSingle = (pelanggan: any) => {
        setGeneratingId(pelanggan.id);
        router.post('/tagihan/generate-single', {
            bulan: bulan,
            id_pelanggan: pelanggan.id,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Tagihan untuk ${pelanggan.nama} berhasil digenerate.`);
                setGeneratingId(null);
            },
            onError: (err) => {
                toast.error(err.message || 'Gagal generate tagihan pelanggan.');
                setGeneratingId(null);
            },
            onFinish: () => setGeneratingId(null)
        });
    };

    return (
        <>
            <Head title={`Invoice Periode ${bulan}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" onClick={() => router.get('/periode-tagihan')} className="h-9 w-9 rounded-full">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Invoice: {bulan}</h1>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Total {dataTagihan.length} tagihan bulan ini.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handlePrintAll} className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm hover:bg-neutral-800 dark:hover:bg-neutral-200">
                            <Printer className="w-4 h-4 mr-2" /> Cetak Semua PDF
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <Card className="relative overflow-hidden border border-blue-100 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-900/20 dark:to-neutral-950 rounded-xl shadow-none p-3 sm:p-4 flex flex-col justify-between">
                        <div className="absolute -right-4 -top-4 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            <Users className="w-16 h-16" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] sm:text-xs font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Total Pelanggan</span>
                                <span className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{metrics?.total_pelanggan || 0}</span>
                            </div>
                            <div className="p-1.5 bg-blue-100/50 dark:bg-blue-900/50 rounded-lg shrink-0">
                                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </Card>
                    <Card className="relative overflow-hidden border border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-900/20 dark:to-neutral-950 rounded-xl shadow-none p-3 sm:p-4 flex flex-col justify-between">
                        <div className="absolute -right-4 -top-4 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            <Receipt className="w-16 h-16" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] sm:text-xs font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Invoice Dibuat</span>
                                <span className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{metrics?.invoice_dibuat || 0}</span>
                            </div>
                            <div className="p-1.5 bg-emerald-100/50 dark:bg-emerald-900/50 rounded-lg shrink-0">
                                <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </Card>
                    <Card className="relative overflow-hidden border border-rose-100 dark:border-rose-900/30 bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-900/20 dark:to-neutral-950 rounded-xl shadow-none p-3 sm:p-4 flex flex-col justify-between">
                        <div className="absolute -right-4 -top-4 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            <FileWarning className="w-16 h-16" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] sm:text-xs font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Belum Dibuat</span>
                                <span className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{metrics?.belum_dibuat || 0}</span>
                            </div>
                            <div className="p-1.5 bg-rose-100/50 dark:bg-rose-900/50 rounded-lg shrink-0">
                                <FileWarning className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            </div>
                        </div>
                    </Card>
                    <Card className="relative overflow-hidden border border-amber-100 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/20 dark:to-neutral-950 rounded-xl shadow-none p-3 sm:p-4 flex flex-col justify-between">
                        <div className="absolute -right-4 -top-4 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            <Banknote className="w-16 h-16" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] sm:text-xs font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Tunai / Cash</span>
                                <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white truncate" title={formatRupiah(metrics?.tunai || 0)}>{formatRupiah(metrics?.tunai || 0)}</span>
                            </div>
                            <div className="p-1.5 bg-amber-100/50 dark:bg-amber-900/50 rounded-lg shrink-0">
                                <Banknote className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </Card>
                    <Card className="relative overflow-hidden border border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-900/20 dark:to-neutral-950 rounded-xl shadow-none p-3 sm:p-4 flex flex-col justify-between col-span-2 lg:col-span-1">
                        <div className="absolute -right-4 -top-4 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            <Wallet className="w-16 h-16" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] sm:text-xs font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400">Transfer</span>
                                <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white truncate" title={formatRupiah(metrics?.transfer || 0)}>{formatRupiah(metrics?.transfer || 0)}</span>
                            </div>
                            <div className="p-1.5 bg-indigo-100/50 dark:bg-indigo-900/50 rounded-lg shrink-0">
                                <Wallet className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-lg shadow-sm overflow-hidden p-0 gap-0">
                    {/* Tab Navigation */}
                    <div className="flex items-center px-4 pt-2 border-b border-sidebar-border/70 dark:border-sidebar-border gap-2 sm:gap-4 overflow-x-auto bg-neutral-50/50 dark:bg-neutral-900/40">
                        <button
                            onClick={() => { setActiveTab('generated'); setCurrentPage(1); }}
                            className={`py-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'generated'
                                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                                }`}
                        >
                            <Receipt className="w-4 h-4" />
                            <span>Sudah Dibuat</span>
                            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                {dataTagihan.length}
                            </span>
                        </button>
                        <button
                            onClick={() => { setActiveTab('ungenerated'); setCurrentPage(1); }}
                            className={`py-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'ungenerated'
                                ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                                }`}
                        >
                            <FileWarning className="w-4 h-4" />
                            <span>Belum Dibuat</span>
                            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                                {pelangganBelum.length}
                            </span>
                        </button>
                    </div>

                    <div className="p-4 border-b border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full sm:max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                type="search"
                                placeholder={activeTab === 'generated' ? "Cari nama atau nomor invoice..." : "Cari nama, ID, atau telepon pelanggan..."}
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-neutral-50 dark:bg-neutral-950 pl-9 border-neutral-200 dark:border-neutral-800 shadow-sm transition-all focus-visible:ring-blue-500 h-9 text-xs sm:text-sm"
                            />
                        </div>

                        {activeTab === 'generated' && (
                            <div className="w-full sm:w-48">
                                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="w-full bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-sm focus:ring-blue-500 h-9 text-xs sm:text-sm">
                                        <SelectValue placeholder="Status Pembayaran" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="semua">Semua Status</SelectItem>
                                        <SelectItem value="lunas">Lunas</SelectItem>
                                        <SelectItem value="belum">Belum Lunas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* TAB 1: SUDAH DIGENERATE */}
                    {activeTab === 'generated' && (
                        <>
                            {/* Mobile View (Cards) */}
                            <div className="flex flex-col md:hidden px-4 py-4 gap-3">
                                {filteredTagihan.length > 0 ? filteredTagihan.slice(0, visibleMobileCount).map((invoice, index) => {
                                    return (
                                        <div key={index} 
                                            className={`p-4 rounded-sm shadow-sm border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 select-none cursor-pointer relative overflow-hidden transition-transform duration-200 ${actionMenuOpenId === null ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800/80 active:bg-neutral-50 dark:active:bg-neutral-800 active:scale-[0.98]' : ''}`}
                                            onTouchStart={(e) => handleTouchStart(e, invoice.id_tagihan)}
                                            onTouchEnd={handleTouchEnd}
                                            onTouchCancel={handleTouchEnd}
                                            onTouchMove={handleTouchEnd}
                                            onContextMenu={(e) => { e.preventDefault(); }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (actionMenuOpenId === null && canManage) {
                                                    setActionMenuOpenId(invoice.id_tagihan);
                                                }
                                            }}
                                        >
                                            <div className="flex flex-col w-full">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex flex-col flex-1 min-w-0 pr-2">
                                                        <div className="font-bold text-base text-neutral-900 dark:text-white leading-tight truncate pb-0.5 flex items-center gap-2">
                                                            {invoice.pelanggan?.nama}
                                                            {invoice.pelanggan?.status?.toUpperCase() === 'AKTIF' ? (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-transparent border border-emerald-500 text-emerald-600 dark:text-emerald-400">AKTIF</span>
                                                            ) : invoice.pelanggan?.status?.toUpperCase() === 'ISOLIR' ? (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-transparent border border-rose-500 text-rose-600 dark:text-rose-400">ISOLIR</span>
                                                            ) : invoice.pelanggan?.status ? (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-transparent border border-neutral-500 text-neutral-600 dark:text-neutral-400">{invoice.pelanggan?.status?.toUpperCase()}</span>
                                                            ) : null}
                                                        </div>
                                                        <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                                                            <span className="font-mono font-medium">{invoice.nomor_tagihan || `INV-${invoice.id_tagihan}`}</span>
                                                            <span className="text-neutral-300 dark:text-neutral-600">&bull;</span>
                                                            <span className="truncate">{invoice.pelanggan?.paket?.nama_paket || invoice.pelanggan?.paket?.paket_nama}</span>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 flex flex-col items-end gap-1">
                                                        {invoice.status_bayar?.toLowerCase() === 'lunas' ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white dark:bg-emerald-500 shadow-sm">
                                                                LUNAS
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-orange-500 text-white dark:bg-orange-600 shadow-sm">
                                                                BELUM LUNAS
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] text-neutral-500 leading-none mb-0.5">Total Tagihan</span>
                                                        <span className="text-[13px] font-bold text-neutral-900 dark:text-white leading-none">
                                                            {formatRupiah(invoice.total_tarif)}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] text-neutral-500 leading-none mb-0.5">Jatuh Tempo</span>
                                                        <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 leading-none">
                                                            {invoice.pelanggan?.tanggal ? `${invoice.pelanggan.tanggal} ${bulan}` : '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="py-12 text-center text-sm text-neutral-500">
                                        Tidak ada tagihan yang ditemukan.
                                    </div>
                                )}
                                {filteredTagihan.length > visibleMobileCount && (
                                    <div ref={observerTarget} className="flex justify-center p-4">
                                        <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Action Menu Bottom Sheet - Rendered outside transformed elements */}
                            {(() => {
                                const activeInvoice = filteredTagihan.find(t => t.id_tagihan === actionMenuOpenId);
                                if (!activeInvoice) return null;
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
                                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">{activeInvoice.pelanggan?.nama}</h3>
                                                <p className="text-sm text-neutral-500">Pilih aksi untuk invoice ini</p>
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
                                                            handlePrint(activeInvoice);
                                                        }}
                                                    >
                                                        <Printer className="w-5 h-5 mr-3 text-blue-500" /> Cetak Invoice
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-start h-14 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-semibold text-base transition-colors"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setActionMenuOpenId(null);
                                                            setSelectedInvoice(activeInvoice);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="w-5 h-5 mr-3 text-red-500" /> Hapus Invoice
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Desktop View (Table) */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
                                    <thead>
                                        <tr className="bg-neutral-50/50 dark:bg-neutral-800/20 border-b border-neutral-200 dark:border-neutral-800 text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">
                                            <th className="px-6 py-4">Pelanggan & Invoice</th>
                                            <th className="px-6 py-4">Total Tarif</th>
                                            <th className="px-6 py-4">Jatuh Tempo</th>
                                            <th className="px-6 py-4">Status</th>
                                            {canManage && <th className="px-6 py-4 text-center">Aksi</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        {paginatedTagihan.length > 0 ? paginatedTagihan.map((invoice, index) => (
                                            <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                                                        {invoice.pelanggan?.nama}
                                                        {invoice.pelanggan?.status?.toUpperCase() === 'AKTIF' ? (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-transparent border border-emerald-500 text-emerald-600 dark:text-emerald-400">AKTIF</span>
                                                        ) : invoice.pelanggan?.status?.toUpperCase() === 'ISOLIR' ? (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-transparent border border-rose-500 text-rose-600 dark:text-rose-400">ISOLIR</span>
                                                        ) : invoice.pelanggan?.status ? (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-transparent border border-neutral-500 text-neutral-600 dark:text-neutral-400">{invoice.pelanggan?.status?.toUpperCase()}</span>
                                                        ) : null}
                                                    </div>
                                                    <div className="text-xs flex items-center gap-2 mt-0.5">
                                                        <span className="font-mono font-medium text-neutral-500">
                                                            {invoice.nomor_tagihan || `INV-${invoice.id_tagihan}`}
                                                        </span>
                                                        <span className="text-neutral-300 dark:text-neutral-600">&bull;</span>
                                                        <span className="text-neutral-500">{invoice.pelanggan?.paket?.nama_paket || invoice.pelanggan?.paket?.paket_nama}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">
                                                    {formatRupiah(invoice.total_tarif)}
                                                </td>
                                                <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                                                    {invoice.pelanggan?.tanggal ? `${invoice.pelanggan.tanggal} ${bulan}` : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {invoice.status_bayar?.toLowerCase() === 'lunas' ? (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white dark:bg-emerald-500 shadow-sm">
                                                            LUNAS
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider bg-orange-500 text-white dark:bg-orange-600 shadow-sm">
                                                            BELUM LUNAS
                                                        </span>
                                                    )}
                                                </td>
                                                {canManage && (
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="h-8 px-3 rounded-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                                                onClick={() => handlePrint(invoice)}
                                                            >
                                                                <Printer className="w-3.5 h-3.5 mr-1.5" /> Cetak
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="h-8 px-3 rounded-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                                                                onClick={() => {
                                                                    setSelectedInvoice(invoice);
                                                                    setIsDeleteOpen(true);
                                                                }}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Hapus
                                                            </Button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={canManage ? 5 : 4} className="px-6 py-12 text-center text-neutral-500">
                                                    Tidak ada tagihan yang ditemukan.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* TAB 2: BELUM DIGENERATE */}
                    {activeTab === 'ungenerated' && (
                        <>
                            {/* Mobile View for Belum Dibuat */}
                            <div className="flex flex-col md:hidden px-4 py-4 gap-3">
                                {filteredPelangganBelum.length > 0 ? filteredPelangganBelum.slice(0, visibleMobileCount).map((pelanggan, index) => {
                                    const isGenerating = generatingId === pelanggan.id;
                                    return (
                                        <div key={index} className="p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col min-w-0 pr-2">
                                                    <span className="font-bold text-base text-neutral-900 dark:text-white truncate">
                                                        {pelanggan.nama}
                                                    </span>
                                                    <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                                                        <span className="font-mono">{pelanggan.nomor_pelanggan || ('ID #' + pelanggan.id)}</span>
                                                        <span>&bull;</span>
                                                        <span>{pelanggan.paket?.paket_nama || '-'}</span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
                                                    Belum Ada Invoice
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center text-xs pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-neutral-400">Tarif / Bln</span>
                                                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                                        {formatRupiah(pelanggan.paket?.paket_tarif || 0)}
                                                    </span>
                                                </div>
                                                {canManage && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleGenerateSingle(pelanggan)}
                                                        disabled={isGenerating}
                                                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                                    >
                                                        {isGenerating ? 'Memproses...' : 'Generate Tagihan'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="py-12 text-center text-sm text-neutral-500">
                                        Semua pelanggan sudah memiliki tagihan untuk bulan ini.
                                    </div>
                                )}
                            </div>

                            {/* Desktop View for Belum Dibuat */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
                                    <thead>
                                        <tr className="bg-neutral-50/50 dark:bg-neutral-800/20 border-b border-neutral-200 dark:border-neutral-800 text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">
                                            <th className="px-6 py-4">Nama Pelanggan</th>
                                            <th className="px-6 py-4">ID / No. Pelanggan</th>
                                            <th className="px-6 py-4">Paket Internet</th>
                                            <th className="px-6 py-4">Tarif Bulanan</th>
                                            <th className="px-6 py-4">Tgl Jatuh Tempo</th>
                                            {canManage && <th className="px-6 py-4 text-center">Aksi</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        {paginatedPelangganBelum.length > 0 ? paginatedPelangganBelum.map((pelanggan, index) => {
                                            const isGenerating = generatingId === pelanggan.id;
                                            return (
                                                <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-neutral-900 dark:text-white">
                                                            {pelanggan.nama}
                                                        </div>
                                                        <div className="text-xs text-neutral-500">
                                                            {pelanggan.telepon || '-'} &bull; {pelanggan.area?.nama_area || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-neutral-600 dark:text-neutral-400">
                                                        {pelanggan.nomor_pelanggan || ('ID #' + pelanggan.id)}
                                                    </td>
                                                    <td className="px-6 py-4 text-neutral-800 dark:text-neutral-200 font-medium">
                                                        {pelanggan.paket?.paket_nama || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">
                                                        {formatRupiah(pelanggan.paket?.paket_tarif || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                                                        {pelanggan.tanggal ? `Tgl ${pelanggan.tanggal}` : '-'}
                                                    </td>
                                                    {canManage && (
                                                        <td className="px-6 py-4 text-center">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleGenerateSingle(pelanggan)}
                                                                disabled={isGenerating}
                                                                className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                                            >
                                                                {isGenerating ? 'Memproses...' : 'Generate Tagihan'}
                                                            </Button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan={canManage ? 6 : 5} className="px-6 py-12 text-center text-neutral-500">
                                                    Semua pelanggan sudah memiliki tagihan untuk bulan ini.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* Pagination */}
                    <div className="hidden md:block">
                        <TablePagination 
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            setItemsPerPage={setItemsPerPage}
                            totalItems={totalItems}
                            paginatedLength={activeTab === 'generated' ? paginatedTagihan.length : paginatedPelangganBelum.length}
                            itemName={activeTab === 'generated' ? "invoice" : "pelanggan"}
                        />
                    </div>
                </Card>
            </div>

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent
                    className="sm:max-w-md bg-white dark:bg-neutral-900 border-sidebar-border/70 p-0 overflow-hidden shadow-lg"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader className="px-5 py-3.5 border-b border-sidebar-border/70 dark:border-sidebar-border bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-100/50 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-lg shrink-0 mt-0.5">
                                <Trash2 className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col text-left">
                                <DialogTitle className="text-base font-bold text-neutral-800 dark:text-white">
                                    Konfirmasi Hapus
                                </DialogTitle>
                                <DialogDescription className="text-xs text-neutral-500 mt-0.5">
                                    Hapus tagihan secara permanen.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="px-5 py-4">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Apakah Anda yakin ingin menghapus tagihan <span className="font-semibold text-neutral-900 dark:text-white">{selectedInvoice?.nomor_tagihan || 'INV-' + selectedInvoice?.id_tagihan}</span> untuk pelanggan <span className="font-semibold text-neutral-900 dark:text-white">{selectedInvoice?.pelanggan?.nama}</span>? Tindakan ini tidak dapat dibatalkan.
                        </p>
                    </div>

                    <DialogFooter className="px-5 py-3.5 border-t border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-row items-center justify-end gap-2">
                        <Button variant="outline" className="w-full sm:w-auto h-9 text-xs" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
                            Batal
                        </Button>
                        <Button 
                            variant="destructive" 
                            className="w-full sm:w-auto h-9 text-xs bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Tagihan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
