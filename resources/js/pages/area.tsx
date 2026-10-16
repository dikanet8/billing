import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { Search, Plus, MoreHorizontal, AlertCircle, Filter, Edit, Trash2, Map, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TablePagination } from '@/components/ui/table-pagination';
import { Spinner } from '@/components/ui/spinner';

export default function AreaPage({ dataArea }: { dataArea?: any[] }) {
    const { auth } = usePage().props;
    const canManage = ['SUPERADMIN', 'OWNER'].includes((auth?.user as any)?.role);

    const areas = dataArea || [];
    const [searchQuery, setSearchQuery] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedArea, setSelectedArea] = useState<any>(null);
    const [selectedMobileArea, setSelectedMobileArea] = useState<any>(null);

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
        id_area: '',
        nama_area: '',
        deskripsi: ''
    });

    const handleOpenAdd = () => {
        setFormData({ id_area: '', nama_area: '', deskripsi: '' });
        setIsAddOpen(true);
    };

    const handleOpenEdit = (area: any) => {
        setSelectedArea(area);
        setFormData({
            id_area: area.id_area,
            nama_area: area.nama_area,
            deskripsi: area.deskripsi || ''
        });
        setIsEditOpen(true);
    };

    const handleOpenDelete = (area: any) => {
        setSelectedArea(area);
        setIsDeleteOpen(true);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSaveAdd = () => {
        if (!formData.nama_area) return;
        setIsSubmitting(true);
        router.post('/area', formData, {
            onSuccess: () => {
                toast.success('Area berhasil ditambahkan!');
                setIsAddOpen(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleSaveEdit = () => {
        if (!formData.nama_area) return;
        setIsSubmitting(true);
        router.put(`/area/${selectedArea.id_area}`, formData, {
            onSuccess: () => {
                toast.success('Area berhasil diperbarui!');
                setIsEditOpen(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleConfirmDelete = () => {
        if (!selectedArea) return;
        setIsDeleting(true);
        router.delete(`/area/${selectedArea.id_area}`, {
            onSuccess: () => {
                toast.success('Area berhasil dihapus!');
                setIsDeleteOpen(false);
            },
            onFinish: () => {
                setIsDeleting(false);
            }
        });
    };

    const filteredAreas = areas.filter(area =>
        (area.nama_area || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const paginatedAreas = filteredAreas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <>
            <Head title="Data Area" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 lg:p-6">
                <div className="hidden sm:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Data Area</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Kelola zona wilayah dan jangkauan jaringan internet.</p>
                    </div>
                    {canManage && (
                        <div className="flex items-center gap-2">
                            <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                                <Plus className="w-4 h-4 mr-2" /> Tambah Area
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
                                placeholder="Cari ID atau nama area..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-neutral-950 pl-9 border-neutral-200 dark:border-neutral-800 shadow-sm transition-all focus-visible:ring-blue-500"
                            />
                        </div>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 bg-white dark:bg-neutral-950">
                            <Filter className="w-4 h-4 mr-2 text-neutral-500" /> Filter Area
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="hidden md:table w-full text-sm text-left">
                            <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-3.5 font-medium">Nama Area</th>
                                    <th className="px-6 py-3.5 font-medium">Deskripsi</th>
                                    <th className="px-6 py-3.5 font-medium text-center">Jml. Pelanggan</th>
                                    {canManage && <th className="px-6 py-3.5 font-medium text-center">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {paginatedAreas.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                                            Tidak ada data area ditemukan.
                                        </td>
                                    </tr>
                                )}
                                {paginatedAreas.map((area: any) => (
                                    <tr key={area.id_area} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{area.nama_area}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500">
                                            {area.deskripsi || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center bg-transparent text-blue-600 dark:text-blue-400 font-semibold px-2 py-1 rounded-md text-xs border border-blue-500/50">
                                                <Users className="w-3.5 h-3.5 mr-1" /> {area.pelanggan_count ?? area.pelangganCount ?? '-'}
                                            </span>
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
                                                        <DropdownMenuItem onClick={() => handleOpenEdit(area)} className="cursor-pointer">
                                                            <Edit className="w-4 h-4 mr-2 text-neutral-500" /> Edit Area
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleOpenDelete(area)}
                                                            disabled={(area.pelanggan_count ?? area.pelangganCount ?? 0) > 0}
                                                            className={(area.pelanggan_count ?? area.pelangganCount ?? 0) > 0 ? "" : "cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"}
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
                    <div className="flex flex-col md:hidden border-t border-sidebar-border/70 bg-neutral-50 dark:bg-neutral-950 pb-0">
                        {paginatedAreas.length === 0 && (
                            <div className="p-8 text-center text-neutral-500 bg-white dark:bg-neutral-900 mt-2 mx-3 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                Tidak ada data area ditemukan.
                            </div>
                        )}
                        {paginatedAreas.map((area: any) => (
                            <div key={area.id_area}
                                className={`p-3.5 mx-3 my-2 rounded-2xl bg-white dark:bg-neutral-900 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-neutral-100/80 dark:border-neutral-800/60 select-none cursor-pointer relative transition-all duration-200 ${actionMenuOpenId === null ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800/80 active:bg-neutral-50 dark:active:bg-neutral-800 active:scale-[0.98]' : ''}`}
                                onTouchStart={() => handleTouchStart(area.id_area)}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchEnd}
                                onMouseDown={() => handleTouchStart(area.id_area)}
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
                                        setSelectedMobileArea(area);
                                    }
                                }}
                            >
                                <div className="flex items-center gap-3.5 w-full py-1">
                                    <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
                                        <Map className="w-5 h-5" />
                                    </div>
                                    
                                    <div className="flex flex-col flex-1 min-w-0 justify-center">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="font-semibold text-[15px] text-neutral-900 dark:text-white truncate pr-3">{area.nama_area}</span>
                                            <span className="inline-flex items-center text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-transparent border border-blue-500/50 px-2 py-1 rounded-md whitespace-nowrap">
                                                <Users className="w-3 h-3 mr-1" />
                                                {area.pelanggan_count ?? area.pelangganCount ?? 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Menu Bottom Modal */}
                                {actionMenuOpenId === area.id_area && canManage && (
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
                                                        <Map className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-base text-neutral-900 dark:text-white">{area.nama_area}</h3>
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Area Operasional</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        className="w-full justify-start h-12 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl font-semibold text-base transition-colors"
                                                        onClick={(e) => { e.stopPropagation(); setActionMenuOpenId(null); handleOpenEdit(area); }}
                                                    >
                                                        <Edit className="w-5 h-5 mr-3" /> Edit Area
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        disabled={(area.pelanggan_count ?? area.pelangganCount ?? 0) > 0}
                                                        className="w-full justify-start h-12 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl font-semibold text-base transition-colors disabled:opacity-50"
                                                        onClick={(e) => { e.stopPropagation(); setActionMenuOpenId(null); handleOpenDelete(area); }}
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
                    </div>

                    <TablePagination
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        setItemsPerPage={setItemsPerPage}
                        totalItems={filteredAreas.length}
                        paginatedLength={paginatedAreas.length}
                        itemName="area"
                    />
                </Card>
            </div>

            {/* Fast Custom Mobile Modal for Detail */}
            {selectedMobileArea && (
                <div className="fixed inset-0 z-[9999] flex flex-col justify-end md:hidden">
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedMobileArea(null); }}
                        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedMobileArea(null); }}
                        onTouchStart={(e) => { e.stopPropagation(); }}
                    />
                    <div className="relative bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl border-t border-neutral-200/50 dark:border-neutral-800/50 pb-8 pt-2 ring-1 ring-black/5 animate-in slide-in-from-bottom-full duration-200">
                        <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto my-3" />

                        <div className="px-6 mb-6 mt-2">
                            <h2 className="text-left text-xl font-bold text-neutral-900 dark:text-white">Detail Area</h2>
                        </div>

                        <div className="px-6 flex flex-col gap-5 overflow-hidden">
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex flex-col gap-4 shrink-0">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm text-neutral-500">Nama Area</span>
                                    <div className="text-right">
                                        <span className="text-sm font-semibold text-neutral-900 dark:text-white block">{selectedMobileArea.nama_area}</span>
                                    </div>
                                </div>
                                <div className="border-t border-neutral-200 dark:border-neutral-700/50 pt-3 flex justify-between items-center mt-1">
                                    <span className="text-sm text-neutral-500">Total Pelanggan</span>
                                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{selectedMobileArea.pelanggan_count ?? selectedMobileArea.pelangganCount ?? 0}</span>
                                </div>
                            </div>
                            
                            {/* List Pelanggan */}
                            {(selectedMobileArea.pelanggan && selectedMobileArea.pelanggan.length > 0) && (
                                <div className="flex flex-col gap-3 overflow-y-auto max-h-[30vh] pr-1 pb-2">
                                    <span className="text-sm font-bold text-neutral-900 dark:text-white mb-1">Daftar Pelanggan:</span>
                                    {selectedMobileArea.pelanggan.map((p: any) => (
                                        <div key={p.id} className="flex items-center justify-between p-3 bg-neutral-50/80 dark:bg-neutral-800/80 rounded-xl border border-neutral-100 dark:border-neutral-700/50">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-semibold text-neutral-900 dark:text-white">{p.nama}</span>
                                                <span className="text-[10px] font-mono text-neutral-500">{p.nomor_pelanggan || p.id}</span>
                                            </div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${p.status?.toUpperCase() === 'AKTIF' ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : p.status?.toUpperCase() === 'ISOLIR' ? 'bg-rose-100/80 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-amber-100/80 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                                                {p.status || 'PENDING'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {canManage && (
                                <div className="flex gap-3 shrink-0 mt-2">
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 text-sm font-semibold rounded-xl bg-white dark:bg-neutral-950 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-900/30"
                                        onClick={() => {
                                            setSelectedMobileArea(null);
                                            handleOpenDelete(selectedMobileArea);
                                        }}
                                        disabled={(selectedMobileArea.pelanggan_count ?? selectedMobileArea.pelangganCount ?? 0) > 0}
                                    >
                                        Hapus
                                    </Button>
                                    <Button
                                        className="w-full h-12 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => {
                                            setSelectedMobileArea(null);
                                            handleOpenEdit(selectedMobileArea);
                                        }}
                                    >
                                        Edit Area
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
                                {!!formData.id_area ? <Edit className="w-4 h-4" /> : <Map className="w-4 h-4" />}
                            </div>
                            <div className="flex flex-col gap-0.5 text-left">
                                <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                    {!!formData.id_area ? 'Edit Data Area' : 'Tambah Area Baru'}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {!!formData.id_area
                                        ? 'Perbarui informasi dan status jangkauan area.'
                                        : 'Tambahkan area operasional baru ke dalam sistem.'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex flex-col px-6 py-6 gap-6">
                        {/* Section: Informasi Area */}
                        <div className="flex flex-col gap-4">

                            <div className="grid grid-cols-1 gap-5">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="nama_area" className="text-neutral-700 dark:text-neutral-300">Nama Area <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <Map className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <Input id="nama_area" value={formData.nama_area} onChange={e => setFormData({ ...formData, nama_area: e.target.value })} placeholder="Cth: Area Barat" className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="deskripsi" className="text-neutral-700 dark:text-neutral-300">Deskripsi</Label>
                                    <Input id="deskripsi" value={formData.deskripsi} onChange={e => setFormData({ ...formData, deskripsi: e.target.value })} placeholder="Opsional: Keterangan tentang area" className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20 sm:justify-end">
                        <Button variant="outline" className="bg-white dark:bg-neutral-950" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>Batal</Button>
                        <Button onClick={!!formData.id_area ? handleSaveEdit : handleSaveAdd} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
                            {isSubmitting && <Spinner className="w-4 h-4 mr-2" />}
                            {isSubmitting ? 'Memproses...' : (!!formData.id_area ? 'Simpan Perubahan' : 'Simpan Area Baru')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="w-[95vw] sm:max-w-sm border-sidebar-border/70 rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> Hapus Area
                        </DialogTitle>
                        <DialogDescription className="mt-2">
                            Apakah Anda yakin ingin menghapus <strong>{selectedArea?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 sm:justify-end gap-2">
                        <Button variant="outline" className="bg-white dark:bg-neutral-950" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
                        <Button onClick={handleConfirmDelete} disabled={isDeleting} variant="destructive">
                            {isDeleting && <Spinner className="w-4 h-4 mr-2" />}
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Area'}
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

AreaPage.layout = {
    breadcrumbs: [
        {
            title: 'Data Area',
            href: '/area',
        },
    ],
};
