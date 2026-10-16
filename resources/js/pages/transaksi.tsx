import { useState, useMemo, useEffect, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Search, Filter, CalendarDays, Wallet, CheckCircle2, AlertCircle, MoreHorizontal, MoreVertical, Printer, ExternalLink, Receipt, Package, MapPin, Send, XCircle, CreditCard, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ChevronDown, User as UserIcon } from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

const getTodayDateStr = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

export default function Transaksi({ dataTransaksi = [] }: { dataTransaksi?: any[] }) {
    const { auth } = usePage().props;
    const isPenagih = (auth?.user as any)?.role === 'PENAGIH';
    const isOwner = (auth?.user as any)?.role === 'OWNER' || (auth?.user as any)?.role === 'SUPERADMIN';
    
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedMobileTransaction, setSelectedMobileTransaction] = useState<any>(null);
    const [filterDate, setFilterDate] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('date') || '';
        }
        return '';
    });
    const [filterBulan, setFilterBulan] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('bulan') || '';
        }
        return '';
    });
    const [filterUser, setFilterUser] = useState<string | number>(() => {
        return isPenagih ? (auth?.user as any)?.id : 'Semua';
    });
    const [filterArea, setFilterArea] = useState<string | number>('Semua');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [mobileVisibleCount, setMobileVisibleCount] = useState(20);
    const observerTarget = useRef(null);
    
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
    }, []);

    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [transactionToCancel, setTransactionToCancel] = useState<any>(null);
    const [isCancelling, setIsCancelling] = useState(false);

    const handleCancelTransaction = () => {
        if (!transactionToCancel) return;
        setIsCancelling(true);
        toast.loading('Membatalkan transaksi...', { id: 'cancel-txn' });
        router.post(`/transaksi/${transactionToCancel.id_pembayaran}/batal`, {}, {
            onSuccess: () => {
                toast.success('Transaksi berhasil dibatalkan', { id: 'cancel-txn' });
                if (typeof router.clearHistory === 'function') {
                    router.clearHistory();
                }
                setCancelModalOpen(false);
                setTransactionToCancel(null);
                setSelectedMobileTransaction(null);
                setIsCancelling(false);
            },
            onError: () => {
                toast.error('Gagal membatalkan transaksi', { id: 'cancel-txn' });
                setIsCancelling(false);
            },
            onFinish: () => {
                setIsCancelling(false);
            }
        });
    };

    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number).replace(/\u00A0/g, ' ').replace(/\u202f/g, ' ');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const formatPeriode = (dateString?: string) => {
        if (!dateString) return '-';
        return dateString;
    };



    const availableUsers = useMemo(() => {
        const users = new Map<number, string>();
        dataTransaksi.forEach(t => {
            if (t.user) {
                users.set(t.user.id, t.user.nama || t.user.name || 'Unknown');
            }
        });
        return Array.from(users.entries()).map(([id, name]) => ({ id, name }));
    }, [dataTransaksi]);

    const availableAreas = useMemo(() => {
        const areas = new Map<number, string>();
        dataTransaksi.forEach(t => {
            if (t.pelanggan?.area) {
                areas.set(t.pelanggan.area.id_area, t.pelanggan.area.nama_area);
            }
        });
        return Array.from(areas.entries()).map(([id, nama]) => ({ id, nama }));
    }, [dataTransaksi]);

    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressTriggered = useRef(false);

    const handleTouchStart = (t: any) => {
        isLongPressTriggered.current = false;
        pressTimer.current = setTimeout(() => {
            isLongPressTriggered.current = true;
            if (isOwner) {
                setTransactionToCancel(t);
                setCancelModalOpen(true);
            }
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        }, 500);
    };

    const handleTouchEnd = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    const handleTouchMove = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    const filteredTransactions = useMemo(() => {
        return dataTransaksi.filter(t => {
            const matchSearch = t.pelanggan?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) || t.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase());

            let matchUser = true;
            if (filterUser !== 'Semua') {
                matchUser = t.user?.id === filterUser;
            }

            let matchArea = true;
            if (filterArea !== 'Semua') {
                matchArea = t.pelanggan?.area?.id_area === filterArea;
            }

            let matchDate = true;
            if (filterDate) {
                if (t.tgl_bayar) {
                    const tDate = new Date(t.tgl_bayar);
                    const yyyy = tDate.getFullYear();
                    const mm = String(tDate.getMonth() + 1).padStart(2, '0');
                    const dd = String(tDate.getDate()).padStart(2, '0');
                    const formattedDate = `${yyyy}-${mm}-${dd}`;
                    matchDate = formattedDate === filterDate;
                } else {
                    matchDate = false;
                }
            }

            let matchBulan = true;
            if (filterBulan) {
                matchBulan = t.tagihan?.bulan_tagihan === filterBulan;
            }

            return matchSearch && matchUser && matchArea && matchDate && matchBulan;
        }).sort((a: any, b: any) => {
            const dateA = a.tgl_bayar || '';
            const dateB = b.tgl_bayar || '';
            return dateB < dateA ? -1 : (dateB > dateA ? 1 : 0);
        });
    }, [dataTransaksi, searchQuery, filterUser, filterArea, filterDate, filterBulan]);

    const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const mobileVisibleTransactions = filteredTransactions.slice(0, mobileVisibleCount);

    return (
        <>
            <Head title="Riwayat Transaksi" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 lg:p-6">
                <div className="hidden sm:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Riwayat Transaksi</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Data riwayat pembayaran tagihan yang ter-generate otomatis oleh sistem.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="bg-white dark:bg-neutral-950">
                            <ExternalLink className="w-4 h-4 mr-2 text-neutral-500" /> Export CSV
                        </Button>
                    </div>
                </div>

                <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden p-0 gap-0">
                    <div className="p-4 border-b border-sidebar-border/70 dark:border-sidebar-border flex flex-col sm:flex-row items-center justify-end gap-4 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="relative w-full sm:max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                type="search"
                                placeholder="Cari ID transaksi atau nama..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-white dark:bg-neutral-950 pl-9 border-neutral-200 dark:border-neutral-800 shadow-sm transition-all focus-visible:ring-blue-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-auto h-9">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full h-full bg-white dark:bg-neutral-950 pointer-events-none flex items-center justify-center font-normal"
                                    suppressHydrationWarning
                                >
                                    <CalendarDays className="w-4 h-4 mr-2 text-neutral-500" />
                                    {filterDate ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(filterDate)) : 'Semua Tanggal'}
                                </Button>
                                <Input 
                                    type="date" 
                                    value={filterDate}
                                    onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
                                    onClick={(e) => {
                                        if ('showPicker' in HTMLInputElement.prototype) {
                                            (e.target as any).showPicker();
                                        }
                                    }}
                                    className="w-full h-full opacity-0 cursor-pointer absolute inset-0 z-10"
                                />
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full h-9 bg-white dark:bg-neutral-950">
                                        <UserIcon className="w-4 h-4 mr-2 text-neutral-500" />
                                        {filterUser === 'Semua' ? 'Semua User' : availableUsers.find(u => u.id === filterUser)?.name || 'User Penagih'}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 border-sidebar-border/70 shadow-md">
                                    <DropdownMenuItem onClick={() => { setFilterUser('Semua'); setCurrentPage(1); }} className={filterUser === 'Semua' ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : ""}>
                                        Semua User
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {availableUsers.map(u => (
                                        <DropdownMenuItem
                                            key={u.id}
                                            onClick={() => { setFilterUser(u.id); setCurrentPage(1); }}
                                            className={filterUser === u.id ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : ""}
                                        >
                                            {u.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="col-span-2 sm:col-span-1 w-full h-9 bg-white dark:bg-neutral-950">
                                        <MapPin className="w-4 h-4 mr-2 text-neutral-500" />
                                        {filterArea === 'Semua' ? 'Semua Area' : availableAreas.find(a => a.id === filterArea)?.nama}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 border-sidebar-border/70 shadow-md">
                                    <DropdownMenuItem onClick={() => { setFilterArea('Semua'); setCurrentPage(1); }} className={filterArea === 'Semua' ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : ""}>
                                        Semua Area
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {availableAreas.map(a => (
                                        <DropdownMenuItem
                                            key={a.id}
                                            onClick={() => { setFilterArea(a.id); setCurrentPage(1); }}
                                            className={filterArea === a.id ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : ""}
                                        >
                                            {a.nama}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {(searchQuery !== '' || filterDate !== '' || filterBulan !== '' || filterUser !== (isPenagih ? (auth?.user as any)?.id : 'Semua') || filterArea !== 'Semua') && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                        setSearchQuery('');
                                        setFilterDate('');
                                        setFilterBulan('');
                                        setFilterUser(isPenagih ? (auth?.user as any)?.id : 'Semua');
                                        setFilterArea('Semua');
                                        setCurrentPage(1);
                                        
                                        // Optional: clear URL params
                                        if (typeof window !== 'undefined') {
                                            const url = new URL(window.location.href);
                                            url.searchParams.delete('date');
                                            url.searchParams.delete('bulan');
                                            window.history.replaceState({}, '', url.toString());
                                        }
                                    }}
                                    className="h-9 w-full sm:w-auto px-2.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 col-span-2 sm:col-span-1"
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
                                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-semibold">ID Transaksi & Waktu</th>
                                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-semibold">Data Pelanggan</th>
                                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-semibold">Periode Tagihan</th>
                                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-semibold">Metode & Nominal</th>
                                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-semibold">Status Pembayaran</th>
                                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-semibold text-center">Kasir/Penagih</th>
                                    <th className="px-6 py-3 text-[11px] uppercase tracking-wider font-semibold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {filteredTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">
                                            Tidak ada transaksi ditemukan.
                                        </td>
                                    </tr>
                                )}
                                {paginatedTransactions.map((t, idx) => (
                                    <tr key={t.id_pembayaran || idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                                        <td className="px-6 py-4">
                                            {t.invoice_number ? (
                                                <div className="inline-flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800/60 px-2 py-1 rounded-md text-[10px] text-neutral-600 dark:text-neutral-400 font-medium border border-neutral-200/50 dark:border-neutral-700/50 mb-2">
                                                    <Receipt className="w-3 h-3" />
                                                    <span>{t.invoice_number}</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800/60 px-2 py-1 rounded-md text-[10px] text-neutral-600 dark:text-neutral-400 font-medium border border-neutral-200/50 dark:border-neutral-700/50 mb-2">
                                                    <Receipt className="w-3 h-3" />
                                                    <span>-</span>
                                                </div>
                                            )}
                                            <div className="text-[11px] text-neutral-500 flex items-center gap-1.5" suppressHydrationWarning>
                                                <CalendarDays className="w-3 h-3 text-neutral-400" /> <span>{formatDate(t.tgl_bayar)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-neutral-800 dark:text-neutral-200">{t.pelanggan?.nama || 'Unknown'}</div>
                                            <div className="text-[11px] text-neutral-500 mt-1">{t.pelanggan?.paket?.paket_nama || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {t.tagihan?.bulan_tagihan ? (
                                                <div className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md text-[10px] text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-100 dark:border-indigo-500/20">
                                                    <CalendarDays className="w-3 h-3" />
                                                    <span suppressHydrationWarning>{formatPeriode(t.tagihan.bulan_tagihan)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-neutral-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-neutral-800 dark:text-neutral-200" suppressHydrationWarning>
                                                {formatRupiah(t.jumlah_bayar)}
                                            </div>
                                            <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1.5">
                                                <Wallet className="w-3 h-3 text-neutral-400" /> {t.metode_bayar}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/50 bg-transparent">
                                                <span>Lunas</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800/60 px-2 py-1 rounded-md text-[10px] text-neutral-600 dark:text-neutral-400 font-medium border border-neutral-200/50 dark:border-neutral-700/50">
                                                <UserIcon className="w-3 h-3" />
                                                <span>{t.user ? (t.user.nama || t.user.name || 'Sistem') : 'Sistem'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 border-sidebar-border/70 shadow-md">
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
                                                    {isOwner && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-500/10"
                                                                onClick={() => {
                                                                    setTransactionToCancel(t);
                                                                    setCancelModalOpen(true);
                                                                }}
                                                            >
                                                                <AlertCircle className="w-4 h-4 mr-2" /> Batalkan Transaksi
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col md:hidden border-t border-sidebar-border/70 bg-neutral-50 dark:bg-neutral-950 pb-0">
                        {mobileVisibleTransactions.length === 0 && (
                            <div className="p-8 text-center text-neutral-500 bg-white dark:bg-neutral-900 mt-2 mx-3 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                Tidak ada data transaksi ditemukan.
                            </div>
                        )}
                        {mobileVisibleTransactions.map((t: any, idx: number) => (
                            <div key={t.id_pembayaran || idx}
                                className={`p-4 mx-3 my-2 rounded-md shadow-sm border border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-900 select-none cursor-pointer relative overflow-hidden transition-transform duration-200 ${selectedMobileTransaction === null ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800/80 active:bg-neutral-100 dark:active:bg-neutral-800 active:scale-[0.98]' : ''}`}
                                onTouchStart={() => handleTouchStart(t)}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                onMouseDown={() => handleTouchStart(t)}
                                onMouseUp={handleTouchEnd}
                                onMouseLeave={handleTouchEnd}
                                onClick={(e) => {
                                    if (isLongPressTriggered.current) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setTimeout(() => {
                                            isLongPressTriggered.current = false;
                                        }, 50);
                                        return;
                                    }
                                    if (selectedMobileTransaction !== null) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        return;
                                    }
                                    setSelectedMobileTransaction(t);
                                }}
                            >
                                <div className="flex items-start justify-between gap-2 w-full">
                                    <div className="flex flex-col min-w-0 flex-1 pr-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                                <span className="font-bold text-base text-neutral-900 dark:text-white leading-none">{t.pelanggan?.nama || 'Unknown'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">{t.pelanggan?.nomor_pelanggan || t.id_pelanggan || '-'}</span>
                                            <span className="text-[10px]">•</span>
                                            <span>{t.invoice_number || '-'}</span>
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
                                            <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-1" suppressHydrationWarning>
                                                <CalendarDays className="w-3 h-3 text-neutral-400" /> {formatDate(t.tgl_bayar)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end shrink-0 ml-auto h-full">
                                        <div className="flex flex-col items-end mb-1">
                                            <span className="font-bold text-lg leading-none text-emerald-600 dark:text-emerald-400" suppressHydrationWarning>
                                                {formatRupiah(t.jumlah_bayar)}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 mt-0">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 uppercase tracking-wider">
                                                {t.tagihan?.bulan_tagihan ? formatPeriode(t.tagihan.bulan_tagihan) : '-'}
                                            </span>
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase tracking-wider">
                                                <Wallet className="w-2.5 h-2.5 mr-1" /> {t.metode_bayar || '-'}
                                            </span>
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 uppercase tracking-wider mt-0.5">
                                                <UserIcon className="w-2.5 h-2.5 mr-1" /> {t.user ? (t.user.nama || t.user.name || 'Sistem') : 'Sistem'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        
                        <div ref={observerTarget} className="h-10 mt-4 md:hidden flex justify-center items-center">
                            {mobileVisibleTransactions.length < filteredTransactions.length && (
                                <Spinner className="w-5 h-5 text-neutral-400" />
                            )}
                        </div>
                    </div>

                    <div className="hidden md:block">
                        <TablePagination
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            setItemsPerPage={setItemsPerPage}
                            totalItems={filteredTransactions.length}
                            paginatedLength={paginatedTransactions.length}
                            itemName="transaksi"
                        />
                    </div>
                </Card>
            </div>

            {selectedMobileTransaction && (
                <div className="fixed inset-0 z-[9999] flex flex-col justify-end md:hidden">
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedMobileTransaction(null); }}
                        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedMobileTransaction(null); }}
                        onTouchStart={(e) => { e.stopPropagation(); }}
                    />
                    <div className="relative flex flex-col max-h-[85vh] bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl border-t border-neutral-200/50 dark:border-neutral-800/50 pb-8 pt-2 ring-1 ring-black/5 animate-in slide-in-from-bottom-full duration-200">
                        <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto my-3 shrink-0" />

                        <div className="px-6 mb-4 mt-2 shrink-0">
                            <h2 className="text-left text-xl font-bold text-neutral-900 dark:text-white">Detail Transaksi</h2>
                            <p className="text-left text-sm text-neutral-500 mt-1">{selectedMobileTransaction?.invoice_number}</p>
                        </div>

                        <div className="px-6 overflow-y-auto flex-1 pb-4 custom-scrollbar">
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-neutral-500">Pelanggan</span>
                                    <div className="text-right">
                                        <span className="text-sm font-semibold text-neutral-900 dark:text-white block">{selectedMobileTransaction.pelanggan?.nama}</span>
                                        <span className="text-xs text-neutral-500">{selectedMobileTransaction.pelanggan?.alamat || '-'}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-500">Waktu Bayar</span>
                                    <span className="text-sm font-medium text-neutral-900 dark:text-white" suppressHydrationWarning>{formatDate(selectedMobileTransaction.tgl_bayar)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-500">Layanan</span>
                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{selectedMobileTransaction.pelanggan?.paket?.paket_nama || 'Internet'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-500">Penerima (Kasir)</span>
                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{selectedMobileTransaction.user ? (selectedMobileTransaction.user.nama || selectedMobileTransaction.user.name || 'Sistem') : 'Sistem'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-500">Metode Pembayaran</span>
                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{selectedMobileTransaction.metode_bayar}</span>
                                </div>
                                <div className="border-t border-neutral-200 dark:border-neutral-700/50 pt-3 flex justify-between items-center mt-1">
                                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">Total</span>
                                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400" suppressHydrationWarning>{formatRupiah(selectedMobileTransaction.jumlah_bayar)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="px-6 pt-4 shrink-0 border-t border-neutral-100 dark:border-neutral-800/50">
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1 bg-white dark:bg-neutral-900 border-sidebar-border dark:border-sidebar-border" onClick={() => {
                                        toast.success(`Menyiapkan struk transaksi...`);
                                        const iframe = document.createElement('iframe');
                                        iframe.style.position = 'absolute';
                                        iframe.style.width = '0';
                                        iframe.style.height = '0';
                                        iframe.style.border = 'none';
                                        iframe.src = `/tagihan/${selectedMobileTransaction?.id_tagihan}/struk`;
                                        document.body.appendChild(iframe);
                                    }}>
                                        <Printer className="w-4 h-4 mr-2" /> Cetak Bukti
                                    </Button>
                                    <Button variant="default" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={async () => {
                                        toast.loading('Menyiapkan file PDF...', { id: 'pdf-loading' });
                                        try {
                                            const response = await fetch(`/tagihan/${selectedMobileTransaction?.tagihan?.id_tagihan ?? selectedMobileTransaction?.id_tagihan}/struk?download=1`);
                                            if (!response.ok) throw new Error('Gagal memuat PDF');
                                            const blob = await response.blob();
                                            const file = new File([blob], `Invoice-${selectedMobileTransaction?.invoice_number}.pdf`, { type: 'application/pdf' });
                                            
                                            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                                toast.dismiss('pdf-loading');
                                                await navigator.share({
                                                    files: [file],
                                                    title: `Invoice ${selectedMobileTransaction?.invoice_number}`,
                                                    text: `Berikut adalah invoice pembayaran layanan internet Anda.`
                                                });
                                            } else {
                                                toast.error('Gagal membuka menu berbagi, perangkat tidak mendukung.', { id: 'pdf-loading' });
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
                                        <Send className="w-4 h-4 mr-2" /> Kirim via WhatsApp
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-sm border-sidebar-border/70 rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> Batalkan Transaksi
                        </DialogTitle>
                        <DialogDescription className="mt-2">
                            Apakah Anda yakin ingin membatalkan transaksi pembayaran ini? 
                            Tindakan ini akan menghapus data pembayaran dan mengembalikan status tagihan pelanggan menjadi <strong>Belum Bayar</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    {transactionToCancel && (
                        <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-lg mt-2 mb-2 border border-red-100 dark:border-red-500/20">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-red-800 dark:text-red-400">Invoice:</span>
                                <span className="text-xs font-mono text-red-900 dark:text-red-300">{transactionToCancel.invoice_number}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-red-800 dark:text-red-400">Pelanggan:</span>
                                <span className="text-xs text-red-900 dark:text-red-300 line-clamp-1 text-right ml-2">{transactionToCancel.pelanggan?.nama}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-red-800 dark:text-red-400">Nominal:</span>
                                <span className="text-sm font-bold text-red-900 dark:text-red-300">{formatRupiah(transactionToCancel.jumlah_bayar)}</span>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="mt-4 sm:justify-end gap-2">
                        <Button variant="outline" className="bg-white dark:bg-neutral-950" onClick={() => setCancelModalOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleCancelTransaction} disabled={isCancelling} variant="destructive">
                            {isCancelling && <Spinner className="w-4 h-4 mr-2" />}
                            {isCancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

Transaksi.layout = {
    breadcrumbs: [
        {
            title: 'Transaksi',
            href: '/transaksi',
        },
    ],
};
