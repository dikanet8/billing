import { useState, useEffect } from 'react';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Search, Banknote, Plus, MoreHorizontal, CheckCircle2, XCircle, AlertCircle, Filter, Edit, Trash2, Package, Activity, ChevronDown, Zap, Tag, Info, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TablePagination } from '@/components/ui/table-pagination';
import { Spinner } from '@/components/ui/spinner';

export default function PaketPage({ dataPaket }: { dataPaket?: any[] }) {
    const { auth } = usePage().props;
    const canManage = ['SUPERADMIN', 'OWNER'].includes((auth?.user as any)?.role);

    const pakets = dataPaket || [];
    const [searchQuery, setSearchQuery] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedPaket, setSelectedPaket] = useState<any>(null);

    const [actionMenuOpenId, setActionMenuOpenId] = useState<number | null>(null);
    const [pressTimer, setPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [isLongPressTriggered, setIsLongPressTriggered] = useState(false);

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

    const { data: formData, setData: setFormData, post, put, reset, clearErrors, errors, processing } = useForm({
        id_paket: '',
        paket_nama: '',
        kecepatan: '',
        paket_tarif: '',
        description: '',
    });

    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number).replace(/\u00A0/g, ' ').replace(/\u202f/g, ' ');
    };

    const handleOpenAdd = () => {
        reset();
        clearErrors();
        setIsAddOpen(true);
    };

    const handleOpenEdit = (paket: any) => {
        setSelectedPaket(paket);
        setFormData({
            id_paket: paket.id_paket,
            paket_nama: paket.paket_nama,
            kecepatan: paket.kecepatan?.toString() || '',
            paket_tarif: paket.paket_tarif?.toString() || '',
            description: paket.description || ''
        });
        clearErrors();
        setIsEditOpen(true);
    };

    const handleOpenDelete = (paket: any) => {
        setSelectedPaket(paket);
        setIsDeleteOpen(true);
    };

    const [isDeleting, setIsDeleting] = useState(false);

    const handleSaveAdd = () => {
        post('/paket', {
            onSuccess: () => {
                toast.success('Paket berhasil ditambahkan!');
                reset();
                setIsAddOpen(false);
            }
        });
    };

    const handleSaveEdit = () => {
        put(`/paket/${selectedPaket.id_paket}`, {
            onSuccess: () => {
                toast.success('Paket berhasil diperbarui!');
                reset();
                setIsEditOpen(false);
            }
        });
    };

    const handleConfirmDelete = () => {
        if (!selectedPaket) return;
        setIsDeleting(true);
        router.delete(`/paket/${selectedPaket.id_paket}`, {
            onSuccess: () => {
                toast.success('Paket berhasil dihapus!');
                setIsDeleteOpen(false);
            },
            onFinish: () => {
                setIsDeleting(false);
            }
        });
    };

    const filteredPakets = pakets.filter((paket: any) =>
        (paket.paket_nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (paket.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const paginatedPakets = filteredPakets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <>
            <Head title="Data Paket" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 lg:p-6">
                <div className="hidden sm:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Data Paket Layanan</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Kelola daftar paket internet, kecepatan, dan harga bulanan.</p>
                    </div>
                    {canManage && (
                        <div className="flex items-center gap-2">
                            <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                                <Plus className="w-4 h-4 mr-2" /> Tambah Paket
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
                                placeholder="Cari ID atau nama paket..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-neutral-950 pl-9 border-neutral-200 dark:border-neutral-800 shadow-sm transition-all focus-visible:ring-blue-500"
                            />
                        </div>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 bg-white dark:bg-neutral-950">
                            <Filter className="w-4 h-4 mr-2 text-neutral-500" /> Filter Paket
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="hidden md:table w-full text-sm text-left">
                            <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-3.5 font-medium">Nama Paket</th>
                                    <th className="px-6 py-3.5 font-medium">Detail Spesifikasi</th>
                                    <th className="px-6 py-3.5 font-medium">Harga Bulanan</th>
                                    <th className="px-6 py-3.5 font-medium text-center">Jml. Pelanggan</th>
                                    {canManage && <th className="px-6 py-3.5 font-medium text-center">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {paginatedPakets.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                                            Tidak ada data paket ditemukan.
                                        </td>
                                    </tr>
                                )}
                                {paginatedPakets.map((paket: any) => (
                                    <tr key={paket.id_paket} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{paket.paket_nama}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
                                                <Activity className="w-3.5 h-3.5 text-blue-500" /> {paket.kecepatan || '-'} Mbps
                                            </div>
                                            <div className="text-xs text-neutral-500 mt-1 max-w-[200px] truncate" title={paket.description}>
                                                {paket.description || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-neutral-900 dark:text-white">
                                                {formatRupiah(paket.paket_tarif)}
                                            </span>
                                            <span className="text-xs text-neutral-500 dark:text-neutral-500"> /bln</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center bg-transparent text-blue-600 dark:text-blue-400 font-semibold px-2 py-1 rounded-md text-xs border border-blue-500/50">
                                                <Users className="w-3.5 h-3.5 mr-1" /> {paket.pelanggan_count ?? paket.pelangganCount ?? '-'}
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
                                                        <DropdownMenuItem onClick={() => handleOpenEdit(paket)} className="cursor-pointer">
                                                            <Edit className="w-4 h-4 mr-2 text-neutral-500" /> Edit Paket
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleOpenDelete(paket)} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
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
                    <div className="flex flex-col md:hidden border-t border-sidebar-border/70 bg-neutral-50 dark:bg-neutral-950 pb-4">
                        {paginatedPakets.length === 0 && (
                            <div className="p-8 text-center text-neutral-500 bg-white dark:bg-neutral-900 mt-2 mx-3 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                Tidak ada data paket ditemukan.
                            </div>
                        )}
                        {paginatedPakets.map((paket: any) => (
                            <div key={paket.id_paket}
                                className={`p-4 mx-3 my-2 rounded-2xl shadow-sm border border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-900 select-none cursor-pointer relative overflow-hidden transition-colors duration-75 ${actionMenuOpenId === null ? 'hover:bg-neutral-100 dark:hover:bg-neutral-800/80 active:bg-neutral-200 dark:active:bg-neutral-700 active:shadow-inner' : ''}`}
                                onTouchStart={() => handleTouchStart(paket.id_paket)}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchEnd}
                                onMouseDown={() => handleTouchStart(paket.id_paket)}
                                onMouseUp={handleTouchEnd}
                                onMouseLeave={handleTouchEnd}
                                onContextMenu={(e) => { e.preventDefault(); }}
                                onClick={(e) => {
                                    if (actionMenuOpenId !== null) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        return;
                                    }
                                    if (!isLongPressTriggered && canManage) {
                                        handleOpenEdit(paket);
                                    }
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/50">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-sm text-neutral-900 dark:text-white truncate pr-2">{paket.paket_nama}</span>
                                            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatRupiah(paket.paket_tarif)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-neutral-500">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-blue-500 flex items-center gap-0.5"><Activity className="w-3 h-3" />{paket.kecepatan || '-'} Mbps</span>
                                            </div>
                                            <div className="inline-flex items-center text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-transparent border border-blue-500/50 px-2 py-1 rounded-md whitespace-nowrap">
                                                <Users className="w-3 h-3 mr-1" /> {paket.pelanggan_count ?? paket.pelangganCount ?? 0}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Menu Bottom Modal */}
                                {actionMenuOpenId === paket.id_paket && canManage && (
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
                                                        <Package className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-base text-neutral-900 dark:text-white">{paket.paket_nama}</h3>
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Paket Layanan</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        className="w-full justify-start h-12 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl font-semibold text-base transition-colors"
                                                        onClick={(e) => { e.stopPropagation(); setActionMenuOpenId(null); handleOpenEdit(paket); }}
                                                    >
                                                        <Edit className="w-5 h-5 mr-3" /> Edit Paket
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        disabled={(paket.pelanggan_count ?? paket.pelangganCount ?? 0) > 0}
                                                        className="w-full justify-start h-12 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl font-semibold text-base transition-colors disabled:opacity-50"
                                                        onClick={(e) => { e.stopPropagation(); setActionMenuOpenId(null); handleOpenDelete(paket); }}
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
                        totalItems={filteredPakets.length}
                        paginatedLength={paginatedPakets.length}
                        itemName="paket"
                    />
                </Card>
            </div>

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
                                {!!formData.id_paket ? <Edit className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                            </div>
                            <div className="flex flex-col gap-0.5 text-left">
                                <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                    {!!formData.id_paket ? 'Edit Data Paket' : 'Tambah Paket Baru'}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {!!formData.id_paket
                                        ? 'Perbarui informasi kecepatan dan harga paket internet.'
                                        : 'Tambahkan paket internet baru untuk ditawarkan ke pelanggan.'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex flex-col px-6 py-6 gap-6">
                        {/* Section: Spesifikasi Paket */}
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <Label htmlFor="name" className="text-neutral-700 dark:text-neutral-300">Nama Paket <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <Package className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <Input id="name" value={formData.paket_nama} onChange={e => setFormData({ ...formData, paket_nama: e.target.value })} placeholder="Cth: Paket Diamond 100Mbps" className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                    </div>
                                    {errors.paket_nama && <span className="text-red-500 text-xs mt-1">{errors.paket_nama}</span>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="speed" className="text-neutral-700 dark:text-neutral-300">Kecepatan (Mbps) <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <Zap className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <Input id="speed" type="number" value={formData.kecepatan} onChange={e => setFormData({ ...formData, kecepatan: e.target.value })} placeholder="100" className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                                            <span className="text-xs text-neutral-400 font-medium">Mbps</span>
                                        </div>
                                    </div>
                                    {errors.kecepatan && <span className="text-red-500 text-xs mt-1">{errors.kecepatan}</span>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="price" className="text-neutral-700 dark:text-neutral-300">Harga Bulanan (Rp) <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <Tag className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <Input id="price" type="text" value={formData.paket_tarif ? formData.paket_tarif.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''} onChange={e => setFormData({ ...formData, paket_tarif: e.target.value.replace(/\D/g, '') })} placeholder="250.000" className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                    </div>
                                    {errors.paket_tarif && <span className="text-red-500 text-xs mt-1">{errors.paket_tarif}</span>}
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <Label htmlFor="description" className="text-neutral-700 dark:text-neutral-300">Deskripsi Paket & Fitur Layanan</Label>
                                    <textarea id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Cth: Cocok untuk streaming 4K dan gaming, bebas FUP" className="flex w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] resize-none"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20 sm:justify-end">
                        <Button variant="outline" className="bg-white dark:bg-neutral-950" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>Batal</Button>
                        <Button type="button" onClick={!!formData.id_paket ? handleSaveEdit : handleSaveAdd} disabled={processing} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
                            {processing && <Spinner className="w-4 h-4 mr-2" />}
                            {processing ? 'Memproses...' : (!!formData.id_paket ? 'Simpan Perubahan' : 'Simpan Paket Baru')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="w-[95vw] sm:max-w-sm border-sidebar-border/70 rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> Hapus Paket
                        </DialogTitle>
                        <DialogDescription className="mt-2">
                            Apakah Anda yakin ingin menghapus paket <strong>{selectedPaket?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 sm:justify-end gap-2">
                        <Button variant="outline" className="bg-white dark:bg-neutral-950" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
                        <Button onClick={handleConfirmDelete} disabled={isDeleting} variant="destructive">
                            {isDeleting && <Spinner className="w-4 h-4 mr-2" />}
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Paket'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {canManage && (
                <Button
                    onClick={handleOpenAdd}
                    className="md:hidden fixed bottom-20 right-6 z-50 w-14 h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.3)] bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 p-0"
                >
                    <Plus className="w-6 h-6" />
                </Button>
            )}
        </>
    );
}

PaketPage.layout = {
    breadcrumbs: [
        {
            title: 'Data Paket & Layanan',
            href: '/paket',
        },
    ],
};
