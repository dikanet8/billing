import { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { Search, Plus, MoreHorizontal, CheckCircle2, AlertTriangle, AlertCircle, Edit, Trash2, Ticket, MessageSquare, Wrench, CheckCircle, Clock, UserCog, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TablePagination } from '@/components/ui/table-pagination';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function Tiket({ dataTiket = [], dataPelanggan = [], dataTeknisi = [] }: { dataTiket?: any[], dataPelanggan?: any[], dataTeknisi?: any[] }) {
    const { auth } = usePage().props;
    const canManage = ['SUPERADMIN', 'OWNER'].includes((auth?.user as any)?.role);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    const [actionMenuOpenId, setActionMenuOpenId] = useState<number | null>(null);
    const [pressTimer, setPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [isLongPressTriggered, setIsLongPressTriggered] = useState(false);

    const [isFabVisible, setIsFabVisible] = useState(true);

    useEffect(() => {
        let lastScrollY = 0;

        const handleScroll = (e: any) => {
            const target = e.target;
            const currentScrollY = target === document ? window.scrollY : (target as HTMLElement).scrollTop;

            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsFabVisible(false);
            } else {
                setIsFabVisible(true);
            }

            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
        return () => window.removeEventListener('scroll', handleScroll, { capture: true } as any);
    }, []);

    // Modal states
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedTiket, setSelectedTiket] = useState<any>(null);
    const [formData, setFormData] = useState({
        id_pelanggan: '',
        judul: '',
        deskripsi: '',
        kategori: 'Layanan Lambat',
        prioritas: 'Sedang',
        status: 'Terbuka',
        ditugaskan_ke: ''
    });

    const handleTouchStart = (id: number) => {
        setIsLongPressTriggered(false);
        const timer = setTimeout(() => {
            setIsLongPressTriggered(true);
            setActionMenuOpenId(id);
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        }, 500);
        setPressTimer(timer);
    };

    const handleTouchEnd = () => {
        if (pressTimer) clearTimeout(pressTimer);
    };

    const filteredTiket = dataTiket.filter(t => 
        (t.pelanggan?.nama?.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (String(t.id_tiket).toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const paginatedTiket = filteredTiket.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const totalTiket = dataTiket.length;
    // Normalize status checks
    const tiketOpen = dataTiket.filter(t => ['OPEN', 'Terbuka'].includes(t.status)).length;
    const tiketProses = dataTiket.filter(t => ['PROSES', 'Diproses'].includes(t.status)).length;
    const tiketSelesai = dataTiket.filter(t => ['SELESAI', 'Selesai'].includes(t.status)).length;

    const handleOpenAdd = () => {
        setFormData({
            id_pelanggan: '',
            judul: '',
            deskripsi: '',
            kategori: 'Layanan Lambat',
            prioritas: 'Sedang',
            status: 'Terbuka',
            ditugaskan_ke: ''
        });
        setIsAddOpen(true);
    };

    const handleOpenEdit = (t: any) => {
        setSelectedTiket(t);
        setFormData({
            id_pelanggan: t.id_pelanggan?.toString() || '',
            judul: t.judul || '',
            deskripsi: t.deskripsi || '',
            kategori: t.kategori || 'Layanan Lambat',
            prioritas: t.prioritas || 'Sedang',
            status: t.status || 'Terbuka',
            ditugaskan_ke: t.ditugaskan_ke?.toString() || ''
        });
        setIsEditOpen(true);
    };

    const handleOpenDelete = (t: any) => {
        setSelectedTiket(t);
        setIsDeleteOpen(true);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSaveAdd = () => {
        setIsSubmitting(true);
        router.post('/tiket', formData as any, {
            onSuccess: () => setIsAddOpen(false),
            onFinish: () => setIsSubmitting(false)
        });
    };

    const handleSaveEdit = () => {
        if (!selectedTiket) return;
        setIsSubmitting(true);
        router.put(`/tiket/${selectedTiket.id_tiket}`, formData as any, {
            onSuccess: () => setIsEditOpen(false),
            onFinish: () => setIsSubmitting(false)
        });
    };

    const handleConfirmDelete = () => {
        if (!selectedTiket) return;
        setIsDeleting(true);
        router.delete(`/tiket/${selectedTiket.id_tiket}`, {
            onSuccess: () => setIsDeleteOpen(false),
            onFinish: () => setIsDeleting(false)
        });
    };

    const handleQuickAssign = (t: any) => {
        handleOpenEdit(t);
    };

    const handleMarkComplete = (t: any) => {
        router.put(`/tiket/${t.id_tiket}`, { ...t, status: 'Selesai' } as any, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Tiket Gangguan" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Tiket Gangguan (Helpdesk)</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Pantau laporan keluhan pelanggan dan tugaskan teknisi lapangan.</p>
                    </div>
                    {canManage && (
                        <div className="hidden md:flex items-center gap-2">
                            <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
                                <Plus className="w-4 h-4" /> Buat Tiket Baru
                            </Button>
                        </div>
                    )}
                </div>
                
                {/* Horizontal Monitoring KPI Cards (Dashboard Style) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="relative overflow-hidden border border-blue-100 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-900/20 dark:to-neutral-900 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 cursor-default">
                        <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            <Ticket className="w-16 h-16 sm:w-32 sm:h-32" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium leading-tight text-neutral-500 dark:text-neutral-400 line-clamp-1">Total Tiket</span>
                                <span className="text-base sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white truncate">{totalTiket}</span>
                            </div>
                            <div className="p-1 sm:p-2 bg-blue-100/50 dark:bg-blue-900/50 rounded-lg">
                                <Ticket className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <span className="text-neutral-500 dark:text-neutral-400 truncate">Semua laporan keluhan</span>
                        </div>
                    </Card>

                    <Card className="relative overflow-hidden border border-rose-100 dark:border-rose-900/30 bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-900/20 dark:to-neutral-900 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 cursor-default">
                        <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            <AlertCircle className="w-16 h-16 sm:w-32 sm:h-32" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium leading-tight text-neutral-500 dark:text-neutral-400 line-clamp-1">Menunggu (Open)</span>
                                <span className="text-base sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white truncate">{tiketOpen}</span>
                            </div>
                            <div className="p-1 sm:p-2 bg-rose-100/50 dark:bg-rose-900/50 rounded-lg">
                                <AlertCircle className="w-3 h-3 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <span className="text-neutral-500 dark:text-neutral-400 truncate">Perlu ditugaskan</span>
                        </div>
                    </Card>

                    <Card className="relative overflow-hidden border border-amber-100 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/20 dark:to-neutral-900 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 cursor-default">
                        <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            <Wrench className="w-16 h-16 sm:w-32 sm:h-32" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium leading-tight text-neutral-500 dark:text-neutral-400 line-clamp-1">Sedang Dikerjakan</span>
                                <span className="text-base sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white truncate">{tiketProses}</span>
                            </div>
                            <div className="p-1 sm:p-2 bg-amber-100/50 dark:bg-amber-900/50 rounded-lg">
                                <Wrench className="w-3 h-3 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <span className="text-neutral-500 dark:text-neutral-400 truncate">Teknisi meluncur</span>
                        </div>
                    </Card>

                    <Card className="relative overflow-hidden border border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-900/20 dark:to-neutral-900 rounded-xl shadow-none p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 cursor-default">
                        <div className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
                            <CheckCircle className="w-16 h-16 sm:w-32 sm:h-32" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[10px] sm:text-sm font-medium leading-tight text-neutral-500 dark:text-neutral-400 line-clamp-1">Diselesaikan</span>
                                <span className="text-base sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white truncate">{tiketSelesai}</span>
                            </div>
                            <div className="p-1 sm:p-2 bg-emerald-100/50 dark:bg-emerald-900/50 rounded-lg">
                                <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] sm:text-xs">
                            <span className="text-neutral-500 dark:text-neutral-400 truncate">Masalah teratasi</span>
                        </div>
                    </Card>
                </div>
                
                {/* Main Table Card */}
                <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-none overflow-hidden p-0 gap-0">
                    <div className="p-4 border-b border-sidebar-border/70 dark:border-sidebar-border flex flex-col sm:flex-row items-center justify-end gap-4 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="relative w-full sm:max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                type="search"
                                placeholder="Cari tiket, pelanggan, atau keluhan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-neutral-950 pl-9 border-neutral-200 dark:border-neutral-800 shadow-none transition-all focus-visible:ring-blue-500"
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="hidden md:table w-full text-sm text-left">
                            <thead className="text-[10px] sm:text-xs text-neutral-500 truncate dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-3.5 font-medium">Tiket & Waktu Lapor</th>
                                    <th className="px-6 py-3.5 font-medium">Data Pelanggan</th>
                                    <th className="px-6 py-3.5 font-medium max-w-xs">Detail Keluhan</th>
                                    <th className="px-6 py-3.5 font-medium">Status & Teknisi</th>
                                    {canManage && <th className="px-6 py-3.5 font-medium text-center">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {paginatedTiket.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                                            Tidak ada data tiket ditemukan.
                                        </td>
                                    </tr>
                                )}
                                {paginatedTiket.map((t) => (
                                    <tr key={t.id_tiket} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                                <Ticket className="w-4 h-4 text-neutral-400" /> TK-{t.id_tiket}
                                            </div>
                                            <div suppressHydrationWarning className="text-[10px] sm:text-xs text-neutral-500 truncate mt-1 pl-6 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(t.tgl_dibuat).toLocaleDateString('id-ID')}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-neutral-900 dark:text-neutral-200">
                                                {t.pelanggan?.nama || '-'}
                                            </div>
                                            <div className="text-[11px] text-neutral-500 mt-1">
                                                ID: {t.id_pelanggan}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="flex items-start gap-2">
                                                <MessageSquare className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                                                <p className="text-xs text-neutral-700 dark:text-neutral-300 line-clamp-2" title={t.deskripsi}>
                                                    <span className="font-semibold">{t.judul}</span> - {t.deskripsi}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 items-start">
                                                {['OPEN', 'Terbuka'].includes(t.status) && (
                                                    <span className="inline-flex items-center w-fit gap-1.5 text-[11px] uppercase tracking-wider bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-bold px-2 py-0.5 rounded">
                                                        <AlertCircle className="w-3.5 h-3.5" /> Menunggu
                                                    </span>
                                                )}
                                                {['PROSES', 'Diproses'].includes(t.status) && (
                                                    <span className="inline-flex items-center w-fit gap-1.5 text-[11px] uppercase tracking-wider bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded">
                                                        <Wrench className="w-3.5 h-3.5" /> Diproses
                                                    </span>
                                                )}
                                                {['SELESAI', 'Selesai'].includes(t.status) && (
                                                    <span className="inline-flex items-center w-fit gap-1.5 text-[11px] uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                                                    </span>
                                                )}
                                                
                                                <div className="text-[10px] text-neutral-500 font-medium flex items-center gap-1 mt-1">
                                                    <UserCog className="w-3 h-3" /> Teknisi: <span className={!t.teknisi ? 'text-rose-500 italic' : 'text-neutral-700 dark:text-neutral-300'}>{t.teknisi?.nama || t.teknisi?.name || '-'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        {canManage && (
                                            <td className="px-6 py-4 text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 border-sidebar-border/70 shadow-none">
                                                        <DropdownMenuItem onClick={() => handleQuickAssign(t)} className="cursor-pointer text-blue-600 focus:text-blue-700 focus:bg-blue-50 dark:focus:bg-blue-950/50">
                                                            <Send className="w-4 h-4 mr-2" /> Tugaskan Teknisi
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleOpenEdit(t)} className="cursor-pointer">
                                                            <Edit className="w-4 h-4 mr-2 text-neutral-500" /> Balas Pesan / Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleMarkComplete(t)} className="cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950/50">
                                                            <CheckCircle2 className="w-4 h-4 mr-2" /> Tandai Selesai
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleOpenDelete(t)} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
                                                            <Trash2 className="w-4 h-4 mr-2" /> Hapus Tiket
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="flex flex-col md:hidden divide-y divide-sidebar-border/70 dark:divide-sidebar-border border-t border-sidebar-border/70">
                        {paginatedTiket.length === 0 && (
                            <div className="p-8 text-center text-neutral-500">
                                Tidak ada data tiket ditemukan.
                            </div>
                        )}
                        {paginatedTiket.map((t: any) => (
                            <div key={t.id_tiket}
                                className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors bg-white dark:bg-neutral-900 select-none cursor-pointer relative"
                                onTouchStart={() => handleTouchStart(t.id_tiket)}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchEnd}
                                onMouseDown={() => handleTouchStart(t.id_tiket)}
                                onMouseUp={handleTouchEnd}
                                onMouseLeave={handleTouchEnd}
                                onContextMenu={(e) => { e.preventDefault(); }}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-900/20 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0 border border-slate-100 dark:border-slate-800/50">
                                            <Ticket className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm text-neutral-900 dark:text-white line-clamp-1">{t.pelanggan?.nama || 'Unknown'}</span>
                                            <div className="flex items-center mt-0.5 gap-2">
                                                <span className="text-[10px] text-neutral-500 font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded leading-none">TK-{t.id_tiket}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {canManage && (
                                    <DropdownMenu open={actionMenuOpenId === t.id_tiket} onOpenChange={(open) => {
                                        if (!open) setActionMenuOpenId(null);
                                    }}>
                                        <DropdownMenuTrigger asChild>
                                            <div className="w-1 h-1 opacity-0 pointer-events-none mx-auto my-auto"></div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 border-sidebar-border/70 shadow-none">
                                            <DropdownMenuItem onClick={() => handleQuickAssign(t)} className="cursor-pointer text-blue-600 focus:text-blue-700 focus:bg-blue-50 dark:focus:bg-blue-950/50">
                                                <Send className="w-4 h-4 mr-2" /> Tugaskan Teknisi
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenEdit(t)} className="cursor-pointer">
                                                <Edit className="w-4 h-4 mr-2 text-neutral-500" /> Balas Pesan / Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleMarkComplete(t)} className="cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950/50">
                                                <CheckCircle2 className="w-4 h-4 mr-2" /> Tandai Selesai
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenDelete(t)} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
                                                <Trash2 className="w-4 h-4 mr-2" /> Hapus Tiket
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    )}
                                </div>
                                
                                <div className="mt-3 flex flex-col gap-1 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                                    <span className="text-[10px] text-neutral-500 flex items-center gap-1.5"><MessageSquare className="w-3 h-3"/> Keluhan:</span>
                                    <span className="text-xs text-neutral-700 dark:text-neutral-300 line-clamp-3 leading-relaxed mt-0.5"><span className="font-medium">{t.judul}</span> - {t.deskripsi}</span>
                                </div>

                                <div className="mt-3 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-neutral-500">Status & Teknisi</span>
                                        <div className="flex items-center gap-1.5">
                                            {['OPEN', 'Terbuka'].includes(t.status) && (
                                                <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-600 border border-rose-200/60 shadow-sm">
                                                    <AlertCircle className="w-3 h-3" /> Menunggu
                                                </span>
                                            )}
                                            {['PROSES', 'Diproses'].includes(t.status) && (
                                                <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-600 border border-amber-200/60 shadow-sm">
                                                    <Wrench className="w-3 h-3" /> Diproses
                                                </span>
                                            )}
                                            {['SELESAI', 'Selesai'].includes(t.status) && (
                                                <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full text-[10px] bg-emerald-100/80 text-emerald-700 border border-emerald-200/60 shadow-sm">
                                                    <CheckCircle2 className="w-3 h-3" /> Selesai
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3 h-3 text-neutral-400" />
                                            <span suppressHydrationWarning className="text-[10px] text-neutral-500">{new Date(t.tgl_dibuat).toLocaleDateString('id-ID')}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center text-slate-600 text-[8px] font-bold uppercase">
                                                <UserCog className="w-3 h-3" />
                                            </div>
                                            <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-300">{t.teknisi?.nama || t.teknisi?.name || 'Belum ditugaskan'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <TablePagination 
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        setItemsPerPage={setItemsPerPage}
                        totalItems={filteredTiket.length}
                        paginatedLength={paginatedTiket.length}
                        itemName="tiket"
                    />
                </Card>
            </div>

            {canManage && (
                <Button
                    onClick={handleOpenAdd}
                    className={`md:hidden fixed right-6 z-50 w-14 h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.3)] bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all duration-300 p-0 ${isFabVisible ? 'bottom-20 scale-100' : '-bottom-20 scale-0'}`}
                >
                    <Plus className="w-6 h-6" />
                </Button>
            )}

            {/* Modal Tambah/Edit */}
            <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => {
                if (!open) { setIsAddOpen(false); setIsEditOpen(false); }
            }}>
                <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>{isEditOpen ? 'Edit Tiket Gangguan' : 'Buat Tiket Baru'}</DialogTitle>
                        <DialogDescription>
                            Isi detail keluhan pelanggan untuk diteruskan ke teknisi.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="id_pelanggan">Pelanggan</Label>
                            <select
                                id="id_pelanggan"
                                value={formData.id_pelanggan}
                                onChange={(e) => setFormData({ ...formData, id_pelanggan: e.target.value })}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-300"
                            >
                                <option value="" disabled>Pilih pelanggan</option>
                                {dataPelanggan?.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.nama} - {p.pppoe}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="judul">Judul Keluhan</Label>
                            <Input
                                id="judul"
                                placeholder="Misal: Internet mati total"
                                value={formData.judul}
                                onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="deskripsi">Detail Keluhan</Label>
                            <textarea
                                id="deskripsi"
                                rows={3}
                                placeholder="Jelaskan detail kendala..."
                                value={formData.deskripsi}
                                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                                className="flex w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-300"
                            ></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="kategori">Kategori</Label>
                                <select
                                    id="kategori"
                                    value={formData.kategori}
                                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-300"
                                >
                                    <option value="Layanan Lambat">Layanan Lambat</option>
                                    <option value="Koneksi Putus">Koneksi Putus</option>
                                    <option value="Modem Rusak">Modem Rusak</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="prioritas">Prioritas</Label>
                                <select
                                    id="prioritas"
                                    value={formData.prioritas}
                                    onChange={(e) => setFormData({ ...formData, prioritas: e.target.value })}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-300"
                                >
                                    <option value="Rendah">Rendah</option>
                                    <option value="Sedang">Sedang</option>
                                    <option value="Tinggi">Tinggi</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-300"
                                >
                                    <option value="Terbuka">Terbuka / Menunggu</option>
                                    <option value="Diproses">Diproses Teknisi</option>
                                    <option value="Selesai">Selesai</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="ditugaskan_ke">Teknisi</Label>
                                <select
                                    id="ditugaskan_ke"
                                    value={formData.ditugaskan_ke}
                                    onChange={(e) => setFormData({ ...formData, ditugaskan_ke: e.target.value })}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-300"
                                >
                                    <option value="">(Belum ditugaskan)</option>
                                    {dataTeknisi?.map((t: any) => (
                                        <option key={t.id} value={t.id}>{t.nama || t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>Batal</Button>
                        <Button onClick={isEditOpen ? handleSaveEdit : handleSaveAdd} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
                            {isSubmitting && <Spinner className="w-4 h-4 mr-2" />}
                            {isSubmitting ? 'Memproses...' : (isEditOpen ? 'Simpan Perubahan' : 'Simpan Tiket')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Delete */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Hapus Tiket</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus tiket laporan dari pelanggan <strong className="text-neutral-900 dark:text-white">{selectedTiket?.pelanggan?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                            {isDeleting && <Spinner className="w-4 h-4 mr-2" />}
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

Tiket.layout = {
    breadcrumbs: [
        {
            title: 'Tiket Gangguan',
            href: '/tiket',
        },
    ],
};
