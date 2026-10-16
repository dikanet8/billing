import { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { Search, Plus, MoreHorizontal, AlertCircle, Filter, Edit, Trash2, Handshake, Users, Receipt, Phone, MapPin, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TablePagination } from '@/components/ui/table-pagination';
import { Spinner } from '@/components/ui/spinner';

export default function MitraPage({ mitras: propMitras, areas }: { mitras?: any[], areas?: any[] }) {
    const { auth } = usePage().props;
    const canManage = ['SUPERADMIN', 'OWNER'].includes((auth?.user as any)?.role);

    const mitras = propMitras || [];
    const [searchQuery, setSearchQuery] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedMitra, setSelectedMitra] = useState<any>(null);
    const [selectedMobileMitra, setSelectedMobileMitra] = useState<any>(null);

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

    const [formData, setFormData] = useState({
        id_mitra: '',
        nama: '',
        telepon: '',
        alamat: '',
        keterangan: '',
        bandwidth: 0,
        harga: 0,
        status: 'aktif'
    });

    const handleOpenAdd = () => {
        setFormData({ id_mitra: '', nama: '', telepon: '', alamat: '', keterangan: '', bandwidth: 0, harga: 0, status: 'aktif' });
        setIsAddOpen(true);
    };

    const handleOpenEdit = (mitra: any) => {
        setSelectedMitra(mitra);
        setFormData({
            id_mitra: mitra.id_mitra,
            nama: mitra.nama || '',
            telepon: mitra.telepon || '',
            alamat: mitra.alamat || '',
            keterangan: mitra.keterangan || '',
            bandwidth: mitra.bandwidth || 0,
            harga: mitra.harga || 0,
            status: mitra.status || 'aktif'
        });
        setIsEditOpen(true);
    };

    const handleOpenDelete = (mitra: any) => {
        setSelectedMitra(mitra);
        setIsDeleteOpen(true);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSaveAdd = () => {
        if (!formData.nama) return;
        setIsSubmitting(true);
        router.post('/mitra', formData, {
            onSuccess: () => {
                toast.success('Mitra berhasil ditambahkan!');
                setIsAddOpen(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleSaveEdit = () => {
        if (!formData.nama) return;
        setIsSubmitting(true);
        router.put(`/mitra/${selectedMitra.id_mitra}`, formData, {
            onSuccess: () => {
                toast.success('Mitra berhasil diperbarui!');
                setIsEditOpen(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleGenerateInvoice = (mitra: any) => {
        if (!mitra.harga || mitra.harga <= 0) {
            toast.error('Tarif mitra masih 0, tidak dapat menerbitkan invoice.');
            return;
        }
        
        router.post(`/mitra/${mitra.id_mitra}/invoice`, {}, {
            onSuccess: () => {
                toast.success(`Invoice bulan ini berhasil diterbitkan untuk ${mitra.nama}!`);
                setActionMenuOpenId(null);
            },
            onError: (errors: any) => {
                if (errors.message) {
                    toast.error(errors.message);
                } else {
                    toast.error('Gagal menerbitkan invoice.');
                }
            }
        });
    };

    const handleConfirmDelete = () => {
        if (!selectedMitra) return;
        setIsDeleting(true);
        router.delete(`/mitra/${selectedMitra.id_mitra}`, {
            onSuccess: () => {
                toast.success('Mitra berhasil dihapus!');
                setIsDeleteOpen(false);
            },
            onFinish: () => {
                setIsDeleting(false);
            }
        });
    };

    const filteredMitras = mitras.filter(mitra =>
        (mitra.nama || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const [visibleMobileCount, setVisibleMobileCount] = useState(15);
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleMobileCount((prev) => prev + 15);
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
    }, [observerTarget.current, filteredMitras]);

    const paginatedMitras = filteredMitras.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const mobileMitras = filteredMitras.slice(0, visibleMobileCount);

    return (
        <>
            <Head title="Data Mitra" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 lg:p-6">
                <div className="hidden sm:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Data Mitra</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Kelola zona wilayah dan jangkauan jaringan internet.</p>
                    </div>
                    {canManage && (
                        <div className="flex items-center gap-2">
                            <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                                <Plus className="w-4 h-4 mr-2" /> Tambah Mitra
                            </Button>
                        </div>
                    )}
                </div>

                <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden p-0 gap-0">
                    <div className="p-4 border-b border-sidebar-border/70 dark:border-sidebar-border flex flex-col sm:flex-row items-center justify-end gap-4 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="relative w-full sm:max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                type="search"
                                placeholder="Cari ID atau nama mitra..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-neutral-950 pl-9 border-neutral-200 dark:border-neutral-800 shadow-sm transition-all focus-visible:ring-blue-500"
                            />
                        </div>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 bg-white dark:bg-neutral-950">
                            <Filter className="w-4 h-4 mr-2 text-neutral-500" /> Filter Mitra
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="hidden md:table w-full text-sm text-left">
                            <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-3.5 font-medium">Nama Mitra</th>
                                    <th className="px-6 py-3.5 font-medium">Kontak</th>
                                    <th className="px-6 py-3.5 font-medium text-center">Status</th>
                                    <th className="px-6 py-3.5 font-medium text-center">Bandwidth</th>
                                    <th className="px-6 py-3.5 font-medium text-right">Tarif</th>
                                    {canManage && <th className="px-6 py-3.5 font-medium text-center">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {paginatedMitras.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                                            Tidak ada data mitra ditemukan.
                                        </td>
                                    </tr>
                                )}
                                {paginatedMitras.map((mitra: any) => (
                                    <tr key={mitra.id_mitra} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                                {mitra.nama}
                                            </div>
                                            <div className="text-xs text-neutral-500 mt-1">{mitra.keterangan || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500">
                                            {mitra.telepon || '-'} <br/><span className="text-xs">{mitra.alamat || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {mitra.status === 'aktif' ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-transparent text-emerald-600 dark:text-emerald-400 border border-emerald-500/50">Aktif</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-transparent text-red-600 dark:text-red-400 border border-red-500/50">Nonaktif</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-medium">
                                            <span className="inline-flex items-center justify-center bg-transparent text-blue-600 dark:text-blue-400 font-semibold px-2 py-1 rounded-md text-xs border border-blue-500/50">
                                                {mitra.bandwidth} Mbps
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                            Rp {new Intl.NumberFormat('id-ID').format(mitra.harga || 0)}
                                        </td>

                                        {canManage && (
                                            <td className="px-6 py-4 text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 border-sidebar-border/70 shadow-md">
                                                        <DropdownMenuItem onClick={() => handleGenerateInvoice(mitra)} className="cursor-pointer">
                                                            <Receipt className="w-4 h-4 mr-2 text-blue-500" /> Terbitkan Invoice
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleOpenEdit(mitra)} className="cursor-pointer">
                                                            <Edit className="w-4 h-4 mr-2 text-neutral-500" /> Edit Mitra
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleOpenDelete(mitra)}
                                                            disabled={(mitra.unused_count ?? mitra.unused_count ?? 0) > 0}
                                                            className={(mitra.unused_count ?? mitra.unused_count ?? 0) > 0 ? "" : "cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" /> Hapus
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
                    <div className="flex flex-col md:hidden border-t border-sidebar-border/70 bg-white dark:bg-neutral-900 pb-0 divide-y divide-neutral-100 dark:divide-neutral-800">
                        {paginatedMitras.length === 0 && (
                            <div className="p-8 text-center text-neutral-500 bg-white dark:bg-neutral-900 mt-2 mx-3 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                Tidak ada data mitra ditemukan.
                            </div>
                        )}
                        {mobileMitras.map((mitra: any) => (
                            <div key={mitra.id_mitra}
                                className={`p-4 bg-white dark:bg-neutral-900 select-none cursor-pointer relative transition-colors ${actionMenuOpenId === null ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800/80 active:bg-neutral-50 dark:active:bg-neutral-800' : ''}`}
                                onTouchStart={() => handleTouchStart(mitra.id_mitra)}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchEnd}
                                onMouseDown={() => handleTouchStart(mitra.id_mitra)}
                                onMouseUp={handleTouchEnd}
                                onMouseLeave={handleTouchEnd}
                                onContextMenu={(e) => { e.preventDefault(); }}
                                onClick={(e) => {
                                    if (actionMenuOpenId !== null) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        return;
                                    }
                                    if (!isLongPressTriggered) {
                                        setSelectedMobileMitra(mitra);
                                    }
                                }}
                            >
                                <div className="flex flex-col w-full">
                                    <div className="flex items-start justify-between gap-2 w-full">
                                        <div className="flex flex-col min-w-0 flex-1 pr-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                                    <span className="font-bold text-base text-neutral-900 dark:text-white leading-tight truncate pb-0.5">{mitra.nama}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col mt-1 min-w-0 w-full gap-1">
                                                {mitra.keterangan && (
                                                    <div className="text-[11px] text-neutral-500 flex items-start gap-1.5 leading-snug">
                                                        <span className="line-clamp-2">{mitra.keterangan}</span>
                                                    </div>
                                                )}
                                                <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                                                    <Phone className="w-3 h-3 text-emerald-500" /> {mitra.telepon || 'Tanpa Kontak'}
                                                </div>
                                                {mitra.alamat && (
                                                    <div className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 leading-snug mt-0.5 pr-2 pb-1 flex items-start gap-1.5">
                                                        <MapPin className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" /> <span>{mitra.alamat}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end justify-start shrink-0 ml-auto h-full">
                                            <div className="flex flex-col items-end gap-1.5">
                                                {mitra.status === 'aktif' ? (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">AKTIF</span>
                                                ) : (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">NONAKTIF</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                                        <div className="flex items-center gap-1.5">
                                            <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                                <Activity className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-[12px] font-bold text-neutral-700 dark:text-neutral-300">
                                                {mitra.bandwidth} Mbps
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
                                                Rp {new Intl.NumberFormat('id-ID').format(mitra.harga || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Menu Bottom Modal */}
                                {actionMenuOpenId === mitra.id_mitra && canManage && (
                                    <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
                                        <div 
                                            className="absolute inset-0 bg-black/60"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActionMenuOpenId(null); }}
                                            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setActionMenuOpenId(null); }}
                                            onTouchStart={(e) => { e.stopPropagation(); }}
                                        />
                                        <div className="relative bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl border-t border-neutral-200/50 dark:border-neutral-800/50 pb-8 ring-1 ring-black/5 animate-in slide-in-from-bottom-full duration-200">
                                            <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto my-3" />
                                            <div className="px-6 py-2">
                                                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                                                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                                                        <Handshake className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-base text-neutral-900 dark:text-white">{mitra.nama}</h3>
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Mitra Operasional</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        className="w-full justify-start h-12 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl font-semibold text-base transition-colors"
                                                        onClick={(e) => { e.stopPropagation(); setActionMenuOpenId(null); handleGenerateInvoice(mitra); }}
                                                    >
                                                        <Receipt className="w-5 h-5 mr-3" /> Terbitkan Invoice
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        className="w-full justify-start h-12 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl font-medium text-base transition-colors"
                                                        onClick={(e) => { e.stopPropagation(); setActionMenuOpenId(null); handleOpenEdit(mitra); }}
                                                    >
                                                        <Edit className="w-5 h-5 mr-3" /> Edit Mitra
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        disabled={(mitra.unused_count ?? mitra.unused_count ?? 0) > 0}
                                                        className="w-full justify-start h-12 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl font-semibold text-base transition-colors disabled:opacity-50"
                                                        onClick={(e) => { e.stopPropagation(); setActionMenuOpenId(null); handleOpenDelete(mitra); }}
                                                    >
                                                        <Trash2 className="w-5 h-5 mr-3" /> Hapus Data
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={observerTarget} className="h-4 w-full" />
                    </div>

                    <div className="hidden md:block">
                        <TablePagination
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            setItemsPerPage={setItemsPerPage}
                            totalItems={filteredMitras.length}
                            paginatedLength={paginatedMitras.length}
                            itemName="mitra"
                        />
                    </div>
                </Card>
            </div>

            {/* Fast Custom Mobile Modal for Detail */}
            {selectedMobileMitra && (
                <div className="fixed inset-0 z-[9999] flex flex-col justify-end md:hidden">
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedMobileMitra(null); }}
                        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedMobileMitra(null); }}
                        onTouchStart={(e) => { e.stopPropagation(); }}
                    />
                    <div className="relative bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl border-t border-neutral-200/50 dark:border-neutral-800/50 pb-8 pt-2 ring-1 ring-black/5 animate-in slide-in-from-bottom-full duration-200">
                        <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto my-3" />

                        <div className="px-6 mb-4 mt-2 flex justify-between items-start gap-4">
                            <div className="flex flex-col min-w-0">
                                <h2 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight mb-1.5">{selectedMobileMitra.nama}</h2>
                                <div>
                                    {selectedMobileMitra.status === 'aktif' ? (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[11px] font-medium bg-transparent text-emerald-600 dark:text-emerald-400 border border-emerald-500/50">Aktif</span>
                                    ) : (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[11px] font-medium bg-transparent text-red-600 dark:text-red-400 border border-red-500/50">Nonaktif</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 flex flex-col overflow-y-auto max-h-[60vh]">
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border-y border-neutral-100 dark:border-neutral-800">
                                <div className="py-3 flex justify-between items-center">
                                    <span className="text-[13px] text-neutral-500">Tanggal Bergabung</span>
                                    <span className="text-[13px] font-medium text-neutral-900 dark:text-white">
                                        {selectedMobileMitra.created_at ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(selectedMobileMitra.created_at)) : '-'}
                                    </span>
                                </div>
                                <div className="py-3 flex justify-between items-center">
                                    <span className="text-[13px] text-neutral-500">Nomor Telepon</span>
                                    <span className="text-[13px] font-medium text-neutral-900 dark:text-white">{selectedMobileMitra.telepon || '-'}</span>
                                </div>
                                <div className="py-3 flex justify-between items-start gap-4">
                                    <span className="text-[13px] text-neutral-500 shrink-0">Alamat Lengkap</span>
                                    <span className="text-[13px] font-medium text-neutral-900 dark:text-white text-right break-words">{selectedMobileMitra.alamat || '-'}</span>
                                </div>
                                {selectedMobileMitra.keterangan && (
                                    <div className="py-3 flex justify-between items-start gap-4">
                                        <span className="text-[13px] text-neutral-500 shrink-0">Keterangan</span>
                                        <span className="text-[13px] font-medium text-neutral-900 dark:text-white text-right break-words">{selectedMobileMitra.keterangan}</span>
                                    </div>
                                )}
                                <div className="py-3 flex justify-between items-center">
                                    <span className="text-[13px] text-neutral-500">Bandwidth</span>
                                    <span className="text-[13px] font-medium text-neutral-900 dark:text-white">{selectedMobileMitra.bandwidth || 0} Mbps</span>
                                </div>
                                <div className="py-3 flex justify-between items-center">
                                    <span className="text-[13px] text-neutral-500">Tarif Bulanan</span>
                                    <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">Rp {new Intl.NumberFormat('id-ID').format(selectedMobileMitra.harga || 0)}</span>
                                </div>
                            </div>

                            {canManage && (
                                <div className="grid grid-cols-2 gap-3 shrink-0 mt-2">
                                    <Button
                                        variant="outline"
                                        className="col-span-2 w-full h-12 text-sm font-semibold rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-500/20"
                                        onClick={() => {
                                            setSelectedMobileMitra(null);
                                            handleGenerateInvoice(selectedMobileMitra);
                                        }}
                                    >
                                        Terbitkan Invoice
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 text-sm font-semibold rounded-xl bg-white dark:bg-neutral-950 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-900/30"
                                        onClick={() => {
                                            setSelectedMobileMitra(null);
                                            handleOpenDelete(selectedMobileMitra);
                                        }}
                                        disabled={(selectedMobileMitra.unused_count ?? selectedMobileMitra.unused_count ?? 0) > 0}
                                    >
                                        Hapus
                                    </Button>
                                    <Button
                                        className="w-full h-12 text-sm font-semibold rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100"
                                        onClick={() => {
                                            setSelectedMobileMitra(null);
                                            handleOpenEdit(selectedMobileMitra);
                                        }}
                                    >
                                        Edit Mitra
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsAddOpen(false);
                    setIsEditOpen(false);
                }
            }}>
                <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="w-[95vw] max-h-[90vh] sm:max-w-xl border-sidebar-border/70 p-0 overflow-hidden gap-0 bg-white dark:bg-neutral-950 rounded-xl">
                    <DialogHeader className="relative px-6 py-4 border-b border-sidebar-border/70 overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/20">

                        <div className="relative z-10 flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-blue-600 dark:text-blue-400 rounded-lg shadow-sm">
                                {!!formData.id_mitra ? <Edit className="w-4 h-4" /> : <Handshake className="w-4 h-4" />}
                            </div>
                            <div className="flex flex-col gap-0.5 text-left">
                                <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                    {!!formData.id_mitra ? 'Edit Data Mitra' : 'Tambah Mitra Baru'}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {!!formData.id_mitra
                                        ? 'Perbarui informasi dan status jangkauan mitra.'
                                        : 'Tambahkan mitra operasional baru ke dalam sistem.'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex flex-col px-6 py-6 gap-6">
                        {/* Section: Informasi Mitra */}
                        <div className="flex flex-col gap-4">

                            <div className="grid grid-cols-1 gap-5">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="nama" className="text-neutral-700 dark:text-neutral-300">Nama Mitra <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <Handshake className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <Input id="nama" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} placeholder="Nama Mitra / Reseller" className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="telepon" className="text-neutral-700 dark:text-neutral-300">Nomor Telepon</Label>
                                        <Input id="telepon" value={formData.telepon} onChange={e => setFormData({ ...formData, telepon: e.target.value })} placeholder="Contoh: 08123456789" className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="status" className="text-neutral-700 dark:text-neutral-300">Status</Label>
                                        <select id="status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="flex h-9 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:placeholder:text-neutral-400">
                                            <option value="aktif">Aktif</option>
                                            <option value="nonaktif">Tidak Aktif</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="bandwidth" className="text-neutral-700 dark:text-neutral-300">Bandwidth (Mbps)</Label>
                                        <Input 
                                            id="bandwidth" 
                                            type="text" 
                                            inputMode="numeric"
                                            value={formData.bandwidth || ''} 
                                            onChange={e => {
                                                const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                                const numValue = parseInt(rawValue, 10);
                                                setFormData({ ...formData, bandwidth: isNaN(numValue) ? 0 : numValue });
                                            }} 
                                            placeholder="Contoh: 100" 
                                            className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" 
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="harga" className="text-neutral-700 dark:text-neutral-300">Tarif (Rp)</Label>
                                        <Input 
                                            id="harga" 
                                            type="text" 
                                            inputMode="numeric"
                                            value={formData.harga ? new Intl.NumberFormat('id-ID').format(formData.harga) : ''} 
                                            onChange={e => {
                                                const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                                const numValue = parseInt(rawValue, 10);
                                                setFormData({ ...formData, harga: isNaN(numValue) ? 0 : numValue });
                                            }} 
                                            placeholder="Contoh: 150.000" 
                                            className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" 
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="alamat" className="text-neutral-700 dark:text-neutral-300">Alamat</Label>
                                    <Input id="alamat" value={formData.alamat} onChange={e => setFormData({ ...formData, alamat: e.target.value })} placeholder="Alamat Mitra" className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="keterangan" className="text-neutral-700 dark:text-neutral-300">Keterangan Tambahan</Label>
                                    <Input id="keterangan" value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} placeholder="Opsional: Keterangan tentang mitra" className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20 sm:justify-end">
                        <Button variant="outline" className="bg-white dark:bg-neutral-950" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>Batal</Button>
                        <Button onClick={!!formData.id_mitra ? handleSaveEdit : handleSaveAdd} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
                            {isSubmitting && <Spinner className="w-4 h-4 mr-2" />}
                            {isSubmitting ? 'Memproses...' : (!!formData.id_mitra ? 'Simpan Perubahan' : 'Simpan Mitra Baru')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="w-[95vw] sm:max-w-sm border-sidebar-border/70 rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> Hapus Mitra
                        </DialogTitle>
                        <DialogDescription className="mt-2">
                            Apakah Anda yakin ingin menghapus <strong>{selectedMitra?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 sm:justify-end gap-2">
                        <Button variant="outline" className="bg-white dark:bg-neutral-950" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
                        <Button onClick={handleConfirmDelete} disabled={isDeleting} variant="destructive">
                            {isDeleting && <Spinner className="w-4 h-4 mr-2" />}
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Mitra'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {canManage && (
                <Button
                    onClick={(e) => { e.currentTarget.blur(); handleOpenAdd(); }}
                    className={`md:hidden fixed right-6 z-50 w-14 h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.3)] bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 p-0 ${isFabVisible ? 'bottom-20 scale-100' : '-bottom-20 scale-0'}`}
                >
                    <Plus className="w-6 h-6" />
                </Button>
            )}
        </>
    );
}

MitraPage.layout = {
    breadcrumbs: [
        {
            title: 'Data Mitra',
            href: '/mitra',
        },
    ],
};
