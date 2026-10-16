import { useEffect, useState, useRef, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Search, Plus, MoreVertical, CheckCircle2, AlertTriangle, AlertCircle, Edit, Trash2, Receipt, FileText, CheckCircle, XCircle, CreditCard, ChevronDown, Download, MessageCircle, CalendarDays, Send, Banknote, Printer, Phone, MapPin, Package, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { usePage } from '@inertiajs/react';
import { Spinner } from '@/components/ui/spinner';
import { useEcho } from '@laravel/echo-react';

const monthOrder: Record<string, number> = {
    'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4, 'Mei': 5, 'Juni': 6,
    'Juli': 7, 'Agustus': 8, 'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
};

const getMonthValue = (bulan_tagihan: string) => {
    if (!bulan_tagihan) return 0;
    const parts = bulan_tagihan.split(' ');
    if (parts.length !== 2) return 0;
    const month = monthOrder[parts[0]] || 0;
    const year = parseInt(parts[1], 10) || 0;
    return year * 100 + month;
};

export default function Tagihan({ dataTagihan = [], availableMonths = [], selectedMonth = '' }: { dataTagihan?: any[], availableMonths?: string[], selectedMonth?: string }) {
    const { auth } = usePage().props;
    const canManage = ['SUPERADMIN', 'OWNER'].includes((auth?.user as any)?.role);
    const isPenagih = (auth?.user as any)?.role === 'PENAGIH';

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [filterArea, setFilterArea] = useState<string | number>('Semua');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [mobileVisibleCount, setMobileVisibleCount] = useState(20);
    const observerTarget = useRef(null);

    // Modal Pembayaran
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successInvoiceInfo, setSuccessInvoiceInfo] = useState<any>(null);
    const [selectedTagihan, setSelectedTagihan] = useState<any>(null);
    const [selectedTagihanIds, setSelectedTagihanIds] = useState<number[]>([]);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [catatan, setCatatan] = useState('');


    const [actionMenuOpenId, setActionMenuOpenId] = useState<number | null>(null);
    const [isPressingId, setIsPressingId] = useState<number | null>(null);
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressTriggered = useRef(false);

    const handleTouchStart = (id: number) => {
        if (isPenagih) return; // Penagih tidak diizinkan menggunakan aksi menu long press

        setIsPressingId(id);
        isLongPressTriggered.current = false;
        pressTimer.current = setTimeout(() => {
            isLongPressTriggered.current = true;
            setActionMenuOpenId(id);
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        }, 400); // 400ms for long press
    };

    useEcho('Tenant.' + (auth?.user as any)?.tenant_id, 'TagihanUpdated', () => {
        router.reload({ only: ['dataTagihan', 'availableMonths', 'selectedMonth'] });
    }, [auth?.user], 'private');

    const handleTouchEnd = () => {
        setIsPressingId(null);
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    setMobileVisibleCount(prev => prev + 20);
                }
            },
            { threshold: 0.1 }
        );
        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }
        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [observerTarget]);

    const availableAreas = useMemo(() => {
        const areas = new Map<number | string, string>();
        dataTagihan.forEach(t => {
            if (t.pelanggan?.area) {
                areas.set(t.pelanggan.area.id_area, t.pelanggan.area.nama_area);
            }
        });
        return Array.from(areas.entries()).map(([id, nama]) => ({ id, nama }));
    }, [dataTagihan]);

    const filteredTagihan = useMemo(() => {
        return dataTagihan.filter(t => {
            const matchSearch = (
                (t.pelanggan?.nama?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (String(t.id_tagihan).toLowerCase().includes(searchQuery.toLowerCase())) ||
                (t.bulan_tagihan?.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            
            const matchStatus = t.status_bayar !== 'Lunas';
            
            let matchArea = true;
            if (filterArea !== 'Semua') {
                matchArea = t.pelanggan?.area?.id_area === filterArea;
            }

            return matchSearch && matchStatus && matchArea;
        }).sort((a: any, b: any) => {
            const nameA = (a?.pelanggan?.nama || '').toLowerCase();
            const nameB = (b?.pelanggan?.nama || '').toLowerCase();
            return nameA < nameB ? -1 : (nameA > nameB ? 1 : 0);
        });
    }, [dataTagihan, searchQuery, filterArea]);

    const totalPages = Math.ceil(filteredTagihan.length / itemsPerPage);
    const paginatedTagihan = filteredTagihan.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const mobileVisibleTagihan = filteredTagihan.slice(0, mobileVisibleCount);

    const formatRupiah = (angka: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka).replace(/\u00A0/g, ' ').replace(/\u202f/g, ' ');
    };

    const formatPeriode = (periode: string) => {
        if (!periode) return '-';
        if (!isMounted) return periode;
        const parts = periode.split('-');
        if (parts.length >= 2) {
            const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
            return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        }
        return periode;
    };

    const totalTagihanCount = dataTagihan.length;
    const totalTagihanNominal = dataTagihan.reduce((sum, t) => sum + Number(t.total_tarif || 0), 0);

    const lunasCount = dataTagihan.filter(t => t.status_bayar?.toLowerCase() === 'lunas').length;
    const lunasNominal = dataTagihan.filter(t => t.status_bayar?.toLowerCase() === 'lunas').reduce((sum, t) => sum + Number(t.total_tarif || 0), 0);

    const belumLunasCount = dataTagihan.filter(t => t.status_bayar === 'Belum Bayar').length;
    const belumLunasNominal = dataTagihan.filter(t => t.status_bayar === 'Belum Bayar').reduce((sum, t) => sum + Number(t.total_tarif || 0), 0);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirmPayment = () => {
        if (!selectedTagihan || selectedTagihanIds.length === 0) return;
        setIsSubmitting(true);

        router.post(`/tagihan/${selectedTagihan.id_tagihan}/bayar`, {
            tagihan_ids: selectedTagihanIds,
            payment_method: paymentMethod,
            keterangan: catatan
        }, {
            onSuccess: () => {
                const selectedTagihanList = selectedTagihan?.pelanggan?.tagihan ? selectedTagihan.pelanggan.tagihan.filter((tg: any) => selectedTagihanIds.includes(tg.id_tagihan)) : [selectedTagihan];
                const totalPaid = selectedTagihanList.reduce((acc: number, tg: any) => acc + Number(tg.total_tarif || selectedTagihan?.total_tarif || 0), 0);
                const periodes = selectedTagihanList.map((tg: any) => formatPeriode(tg.bulan_tagihan)).join(', ');

                setIsPaymentModalOpen(false);
                setSuccessInvoiceInfo({
                    id_tagihan: selectedTagihan.id_tagihan,
                    invoice_number: selectedTagihan.nomor_tagihan || ('INV-' + selectedTagihan.id_tagihan),
                    pelanggan: selectedTagihan.pelanggan?.nama,
                    total: totalPaid,
                    metode: paymentMethod,
                    periode: periodes,
                    waktu: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                });

                // Set timeout to allow the previous modal to close properly before opening the new one
                setTimeout(() => {
                    setIsSuccessModalOpen(true);
                }, 300);

                // Reset modal state
                setCatatan('');
                setPaymentMethod('Cash');
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const isolasirCount = dataTagihan.filter(t => t.status_bayar === 'Isolasir').length;



    const printReceipt = (url: string) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);

        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 10000);
    };

    return (
        <>
            <Head title="Data Tagihan" />
            <div className="flex flex-1 flex-col gap-3 sm:gap-6 p-3 sm:p-4 lg:p-6">
                <div className="hidden sm:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="hidden sm:block">
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Data Tagihan & Invoice</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Kelola penagihan pelanggan, status pembayaran, dan invoice bulanan.</p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 w-full sm:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-auto justify-between sm:justify-start gap-2 bg-white dark:bg-neutral-950 shadow-none border-neutral-200 dark:border-neutral-800">
                                    <span className="flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4 text-neutral-500" />
                                        <span>{selectedMonth || 'Pilih Bulan'}</span>
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-neutral-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 border-sidebar-border/70 shadow-sm">
                                {availableMonths.map((month) => (
                                    <DropdownMenuItem
                                        key={month}
                                        onClick={() => router.get('/tagihan', { bulan: month }, { preserveState: true, preserveScroll: true })}
                                        className={`cursor-pointer ${selectedMonth === month ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : ''}`}
                                    >
                                        {month}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {/* Generate Button Removed (Automated via Middleware) */}
                    </div>
                </div>

                {/* Horizontal Monitoring KPI Cards (Dashboard Style) */}
                {!isPenagih && (
                    <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 snap-x snap-mandatory hide-scrollbar pb-2">
                        <Card className="shrink-0 w-[46vw] md:w-auto snap-center h-full justify-between relative overflow-hidden border border-blue-100 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-900/20 dark:to-neutral-900 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 cursor-default">
                            <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                                <Receipt className="w-16 h-16 sm:w-32 sm:h-32" />
                            </div>
                            <div className="relative z-10 flex justify-between items-start">
                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                    <span className="text-[10px] sm:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400 line-clamp-1">Total Tagihan</span>
                                    <span className="text-base sm:text-2xl font-bold truncate tracking-tight text-neutral-900 dark:text-white">{totalTagihanCount}</span>
                                </div>
                                <div className="p-1 sm:p-2 bg-blue-100/50 dark:bg-blue-900/50 rounded-lg">
                                    <Receipt className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                                <div className="w-fit flex items-center gap-1 font-medium text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 px-1.5 py-0.5 sm:px-2 rounded-md">
                                    <span>-</span>
                                </div>
                                <span className="text-neutral-500 dark:text-neutral-400 truncate" title={`Senilai ${formatRupiah(totalTagihanNominal)}`}>
                                    Senilai <span suppressHydrationWarning>{formatRupiah(totalTagihanNominal)}</span>
                                </span>
                            </div>
                        </Card>

                        <Card className="shrink-0 w-[46vw] md:w-auto snap-center h-full justify-between relative overflow-hidden border border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-900/20 dark:to-neutral-900 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 cursor-default">
                            <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                                <CheckCircle className="w-16 h-16 sm:w-32 sm:h-32" />
                            </div>
                            <div className="relative z-10 flex justify-between items-start">
                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                    <span className="text-[10px] sm:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400 line-clamp-1">Sudah Lunas</span>
                                    <span className="text-base sm:text-2xl font-bold truncate tracking-tight text-neutral-900 dark:text-white">{lunasCount}</span>
                                </div>
                                <div className="p-1 sm:p-2 bg-emerald-100/50 dark:bg-emerald-900/50 rounded-lg">
                                    <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                                <div className="w-fit flex items-center gap-1 font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-1.5 py-0.5 sm:px-2 rounded-md">
                                    <span>{totalTagihanCount > 0 ? Math.round((lunasCount / totalTagihanCount) * 100) : 0}%</span>
                                </div>
                                <span className="text-neutral-500 dark:text-neutral-400 truncate" title={`Terkumpul ${formatRupiah(lunasNominal)}`}>
                                    Terkumpul <span suppressHydrationWarning>{formatRupiah(lunasNominal)}</span>
                                </span>
                            </div>
                        </Card>

                        <Card className="shrink-0 w-[46vw] md:w-auto snap-center h-full justify-between relative overflow-hidden border border-amber-100 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/20 dark:to-neutral-900 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 cursor-default">
                            <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            </div>
                            <div className="relative z-10 flex justify-between items-start">
                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                    <span className="text-[10px] sm:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400 line-clamp-1">Belum Dibayar</span>
                                    <span className="text-base sm:text-2xl font-bold truncate tracking-tight text-neutral-900 dark:text-white">{belumLunasCount}</span>
                                </div>
                                <div className="p-1 sm:p-2 bg-amber-100/50 dark:bg-amber-900/50 rounded-lg">
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                                <div className="w-fit flex items-center gap-1 font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 px-1.5 py-0.5 sm:px-2 rounded-md">
                                    <span>{totalTagihanCount > 0 ? Math.round((belumLunasCount / totalTagihanCount) * 100) : 0}%</span>
                                </div>
                                <span className="text-neutral-500 dark:text-neutral-400 truncate" title={`Potensi ${formatRupiah(belumLunasNominal)}`}>
                                    Potensi {formatRupiah(belumLunasNominal)}
                                </span>
                            </div>
                        </Card>

                        <Card className="shrink-0 w-[46vw] md:w-auto snap-center h-full justify-between relative overflow-hidden border border-rose-100 dark:border-rose-900/30 bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-900/20 dark:to-neutral-900 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 cursor-default">
                            <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            </div>
                            <div className="relative z-10 flex justify-between items-start">
                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                    <span className="text-[10px] sm:text-sm font-medium line-clamp-1 leading-tight text-neutral-500 dark:text-neutral-400 line-clamp-1">Isolasir (Jatuh Tempo)</span>
                                    <span className="text-base sm:text-2xl font-bold truncate tracking-tight text-neutral-900 dark:text-white">{isolasirCount}</span>
                                </div>
                                <div className="p-1 sm:p-2 bg-rose-100/50 dark:bg-rose-900/50 rounded-lg">
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                                <div className="w-fit flex items-center gap-1 font-medium text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 px-1.5 py-0.5 sm:px-2 rounded-md">
                                    <span>{totalTagihanCount > 0 ? Math.round((isolasirCount / totalTagihanCount) * 100) : 0}%</span>
                                </div>
                                <span className="text-neutral-500 dark:text-neutral-400 truncate" title="Segera tindak lanjuti">
                                    Segera tindak lanjuti
                                </span>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Main Table Card */}
                <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-none overflow-hidden p-0 gap-0">
                    <div className="p-4 border-b border-sidebar-border/70 dark:border-sidebar-border bg-neutral-50/50 dark:bg-neutral-900/20 flex flex-col sm:flex-row sm:items-center sm:justify-start gap-4">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                type="search"
                                placeholder="Cari ID Invoice atau Pelanggan..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-white dark:bg-neutral-950 pl-9 border-neutral-200 dark:border-neutral-800 shadow-none focus-visible:ring-blue-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 w-full sm:w-auto">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 bg-white dark:bg-neutral-950">
                                        <MapPin className="w-4 h-4 mr-2 text-neutral-500" />
                                        {filterArea === 'Semua' ? 'Semua Area' : availableAreas.find(a => a.id === filterArea)?.nama}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-64 sm:w-72 border-sidebar-border/70 shadow-md max-h-64 overflow-y-auto">
                                    <DropdownMenuItem onClick={() => { setFilterArea('Semua'); setCurrentPage(1); }} className={`cursor-pointer transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${filterArea === 'Semua' ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : ""}`}>
                                        Semua Area
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {availableAreas.map(a => (
                                        <DropdownMenuItem
                                            key={a.id}
                                            onClick={() => { setFilterArea(a.id); setCurrentPage(1); }}
                                            className={`cursor-pointer transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${filterArea === a.id ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : ""}`}
                                        >
                                            {a.nama}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {(searchQuery !== '' || filterArea !== 'Semua') && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => {
                                        setSearchQuery('');
                                        setFilterArea('Semua');
                                        setCurrentPage(1);
                                    }}
                                    className="h-9 px-2.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 w-full sm:w-auto"
                                >
                                    <XCircle className="w-4 h-4 mr-2" /> Reset
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="hidden md:table w-full text-sm text-left">
                            <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-semibold">Invoice & Pelanggan</th>
                                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-semibold">Paket Layanan</th>
                                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-semibold">Periode/Bulan</th>
                                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-semibold">Nominal</th>
                                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-semibold">Status Pembayaran</th>
                                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-semibold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {filteredTagihan.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">
                                            Tidak ada data tagihan.
                                        </td>
                                    </tr>
                                )}
                                {paginatedTagihan.map((t) => (
                                    <tr key={t.id_tagihan} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded w-fit border border-blue-100 dark:border-blue-800/30 flex items-center gap-1.5">
                                                <FileText className="w-3 h-3" /> {t.nomor_tagihan || ('INV-' + t.id_tagihan)}
                                            </div>
                                            <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2 mt-1.5 text-[14px]">
                                                {t.pelanggan?.nama || '-'}
                                                {t.pelanggan?.tunggakan_count > 1 && t.status_bayar?.toUpperCase() !== 'LUNAS' && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                                                        Menunggak {t.pelanggan.tunggakan_count} Bulan
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{t.pelanggan?.paket?.paket_nama || '-'}</div>
                                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">{t.pelanggan?.paket?.kecepatan ? `${t.pelanggan.paket.kecepatan} Mbps` : ''}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                                                {t.bulan_tagihan}
                                            </span>
                                            <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
                                                Tgl Dibuat: {isMounted ? new Date(t.created_at).toLocaleDateString('id-ID') : ''}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                                {formatRupiah(t.total_tarif)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {t.status_bayar?.toUpperCase() === 'LUNAS' ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white dark:bg-emerald-500 shadow-sm">
                                                    LUNAS
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider bg-orange-500 text-white dark:bg-orange-600 shadow-sm">
                                                    {t.status_bayar?.toUpperCase() === 'BELUM BAYAR' ? 'BELUM LUNAS' : (t.status_bayar?.toUpperCase() || 'BELUM LUNAS')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 border-sidebar-border/70 shadow-md">
                                                    {t.status_bayar?.toUpperCase() !== 'LUNAS' && (canManage || isPenagih) && (
                                                        <DropdownMenuItem
                                                            className="cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950/50"
                                                            onClick={() => {
                                                                setSelectedTagihan(t);
                                                                const unpaidTags = t.pelanggan?.tagihan ? [...t.pelanggan.tagihan].filter((tg: any) => tg.status_bayar?.toUpperCase() !== 'LUNAS').sort((a: any, b: any) => getMonthValue(a.bulan_tagihan) - getMonthValue(b.bulan_tagihan)) : [];
                                                                const defaultTgId = unpaidTags.length > 0 ? unpaidTags[0].id_tagihan : t.id_tagihan;
                                                                setSelectedTagihanIds([defaultTgId]);
                                                                setCatatan('');
                                                                setPaymentMethod('Cash');
                                                                setIsPaymentModalOpen(true);
                                                            }}
                                                        >
                                                            <Banknote className="w-4 h-4 mr-2" /> Bayar Tagihan
                                                        </DropdownMenuItem>
                                                    )}

                                                    {t.pelanggan?.telepon && (
                                                        <DropdownMenuItem
                                                            className="cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950/50"
                                                            onClick={() => window.open(`https://wa.me/${t.pelanggan.telepon.replace(/^0/, '62')}`, '_blank')}
                                                        >
                                                            <Phone className="w-4 h-4 mr-2" /> Hubungi WA
                                                        </DropdownMenuItem>
                                                    )}

                                                    {t.status_bayar?.toUpperCase() === 'LUNAS' && (
                                                        <DropdownMenuItem
                                                            className="cursor-pointer"
                                                            onClick={() => {
                                                                toast.success(`Menyiapkan struk transaksi...`);
                                                                const iframe = document.createElement('iframe');
                                                                iframe.style.position = 'absolute';
                                                                iframe.style.width = '0';
                                                                iframe.style.height = '0';
                                                                iframe.style.border = 'none';
                                                                iframe.src = `/tagihan/${t.id_tagihan}/struk`;
                                                                document.body.appendChild(iframe);
                                                            }}
                                                        >
                                                            <Printer className="w-4 h-4 mr-2 text-neutral-500" /> Cetak Bukti
                                                        </DropdownMenuItem>
                                                    )}

                                                    <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />

                                                    <DropdownMenuItem
                                                        className="cursor-pointer text-rose-600 focus:text-rose-700 focus:bg-rose-50 dark:focus:bg-rose-950/50"
                                                        onClick={() => toast.success(`Pelanggan telah diisolir.`)}
                                                    >
                                                        <AlertTriangle className="w-4 h-4 mr-2" /> Isolir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="flex flex-col md:hidden border-t border-sidebar-border/70 bg-neutral-50 dark:bg-neutral-950 pb-4">
                        {filteredTagihan.length === 0 && (
                            <div className="p-8 text-center text-neutral-500 bg-white dark:bg-neutral-900 mt-2 mx-3 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                Tidak ada data tagihan ditemukan.
                            </div>
                        )}
                        {mobileVisibleTagihan.map((t: any) => (
                            <div key={t.id_tagihan}
                                className={`p-3 mx-3 my-2 rounded-sm shadow-sm border border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-900 select-none cursor-pointer relative transition-transform duration-200 ${actionMenuOpenId === null ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800/80 active:bg-neutral-100 dark:active:bg-neutral-800 active:scale-[0.98]' : ''}`}
                                onTouchStart={() => handleTouchStart(t.id_tagihan)}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchEnd}
                                onMouseDown={() => handleTouchStart(t.id_tagihan)}
                                onMouseUp={handleTouchEnd}
                                onMouseLeave={handleTouchEnd}
                                onContextMenu={(e) => { e.preventDefault(); }}
                                onClick={() => {
                                    if (isLongPressTriggered.current) {
                                        setTimeout(() => {
                                            isLongPressTriggered.current = false;
                                        }, 50);
                                        return;
                                    }
                                    if (t.status_bayar?.toUpperCase() !== 'LUNAS' && (canManage || isPenagih)) {
                                        setSelectedTagihan(t);
                                        const unpaidTags = t.pelanggan?.tagihan ? [...t.pelanggan.tagihan].filter((tg: any) => tg.status_bayar?.toUpperCase() !== 'LUNAS').sort((a: any, b: any) => getMonthValue(a.bulan_tagihan) - getMonthValue(b.bulan_tagihan)) : [];
                                        const defaultTgId = unpaidTags.length > 0 ? unpaidTags[0].id_tagihan : t.id_tagihan;
                                        setSelectedTagihanIds([defaultTgId]);
                                        setCatatan('');
                                        setPaymentMethod('Cash');
                                        setIsPaymentModalOpen(true);
                                    }
                                    setTimeout(() => {
                                        isLongPressTriggered.current = false;
                                    }, 50);
                                }}
                            >
                                <div className="flex items-start justify-between gap-2 w-full">
                                    <div className="flex flex-col min-w-0 flex-1 pr-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                                <span className="font-bold text-base text-neutral-900 dark:text-white leading-none">{t.pelanggan?.nama || '-'}</span>
                                                {t.status_bayar?.toUpperCase() === 'LUNAS' ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white dark:bg-emerald-500 shadow-sm shrink-0">
                                                        LUNAS
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-orange-500 text-white dark:bg-orange-600 shadow-sm shrink-0">
                                                        BELUM LUNAS
                                                    </span>
                                                )}
                                                {t.status_bayar?.toUpperCase() !== 'LUNAS' && t.pelanggan?.tunggakan_count > 1 && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 shrink-0">
                                                        {t.pelanggan.tunggakan_count} BLN
                                                    </span>
                                                )}
                                            </div>
                                            {t.status_bayar?.toUpperCase() === 'LUNAS' && (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">{t.pelanggan?.nomor_pelanggan || t.id_pelanggan}</span>
                                            <span className="text-[10px]">•</span>
                                            <span>{t.nomor_tagihan || ('INV-'+t.id_tagihan)}</span>
                                        </div>
                                        <div className="flex flex-col mt-1 min-w-0 w-full gap-0.5">
                                            <div className="text-[11px] text-neutral-500">
                                                {t.pelanggan?.telepon || '-'}
                                            </div>
                                            <div className="text-[11px] text-neutral-500 truncate">
                                                {t.pelanggan?.area?.nama_area || 'Umum'}
                                            </div>
                                            <div className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 line-clamp-2 leading-relaxed mt-0.5 pr-2">
                                                {t.pelanggan?.alamat || 'Alamat tidak tersedia'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end justify-between shrink-0 ml-auto h-full min-h-[90px]">
                                        <div className="flex flex-col items-end">
                                            <span className={`font-bold text-lg leading-none ${t.status_bayar?.toUpperCase() === 'LUNAS' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                {formatRupiah(t.total_tarif)}
                                            </span>
                                        </div>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 mt-auto uppercase tracking-wider">
                                            Jatuh Tempo: Tgl {t.pelanggan?.tanggal || '-'}
                                        </span>
                                    </div>
                                </div>
                                
                                {t.pelanggan?.telepon && (
                                    <Button variant="outline" size="sm" className="w-full text-xs h-8 bg-white dark:bg-neutral-950 mt-3" onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${t.pelanggan.telepon.replace(/^0/, '62')}`, '_blank'); }}>
                                        <Phone className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Hubungi WhatsApp
                                    </Button>
                                )}
                                {t.status_bayar?.toUpperCase() === 'LUNAS' && (
                                    <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
                                        <span>Dibayar: {t.pembayaran?.tgl_bayar && isMounted ? new Date(t.pembayaran.tgl_bayar).toLocaleDateString('id-ID') : '-'}</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold uppercase" style={{ fontSize: '8px' }}>
                                                {t.pembayaran?.user?.name ? t.pembayaran.user.name.charAt(0) : '?'}
                                            </div>
                                            <span>{t.pembayaran?.user?.name || '-'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Observer Target for Infinite Loading */}
                        <div ref={observerTarget} className="py-6 flex justify-center items-center">
                            {mobileVisibleCount < filteredTagihan.length && (
                                <Spinner className="w-6 h-6 text-neutral-400" />
                            )}
                        </div>
                    </div>

                    {/* Action Menu Bottom Modal (No Animation) */}
                    {actionMenuOpenId !== null && (
                        (() => {
                            const t = dataTagihan.find((item: any) => item.id_tagihan === actionMenuOpenId);
                            if (!t) return null;
                            return (
                                <div className="fixed inset-0 z-[100] flex flex-col justify-end">
                                    <div
                                        className="absolute inset-0 bg-black/40"
                                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setActionMenuOpenId(null); }}
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

                    <div className="hidden md:block">
                        <TablePagination
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            setItemsPerPage={setItemsPerPage}
                            totalItems={filteredTagihan.length}
                            paginatedLength={paginatedTagihan.length}
                            itemName="tagihan"
                        />
                    </div>
                </Card>
            </div>

            {/* Modal Pembayaran */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent
                    className="sm:max-w-md bg-white dark:bg-neutral-900 border-sidebar-border/70 p-0 overflow-hidden shadow-2xl"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader className="px-5 py-3.5 border-b border-sidebar-border/70 dark:border-sidebar-border bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 rounded-lg shrink-0 mt-0.5">
                                <Banknote className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col text-left">
                                <DialogTitle className="text-base font-bold text-neutral-800 dark:text-white">
                                    Pembayaran Tagihan
                                </DialogTitle>
                                <DialogDescription className="text-xs text-neutral-500 mt-0.5">
                                    Konfirmasi pembayaran untuk invoice <span className="font-semibold text-neutral-700 dark:text-neutral-300">{selectedTagihan?.nomor_tagihan || ('INV-' + selectedTagihan?.id_tagihan)}</span>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="px-5 pt-3.5 pb-5 space-y-4">
                        {/* Rincian Tagihan */}
                        <div className="bg-white dark:bg-neutral-950 rounded-lg p-3.5 border border-neutral-200 dark:border-neutral-800 space-y-2.5 shadow-sm">
                            <div className="flex justify-between text-xs gap-2">
                                <span className="text-neutral-500 shrink-0">Pelanggan</span>
                                <span className="font-semibold text-neutral-900 dark:text-white text-right">{selectedTagihan?.pelanggan?.nama}</span>
                            </div>
                            <div className="flex justify-between text-xs gap-2">
                                <span className="text-neutral-500 shrink-0">No. Telepon / WA</span>
                                <span className="font-medium text-neutral-700 dark:text-neutral-300 text-right">{selectedTagihan?.pelanggan?.telepon || '-'}</span>
                            </div>
                            <div className="flex justify-between items-start text-xs gap-4">
                                <span className="text-neutral-500 shrink-0">Alamat</span>
                                <span className="font-medium text-neutral-700 dark:text-neutral-300 text-right leading-relaxed text-balance">
                                    {selectedTagihan?.pelanggan?.alamat || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between items-start text-xs gap-4">
                                <span className="text-neutral-500 shrink-0">Area</span>
                                <span className="font-medium text-neutral-700 dark:text-neutral-300 text-right">
                                    {selectedTagihan?.pelanggan?.area?.nama_area || 'Umum'}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs gap-2">
                                <span className="text-neutral-500 shrink-0">Periode Tagihan</span>
                                <span className="font-medium text-neutral-700 dark:text-neutral-300 text-right">{selectedTagihan?.bulan_tagihan}</span>
                            </div>
                            <div className="flex justify-between text-xs gap-2">
                                <span className="text-neutral-500 shrink-0">Jatuh Tempo (Tgl)</span>
                                <span className="font-medium text-neutral-700 dark:text-neutral-300 text-right">{selectedTagihan?.pelanggan?.tanggal || '-'}</span>
                            </div>
                            <div className="flex justify-between items-start text-xs gap-4">
                                <span className="text-neutral-500 shrink-0">Paket Layanan</span>
                                <span className="font-medium text-neutral-700 dark:text-neutral-300 text-right">
                                    {selectedTagihan?.pelanggan?.paket?.paket_nama} {selectedTagihan?.pelanggan?.paket?.kecepatan ? `(${selectedTagihan?.pelanggan?.paket?.kecepatan} Mbps)` : ''}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs gap-2">
                                <span className="text-neutral-500 shrink-0">Akun PPPoE</span>
                                <span className="font-medium text-neutral-700 dark:text-neutral-300 text-right">{selectedTagihan?.pelanggan?.pppoe || '-'}</span>
                            </div>

                            {selectedTagihan?.pelanggan?.tagihan && selectedTagihan.pelanggan.tagihan.length > 1 && (
                                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 border-dashed mt-2">
                                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">Pilih Bulan Pembayaran:</span>
                                    <div className="flex flex-col gap-2">
                                        {[...selectedTagihan.pelanggan.tagihan].sort((a: any, b: any) => getMonthValue(a.bulan_tagihan) - getMonthValue(b.bulan_tagihan)).map((tg: any) => (
                                            <label key={tg.id_tagihan} className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-600 w-4 h-4 cursor-pointer"
                                                        checked={selectedTagihanIds.includes(tg.id_tagihan)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedTagihanIds(prev => [...prev, tg.id_tagihan]);
                                                            } else {
                                                                if (selectedTagihanIds.length > 1) {
                                                                    setSelectedTagihanIds(prev => prev.filter(id => id !== tg.id_tagihan));
                                                                } else {
                                                                    toast.error('Minimal satu tagihan harus dipilih');
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">{formatPeriode(tg.bulan_tagihan)}</span>
                                                </div>
                                                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 group-hover:text-emerald-600 transition-colors">{formatRupiah(tg.total_tarif || selectedTagihan.total_tarif)}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-2.5 mt-2.5 border-t border-neutral-200 dark:border-neutral-800 border-dashed flex justify-between items-center">
                                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Total Harus Dibayar</span>
                                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                                    {selectedTagihan ? (
                                        (() => {
                                            const selectedTagihanList = selectedTagihan?.pelanggan?.tagihan ? selectedTagihan.pelanggan.tagihan.filter((tg: any) => selectedTagihanIds.includes(tg.id_tagihan)) : [selectedTagihan];
                                            const totalAmount = selectedTagihanList.reduce((acc: number, tg: any) => acc + Number(tg.total_tarif || selectedTagihan?.total_tarif || 0), 0);
                                            return formatRupiah(totalAmount);
                                        })()
                                    ) : '-'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Metode Pembayaran</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div
                                    className={`border rounded-lg p-2.5 cursor-pointer flex flex-row items-center justify-center gap-2 transition-all ${paymentMethod === 'Cash' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/50' : 'border-neutral-200 dark:border-neutral-800 hover:border-emerald-200 dark:hover:border-emerald-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50'}`}
                                    onClick={() => setPaymentMethod('Cash')}
                                >
                                    <Banknote className={`w-4 h-4 ${paymentMethod === 'Cash' ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'}`} />
                                    <span className={`font-semibold text-xs ${paymentMethod === 'Cash' ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-600 dark:text-neutral-400'}`}>Tunai / Cash</span>
                                </div>
                                <div
                                    className={`border rounded-lg p-2.5 cursor-pointer flex flex-row items-center justify-center gap-2 transition-all ${paymentMethod === 'Transfer' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/50' : 'border-neutral-200 dark:border-neutral-800 hover:border-emerald-200 dark:hover:border-emerald-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50'}`}
                                    onClick={() => setPaymentMethod('Transfer')}
                                >
                                    <CreditCard className={`w-4 h-4 ${paymentMethod === 'Transfer' ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'}`} />
                                    <span className={`font-semibold text-xs ${paymentMethod === 'Transfer' ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-600 dark:text-neutral-400'}`}>Transfer Bank</span>
                                </div>
                            </div>
                        </div>

                        {paymentMethod === 'Transfer' && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Referensi / Nama Pengirim</label>
                                <Input
                                    type="text"
                                    placeholder="Contoh: Budi Santoso / BCA"
                                    value={catatan}
                                    onChange={(e) => setCatatan(e.target.value)}
                                    className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 h-8 text-xs"
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Catatan Tambahan (Opsional)</label>
                            <Input
                                type="text"
                                placeholder="Tulis catatan jika ada..."
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 h-8 text-xs"
                            />
                        </div>
                    </div>

                    <DialogFooter className="px-5 py-3.5 bg-neutral-50 dark:bg-neutral-900/50 border-t border-sidebar-border/70 dark:border-sidebar-border gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsPaymentModalOpen(false)} className="bg-white dark:bg-neutral-900 sm:w-auto text-xs">
                            Batal
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm sm:w-auto text-xs"
                            onClick={handleConfirmPayment}
                        >
                            {isSubmitting && <Spinner className="w-4 h-4 mr-1.5" />}
                            {!isSubmitting && <CheckCircle className="w-4 h-4 mr-1.5" />} {isSubmitting ? 'Memproses...' : 'Konfirmasi Lunas'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Sukses Pembayaran */}
            <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
                <DialogContent className="sm:max-w-[400px] bg-neutral-50 dark:bg-neutral-900 border-none p-0 text-center overflow-hidden rounded-2xl shadow-2xl">
                    <div className="bg-emerald-500 p-8 pb-12 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <pattern id="pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                                        <circle cx="2" cy="2" r="2" fill="currentColor" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#pattern)" />
                            </svg>
                        </div>
                        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center ring-4 ring-white/20 mb-4 relative z-10 shadow-lg animate-in zoom-in duration-300">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white relative z-10">Pembayaran Berhasil!</h2>
                    </div>

                    <div className="px-6 pb-6 pt-0 relative bg-neutral-50 dark:bg-neutral-900">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-[85%] bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-100 dark:border-neutral-700 p-4 z-20">
                            <div className="flex flex-col gap-1 text-center">
                                <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Total Pembayaran</span>
                                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(successInvoiceInfo?.total || 0)}
                                </span>
                            </div>
                        </div>

                        <div className="mt-16 space-y-3 mb-8 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-dashed border-neutral-200 dark:border-neutral-800">
                                <span className="text-neutral-500">No. Invoice</span>
                                <span className="font-semibold text-neutral-900 dark:text-white">{successInvoiceInfo?.invoice_number}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-dashed border-neutral-200 dark:border-neutral-800">
                                <span className="text-neutral-500">Nama Pelanggan</span>
                                <span className="font-semibold text-neutral-900 dark:text-white">{successInvoiceInfo?.pelanggan}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-dashed border-neutral-200 dark:border-neutral-800">
                                <span className="text-neutral-500">Periode Tagihan</span>
                                <span className="font-semibold text-neutral-900 dark:text-white">{successInvoiceInfo?.periode}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-dashed border-neutral-200 dark:border-neutral-800">
                                <span className="text-neutral-500">Metode Pembayaran</span>
                                <span className="font-semibold text-neutral-900 dark:text-white">{successInvoiceInfo?.metode}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-dashed border-neutral-200 dark:border-neutral-800">
                                <span className="text-neutral-500">Waktu Pembayaran</span>
                                <span className="font-semibold text-neutral-900 dark:text-white">{successInvoiceInfo?.waktu}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 relative z-20">
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" className="flex-1 bg-white dark:bg-neutral-900" onClick={() => {
                                    setIsSuccessModalOpen(false);
                                    toast.success(`Menyiapkan struk transaksi...`);
                                    const iframe = document.createElement('iframe');
                                    iframe.style.position = 'absolute';
                                    iframe.style.width = '0';
                                    iframe.style.height = '0';
                                    iframe.style.border = 'none';
                                    iframe.src = `/tagihan/${successInvoiceInfo?.id_tagihan}/struk`;
                                    document.body.appendChild(iframe);
                                }}>
                                    <Printer className="w-5 h-5 mr-2" /> Cetak Struk
                                </Button>

                                <Button type="button" variant="default" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={async () => {
                                    setIsSuccessModalOpen(false);
                                    toast.loading('Menyiapkan file PDF...', { id: 'pdf-loading' });
                                    try {
                                        const response = await fetch(`/tagihan/${successInvoiceInfo?.id_tagihan}/struk?download=1`);
                                        const blob = await response.blob();
                                        const file = new File([blob], `Invoice-${successInvoiceInfo?.invoice_number}.pdf`, { type: 'application/pdf' });

                                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                            toast.dismiss('pdf-loading');
                                            await navigator.share({
                                                files: [file],
                                                title: `Invoice ${successInvoiceInfo?.invoice_number}`,
                                                text: `Berikut adalah invoice pembayaran layanan internet Anda.`
                                            });
                                        } else {
                                            toast.error('Gagal membuka menu berbagi, perangkat tidak mendukung.', { id: 'pdf-loading' });
                                            // Fallback download if not supported
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = file.name;
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                        }
                                    } catch (e) {
                                        toast.error('Gagal membuat PDF', { id: 'pdf-loading' });
                                    }
                                }}>
                                    <Send className="w-5 h-5 mr-2" /> WhatsApp (PDF)
                                </Button>
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full h-12 rounded-xl text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 font-medium hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-colors"
                                onClick={() => setIsSuccessModalOpen(false)}
                            >
                                Tutup
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

Tagihan.layout = {
    breadcrumbs: [
        {
            title: 'Data Tagihan',
            href: '/tagihan',
        },
    ],
};
