import { useState, useMemo, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Search, Filter, Wallet, CalendarDays, CheckCircle2, Plus, Banknote, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { TablePagination } from '@/components/ui/table-pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

export default function RiwayatSetoran({ dataSetoran = [] }: { dataSetoran?: any[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [filterMonth, setFilterMonth] = useState('Semua');

    const { auth } = usePage().props;
    const isOwner = (auth as any)?.user?.role === 'OWNER' || (auth as any)?.user?.role === 'SUPERADMIN';
    const isPenagih = (auth as any)?.user?.role === 'PENAGIH';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nominalSetoran, setNominalSetoran] = useState('');
    const [keteranganSetoran, setKeteranganSetoran] = useState('');
    const [tglSetoran, setTglSetoran] = useState(() => {
        const today = new Date();
        const offset = today.getTimezoneOffset() * 60000;
        return new Date(today.getTime() - offset).toISOString().split('T')[0];
    });

    const [actionMenuOpenId, setActionMenuOpenId] = useState<number | null>(null);
    const [isPressingId, setIsPressingId] = useState<number | null>(null);
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressTriggered = useRef(false);
    const touchStartPos = useRef({ x: 0, y: 0 });

    const handleTouchStart = (e: React.TouchEvent, id: number) => {
        if (!isOwner) return;
        setIsPressingId(id);
        isLongPressTriggered.current = false;
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
        }
        touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        
        pressTimer.current = setTimeout(() => {
            isLongPressTriggered.current = true;
            setActionMenuOpenId(id);
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        }, 500);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!pressTimer.current) return;
        const deltaX = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
        if (deltaX > 10 || deltaY > 10) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
            setIsPressingId(null);
        }
    };

    const handleTouchEnd = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
        setIsPressingId(null);
    };

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedSetoranId, setSelectedSetoranId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleApprove = (id: number) => {
        router.post(`/riwayat-setoran/${id}/approve`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Setoran berhasil dikonfirmasi');
            }
        });
    };

    const handleDelete = (id: number) => {
        setSelectedSetoranId(id);
        setIsDeleteOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!selectedSetoranId) return;
        setIsDeleting(true);
        router.delete(`/riwayat-setoran/${selectedSetoranId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleting(false);
                setIsDeleteOpen(false);
                setSelectedSetoranId(null);
                toast.success('Setoran berhasil dihapus');
            },
            onError: () => {
                setIsDeleting(false);
                toast.error('Gagal menghapus setoran');
            }
        });
    };

    const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setNominalSetoran(value);
    };
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitSetoran = (e: any) => {
        e.preventDefault();
        if (!nominalSetoran || isNaN(Number(nominalSetoran)) || Number(nominalSetoran) <= 0) {
            toast.error('Nominal setoran tidak valid');
            return;
        }

        setIsSubmitting(true);
        router.post('/riwayat-setoran', {
            nominal: Number(nominalSetoran),
            keterangan: keteranganSetoran,
            tgl_setoran: tglSetoran
        }, {
            onSuccess: () => {
                setIsModalOpen(false);
                setNominalSetoran('');
                setKeteranganSetoran('');
                toast.success('Setoran berhasil dicatat');
            },
            onFinish: () => setIsSubmitting(false)
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

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        dataSetoran.forEach(s => {
            if (s.tgl_setoran) {
                const date = new Date(s.tgl_setoran);
                months.add(new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date));
            }
        });
        return ['Semua', ...Array.from(months)];
    }, [dataSetoran]);

    const filteredSetoran = dataSetoran.filter(s => {
        const penagihName = s.user?.nama || s.user?.name || '';
        const matchSearch = penagihName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (s.nominal && s.nominal.toString().includes(searchQuery));

        let matchMonth = true;
        if (filterMonth !== 'Semua') {
            const sMonth = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(s.tgl_setoran));
            matchMonth = sMonth === filterMonth;
        }

        return matchSearch && matchMonth;
    });

    const totalPages = Math.ceil(filteredSetoran.length / itemsPerPage);
    const paginatedSetoran = filteredSetoran.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const totalSetoranKeseluruhan = filteredSetoran.reduce((sum, s) => sum + Number(s.nominal || 0), 0);

    return (
        <>
            <Head title="Riwayat Setoran" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 lg:p-6">
                <div className="hidden sm:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Riwayat Setoran</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Data histori setoran kasir/penagih kepada owner.</p>
                    </div>
                    {isPenagih && (
                        <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                            <Plus className="w-4 h-4" />
                            Input Setoran
                        </Button>
                    )}
                </div>

                <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-none overflow-hidden p-0 gap-0">
                    <div className="p-4 border-b border-sidebar-border/70 dark:border-sidebar-border flex flex-col sm:flex-row items-center justify-start gap-4 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="relative w-full sm:max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                type="search"
                                placeholder="Cari penagih atau nominal..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-white dark:bg-neutral-950 pl-9 border-neutral-200 dark:border-neutral-800 shadow-sm transition-all focus-visible:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 bg-white dark:bg-neutral-950">
                                        <Filter className="w-4 h-4 mr-2 text-neutral-500" /> {filterMonth === 'Semua' ? 'Filter Bulan' : filterMonth}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 border-sidebar-border/70 shadow-md">
                                    {availableMonths.map(month => (
                                        <DropdownMenuItem
                                            key={month}
                                            onClick={() => { setFilterMonth(month); setCurrentPage(1); }}
                                            className={filterMonth === month ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : ""}
                                        >
                                            {month}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="hidden md:table w-full text-sm text-left">
                            <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-3.5 font-medium w-[15%] whitespace-nowrap">Tanggal</th>
                                    <th className="px-6 py-3.5 font-medium w-[20%] whitespace-nowrap">Nama Penagih</th>
                                    <th className="px-6 py-3.5 font-medium w-[20%] whitespace-nowrap">Keterangan</th>
                                    <th className="px-6 py-3.5 font-medium w-[15%] text-right whitespace-nowrap">Nominal</th>
                                    <th className="px-6 py-3.5 font-medium w-[10%] text-center whitespace-nowrap">Status</th>
                                    <th className="px-6 py-3.5 font-medium w-[10%] whitespace-nowrap">Penerima</th>
                                    {isOwner && <th className="px-6 py-3.5 font-medium w-[10%] text-center whitespace-nowrap">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {paginatedSetoran.length > 0 ? (
                                    paginatedSetoran.map((item, idx) => (
                                        <tr key={item.id_setoran || idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="w-4 h-4 text-neutral-400" />
                                                    <span className="font-medium text-neutral-900 dark:text-white whitespace-nowrap">
                                                        {formatDate(item.tgl_setoran)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-700 dark:text-neutral-300">
                                                {item.user?.nama || item.user?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400">
                                                <div className="line-clamp-2" title={item.keterangan || '-'}>
                                                    {item.keterangan || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                {formatRupiah(item.nominal)}
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <div className={`inline-flex items-center justify-center font-medium px-2.5 py-1 rounded-sm text-sm bg-transparent border ${item.status === 'pending' ? 'text-amber-600 dark:text-amber-500 border-amber-500/50' : 'text-emerald-600 dark:text-emerald-500 border-emerald-500/50'}`}>
                                                    {item.status === 'pending' ? 'Menunggu' : 'Diterima'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                                {item.admin?.nama || item.admin?.name || '-'}
                                            </td>
                                            {isOwner && (
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {item.status === 'pending' && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                onClick={() => handleApprove(item.id_setoran)} 
                                                                className="h-8 text-xs bg-white dark:bg-neutral-950 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-900/30"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Terima
                                                            </Button>
                                                        )}
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => handleDelete(item.id_setoran)} 
                                                            className="h-8 text-xs bg-white dark:bg-neutral-950 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/30"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus
                                                        </Button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-neutral-500 dark:text-neutral-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="h-12 w-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                                    <Wallet className="h-6 w-6 text-neutral-400" />
                                                </div>
                                                <p>Belum ada riwayat setoran.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="flex flex-col md:hidden border-t border-sidebar-border/70 bg-neutral-50 dark:bg-neutral-950 pb-4">
                        {filteredSetoran.length === 0 && (
                            <div className="p-8 text-center text-neutral-500 bg-white dark:bg-neutral-900 mt-2 mx-3 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                Tidak ada riwayat setoran ditemukan.
                            </div>
                        )}
                        {paginatedSetoran.map((item: any, idx: number) => (
                            <div key={item.id_setoran || idx}
                                className={`p-4 mx-3 my-2 rounded-xl shadow-sm border border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-900 select-none relative overflow-hidden flex flex-col transition-all duration-200 ${actionMenuOpenId === null && isOwner ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800/80 active:bg-neutral-100 dark:active:bg-neutral-800 active:scale-[0.98]' : ''} ${isPressingId === item.id_setoran ? 'scale-[0.98] bg-neutral-100 dark:bg-neutral-800' : ''}`}
                                onTouchStart={(e) => handleTouchStart(e, item.id_setoran)}
                                onTouchEnd={handleTouchEnd}
                                onTouchCancel={handleTouchEnd}
                                onTouchMove={handleTouchMove}
                                onContextMenu={(e) => { e.preventDefault(); }}
                            >
                                {/* Header: Icon, Name, Date, Status */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                                            item.status === 'pending' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                                        }`}>
                                            <Wallet className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-1 mb-0.5">
                                                {item.user?.nama || item.user?.name || '-'}
                                            </span>
                                            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                                                <CalendarDays className="w-3 h-3 text-neutral-400" />
                                                <span>{formatDate(item.tgl_setoran)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm border bg-transparent text-xs font-bold uppercase tracking-wider ${
                                            item.status === 'pending' ? 'border-amber-500/50 text-amber-600 dark:text-amber-400' : 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                                        }`}>
                                            {item.status === 'pending' ? 'Menunggu' : 'Diterima'}
                                        </span>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-2 mb-1">
                                    {/* Nominal */}
                                    <div className="flex flex-col p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Banknote className="w-3.5 h-3.5 text-neutral-400" />
                                            <span className="text-[10px] text-neutral-500">Nominal Setoran</span>
                                        </div>
                                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-1">
                                            {formatRupiah(item.nominal)}
                                        </span>
                                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                                            {item.status === 'pending' ? 'Belum Diterima' : 'Sudah Diterima'}
                                        </span>
                                    </div>
                                    {/* Keterangan & Admin */}
                                    <div className="flex flex-col p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
                                            <span className="text-[10px] text-neutral-500">Penerima</span>
                                        </div>
                                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-1">
                                            {item.admin?.nama || item.admin?.name || 'Sistem'}
                                        </span>
                                        <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1" title={item.keterangan || '-'}>
                                            {item.keterangan || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Mobile Action Menu (Bottom Sheet) */}
                        {actionMenuOpenId !== null && (
                            (() => {
                                const item = dataSetoran.find((s: any) => s.id_setoran === actionMenuOpenId);
                                if (!item) return null;
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
                                            <div className="px-5 pb-4 pt-1">
                                                <div className="flex items-center gap-3 mb-6 px-1">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shadow-inner">
                                                        <Wallet className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">Aksi Setoran</h3>
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.user?.nama || item.user?.name || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {isOwner && (
                                                        <>
                                                            {item.status === 'pending' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start h-12 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl font-semibold text-base transition-colors"
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        setActionMenuOpenId(null); 
                                                                        handleApprove(item.id_setoran); 
                                                                    }}
                                                                >
                                                                    <CheckCircle2 className="w-5 h-5 mr-3" /> Terima Setoran
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-start h-12 text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl font-semibold text-base transition-colors"
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    setActionMenuOpenId(null); 
                                                                    handleDelete(item.id_setoran); 
                                                                }}
                                                            >
                                                                <Trash2 className="w-5 h-5 mr-3" /> Hapus Setoran
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-center h-12 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl font-semibold text-base mt-2"
                                                        onClick={() => setActionMenuOpenId(null)}
                                                    >
                                                        Batal
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="p-4 border-t border-sidebar-border/70 dark:border-sidebar-border bg-neutral-50/50 dark:bg-neutral-900/20">
                            <TablePagination
                                currentPage={currentPage}
                                setCurrentPage={setCurrentPage}
                                itemsPerPage={itemsPerPage}
                                setItemsPerPage={setItemsPerPage}
                                totalItems={filteredSetoran.length}
                                paginatedLength={paginatedSetoran.length}
                                itemName="setoran"
                            />
                        </div>
                    )}
                </Card>
            </div>

            {isPenagih && (
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="md:hidden fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-transform active:scale-95"
                    aria-label="Input Setoran"
                >
                    <Plus className="w-6 h-6" />
                </button>
            )}

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
                                        Input Setoran Tunai
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Masukkan nominal setoran tunai Anda.
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
                                                value={nominalSetoran ? new Intl.NumberFormat('id-ID').format(parseInt(nominalSetoran)) : ''}
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
                                            value={tglSetoran}
                                            onChange={(e) => setTglSetoran(e.target.value)}
                                            className="block w-full bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <Label htmlFor="keterangan" className="text-neutral-700 dark:text-neutral-300">Keterangan (Opsional)</Label>
                                        <Input
                                            id="keterangan"
                                            type="text"
                                            value={keteranganSetoran}
                                            onChange={(e) => setKeteranganSetoran(e.target.value)}
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
                                disabled={isSubmitting || !nominalSetoran}
                                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                            >
                                {isSubmitting && <Spinner className="w-4 h-4 mr-2" />}
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Setoran'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="w-[95vw] max-h-[90vh] sm:max-w-sm rounded-xl border-sidebar-border/70">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> Hapus Setoran
                        </DialogTitle>
                        <DialogDescription className="mt-2">
                            Apakah Anda yakin ingin menghapus data setoran dari <strong>{dataSetoran.find((s: any) => s.id_setoran === selectedSetoranId)?.user?.nama || dataSetoran.find((s: any) => s.id_setoran === selectedSetoranId)?.user?.name}</strong> sebesar <strong>{selectedSetoranId ? formatRupiah(dataSetoran.find((s: any) => s.id_setoran === selectedSetoranId)?.nominal || 0) : ''}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 sm:justify-end gap-2">
                        <Button variant="outline" disabled={isDeleting} onClick={() => setIsDeleteOpen(false)}>Batal</Button>
                        <Button onClick={handleConfirmDelete} disabled={isDeleting} variant="destructive">
                            {isDeleting && <Spinner className="w-4 h-4 mr-2" />}
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

RiwayatSetoran.layout = {
    breadcrumbs: [
        {
            title: 'Riwayat Setoran',
            href: '/riwayat-setoran',
        },
    ],
};
