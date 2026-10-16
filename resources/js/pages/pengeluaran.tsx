import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { Search, Plus, MoreHorizontal, AlertCircle, Filter, Edit, Trash2, Wallet, Banknote, CalendarDays, FileText, ChevronDown, ListTree, ArrowDownRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TablePagination } from '@/components/ui/table-pagination';
import { Spinner } from '@/components/ui/spinner';

export default function Pengeluaran({ dataPengeluaran = [], filters = {} }: { dataPengeluaran?: any[], filters?: any }) {
    const { auth } = usePage().props;
    const canManage = ['SUPERADMIN', 'OWNER'].includes((auth?.user as any)?.role);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    const [filterBulan, setFilterBulan] = useState(String(filters?.bulan || (new Date().getMonth() + 1)));
    const [filterTahun, setFilterTahun] = useState(String(filters?.tahun || new Date().getFullYear()));
    const [filterKategori, setFilterKategori] = useState(filters?.kategori || 'Semua');

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedExp, setSelectedExp] = useState<any>(null);

    const monthNames: Record<string, string> = {
        'Semua': 'Semua Bulan',
        '1': 'Januari', '2': 'Februari', '3': 'Maret', '4': 'April',
        '5': 'Mei', '6': 'Juni', '7': 'Juli', '8': 'Agustus',
        '9': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
    };
    const currentYear = new Date().getFullYear();
    const years = ['Semua', ...Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())];

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        title: '',
        category: 'Operasional',
        amount: '',
        notes: ''
    });

    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number).replace(/\u00A0/g, ' ').replace(/\u202f/g, ' ');
    };
    
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
    };

    const handleOpenAdd = () => {
        setFormData({ 
            date: new Date().toISOString().split('T')[0], 
            title: '', 
            category: 'Operasional', 
            amount: '', 
            notes: '' 
        });
        setIsAddOpen(true);
    };

    const handleOpenEdit = (exp: any) => {
        setSelectedExp(exp);
        setFormData({
            date: exp.tgl_pengeluaran ? exp.tgl_pengeluaran.split(' ')[0] : new Date().toISOString().split('T')[0],
            title: exp.keterangan || '',
            category: exp.kategori || 'Operasional',
            amount: exp.nominal ? exp.nominal.toString() : '',
            notes: ''
        });
        setIsEditOpen(true);
    };

    const handleOpenDelete = (exp: any) => {
        setSelectedExp(exp);
        setIsDeleteOpen(true);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSaveAdd = () => {
        if (!formData.title || !formData.amount) return;
        setIsSubmitting(true);
        router.post('/pengeluaran', {
            keterangan: formData.title,
            nominal: formData.amount,
            tgl_pengeluaran: formData.date,
            kategori: formData.category
        }, {
            onSuccess: () => {
                setIsAddOpen(false);
                setFormData({ date: new Date().toISOString().split('T')[0], title: '', category: 'Operasional', amount: '', notes: '' });
            },
            onFinish: () => setIsSubmitting(false)
        });
    };

    const handleSaveEdit = () => {
        if (!formData.title || !formData.amount || !selectedExp) return;
        setIsSubmitting(true);
        router.put(`/pengeluaran/${selectedExp.id_pengeluaran}`, {
            keterangan: formData.title,
            nominal: formData.amount,
            tgl_pengeluaran: formData.date,
            kategori: formData.category
        }, {
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedExp(null);
            },
            onFinish: () => setIsSubmitting(false)
        });
    };

    const handleConfirmDelete = () => {
        if (!selectedExp) return;
        setIsDeleting(true);
        router.delete(`/pengeluaran/${selectedExp.id_pengeluaran}`, {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedExp(null);
            },
            onFinish: () => setIsDeleting(false)
        });
    };

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

    const filteredExpenses = (dataPengeluaran || []).filter(e => 
        (e.keterangan?.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (String(e.id_pengeluaran).toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getCategoryColor = (kategori: string) => {
        switch (kategori) {
            case 'Operasional': return 'border-blue-500 text-blue-600 dark:text-blue-400';
            case 'Infrastruktur': return 'border-indigo-500 text-indigo-600 dark:text-indigo-400';
            case 'Gaji Karyawan': return 'border-emerald-500 text-emerald-600 dark:text-emerald-400';
            case 'Konsumsi': return 'border-orange-500 text-orange-600 dark:text-orange-400';
            default: return 'border-neutral-500 text-neutral-600 dark:text-neutral-400';
        }
    };

    return (
        <>
            <Head title="Buku Kas & Pengeluaran" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 lg:p-6">
                <div className="hidden sm:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Kas & Pengeluaran</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Catat biaya operasional, pembelian alat, dan kas keluar.</p>
                    </div>
                    <div className="flex justify-end w-full sm:w-auto">
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
                            <div className="flex justify-end items-center w-full sm:w-auto gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto h-10 sm:h-9 bg-white dark:bg-neutral-900 shadow-sm border-neutral-200 dark:border-neutral-800">
                                            <ListTree className="w-4 h-4" />
                                            <span>{filterKategori === 'Semua' ? 'Semua Kategori' : filterKategori}</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 z-50 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-lg">
                                        {['Semua', 'Operasional', 'Infrastruktur', 'Gaji Karyawan', 'Konsumsi', 'Lain-lain'].map((kat) => (
                                            <DropdownMenuItem 
                                                key={kat} 
                                                className={`cursor-pointer ${filterKategori === kat ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : ""}`}
                                                onClick={() => {
                                                    setFilterKategori(kat);
                                                    router.get('/pengeluaran', { bulan: filterBulan, tahun: filterTahun, kategori: kat }, { preserveState: true, preserveScroll: true });
                                                }}
                                            >
                                                {kat === 'Semua' ? 'Semua Kategori' : kat}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto h-10 sm:h-9 bg-white dark:bg-neutral-900 shadow-sm border-neutral-200 dark:border-neutral-800">
                                            <Filter className="w-4 h-4" />
                                            <span>{filterBulan === 'Semua' ? 'Semua Bulan' : monthNames[filterBulan]}</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 z-50 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-lg">
                                        {Object.keys(monthNames).map((key) => (
                                            <DropdownMenuItem 
                                                key={key} 
                                                className={`cursor-pointer ${filterBulan === key ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : ""}`}
                                                onClick={() => {
                                                    setFilterBulan(key);
                                                    router.get('/pengeluaran', { bulan: key, tahun: filterTahun, kategori: filterKategori }, { preserveState: true, preserveScroll: true });
                                                }}
                                            >
                                                {monthNames[key]}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto h-10 sm:h-9 bg-white dark:bg-neutral-900 shadow-sm border-neutral-200 dark:border-neutral-800">
                                            <span>{filterTahun === 'Semua' ? 'Semua Tahun' : filterTahun}</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-32 z-50 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 shadow-lg">
                                        {years.map((year) => (
                                            <DropdownMenuItem 
                                                key={year} 
                                                className={`cursor-pointer ${filterTahun === year ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : ""}`}
                                                onClick={() => {
                                                    setFilterTahun(year);
                                                    router.get('/pengeluaran', { bulan: filterBulan, tahun: year, kategori: filterKategori }, { preserveState: true, preserveScroll: true });
                                                }}
                                            >
                                                {year === 'Semua' ? 'Semua Tahun' : year}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            {canManage && (
                                <Button 
                                    onClick={handleOpenAdd}
                                    size="sm" 
                                    className="hidden sm:flex gap-2 h-9 bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Catat Pengeluaran</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                
                <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden p-0 gap-0">
                    <div className="p-4 border-b border-sidebar-border/70 dark:border-sidebar-border flex flex-col sm:flex-row items-center justify-start gap-4 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                <Input
                                    type="search"
                                    placeholder="Cari deskripsi atau ID pengeluaran..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white dark:bg-neutral-950 pl-9 border-neutral-200 dark:border-neutral-800 shadow-sm transition-all focus-visible:ring-rose-500"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="hidden md:table w-full text-sm text-left">
                            <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-3.5 font-medium">ID & Waktu</th>
                                    <th className="px-6 py-3.5 font-medium">Uraian / Judul Pengeluaran</th>
                                    <th className="px-6 py-3.5 font-medium">Kategori Kebutuhan</th>
                                    <th className="px-6 py-3.5 font-medium">Total Nominal (Rp)</th>
                                    {canManage && <th className="px-6 py-3.5 font-medium text-center">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {paginatedExpenses.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                                            Tidak ada data pengeluaran ditemukan.
                                        </td>
                                    </tr>
                                )}
                                {paginatedExpenses.map((exp: any) => (
                                    <tr key={exp.id_pengeluaran} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-neutral-900 dark:text-white">EXP-{exp.id_pengeluaran}</div>
                                            <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5">
                                                <CalendarDays className="w-3.5 h-3.5" /> {formatDate(exp.tgl_pengeluaran)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                                            {exp.keterangan}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-transparent border px-2 py-0.5 rounded-sm ${getCategoryColor(exp.kategori || 'Lain-lain')}`}>
                                                {exp.kategori || 'Lain-lain'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">
                                            {formatRupiah(exp.nominal)}
                                        </td>
                                        {canManage && (
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-8 px-3 rounded-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                                        onClick={() => handleOpenEdit(exp)}
                                                    >
                                                        <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-8 px-3 rounded-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                                                        onClick={() => handleOpenDelete(exp)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Hapus
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Mobile Cards */}
                    <div className="flex flex-col md:hidden divide-y divide-sidebar-border/70 dark:divide-sidebar-border border-t border-sidebar-border/70">
                        {paginatedExpenses.length === 0 && (
                            <div className="p-8 text-center text-neutral-500">
                                Tidak ada data pengeluaran ditemukan.
                            </div>
                        )}
                        {paginatedExpenses.map((exp: any) => (
                            <div key={exp.id_pengeluaran}
                                className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors bg-white dark:bg-neutral-900 select-none cursor-pointer relative"
                                onTouchStart={() => handleTouchStart(exp.id_pengeluaran)}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchEnd}
                                onMouseDown={() => handleTouchStart(exp.id_pengeluaran)}
                                onMouseUp={handleTouchEnd}
                                onMouseLeave={handleTouchEnd}
                                onContextMenu={(e) => { e.preventDefault(); }}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 shrink-0">
                                            <Banknote className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm text-neutral-900 dark:text-white line-clamp-1">{exp.keterangan}</span>
                                            <div className="flex items-center mt-0.5 gap-2">
                                                <span className="text-[10px] text-neutral-500 font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded leading-none">EXP-{exp.id_pengeluaran}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {canManage && (
                                    <DropdownMenu open={actionMenuOpenId === exp.id_pengeluaran} onOpenChange={(open) => {
                                        if (!open) setActionMenuOpenId(null);
                                    }}>
                                        <DropdownMenuTrigger asChild>
                                            <div className="w-1 h-1 opacity-0 pointer-events-none mx-auto my-auto"></div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40 border-sidebar-border/70 shadow-none">
                                            <DropdownMenuItem onClick={() => handleOpenEdit(exp)} className="cursor-pointer">
                                                <Edit className="w-4 h-4 mr-2 text-neutral-500" /> Edit Data
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenDelete(exp)} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
                                                <Trash2 className="w-4 h-4 mr-2" /> Hapus
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    )}
                                </div>
                                
                                <div className="mt-3 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-neutral-500">Kategori & Nominal</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-transparent border px-2 py-0.5 rounded-sm ${getCategoryColor(exp.kategori || 'Lain-lain')}`}>
                                                {exp.kategori || 'Lain-lain'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                        <div className="flex items-center gap-1.5">
                                            <CalendarDays className="w-3 h-3 text-neutral-400" />
                                            <span className="text-[10px] text-neutral-500">{formatDate(exp.tgl_pengeluaran)}</span>
                                        </div>
                                        <div className="font-medium text-neutral-900 dark:text-white flex items-center gap-1 text-sm">
                                            {formatRupiah(exp.nominal)}
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
                        totalItems={filteredExpenses.length}
                        paginatedLength={paginatedExpenses.length}
                        itemName="pengeluaran"
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
                <DialogContent className="sm:max-w-xl border-sidebar-border/70 p-0 overflow-hidden gap-0 bg-white dark:bg-neutral-950" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader className="relative px-6 py-4 border-b border-sidebar-border/70 overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/20">
                        
                        <div className="relative z-10 flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-rose-600 dark:text-rose-400 rounded-lg shadow-sm">
                                {isEditOpen ? <Edit className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                            </div>
                            <div className="flex flex-col gap-0.5 text-left">
                                <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                    {isEditOpen ? 'Edit Catatan Pengeluaran' : 'Catat Pengeluaran Baru'}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {isEditOpen 
                                        ? 'Perbarui data riwayat buku kas keluar.' 
                                        : 'Tambahkan data uang keluar untuk operasional atau inventaris.'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex flex-col px-6 py-6 gap-6">
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <Label htmlFor="title" className="text-neutral-700 dark:text-neutral-300">Uraian / Judul <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <FileText className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Cth: Beli Kabel Fiber 1 Roll" className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-rose-500" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="date" className="text-neutral-700 dark:text-neutral-300">Tanggal Transaksi <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <CalendarDays className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <Input type="date" id="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="pl-9 w-full bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-rose-500 relative z-0 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="category" className="text-neutral-700 dark:text-neutral-300">Kategori <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <ListTree className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <select id="category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="appearance-none pl-9 pr-10 relative z-0 flex h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">
                                            <option value="Operasional" className="dark:bg-neutral-900">Operasional Umum</option>
                                            <option value="Infrastruktur" className="dark:bg-neutral-900">Infrastruktur & Alat</option>
                                            <option value="Gaji Karyawan" className="dark:bg-neutral-900">Gaji Karyawan</option>
                                            <option value="Konsumsi" className="dark:bg-neutral-900">Konsumsi & Dapur</option>
                                            <option value="Lain-lain" className="dark:bg-neutral-900">Lain-lain</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                                            <ChevronDown className="h-4 w-4 text-neutral-400" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <Label htmlFor="amount" className="text-neutral-700 dark:text-neutral-300">Total Nominal Keluar (Rp) <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <Wallet className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <Input type="number" id="amount" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="Cth: 500000" className="pl-9 w-full bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-rose-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <Label htmlFor="notes" className="text-neutral-700 dark:text-neutral-300">Catatan Tambahan (Opsional)</Label>
                                    <div className="relative">
                                        <div className="absolute top-2.5 left-0 pl-3 flex items-start pointer-events-none z-10">
                                            <Info className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <textarea id="notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Cth: Catatan bon, nama toko, atau keterangan lain." className="pl-9 flex w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] resize-none"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter className="px-6 py-4 border-t border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20 sm:justify-end">
                        <Button variant="outline" className="bg-white dark:bg-neutral-950" onClick={() => {setIsAddOpen(false); setIsEditOpen(false);}}>Batal</Button>
                        <Button onClick={isEditOpen ? handleSaveEdit : handleSaveAdd} disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700 text-white min-w-[140px]">
                            {isSubmitting && <Spinner className="w-4 h-4 mr-2" />}
                            {isSubmitting ? 'Memproses...' : (isEditOpen ? 'Simpan Perubahan' : 'Catat Pengeluaran')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-sm border-sidebar-border/70">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> Hapus Catatan
                        </DialogTitle>
                        <DialogDescription className="mt-2">
                            Apakah Anda yakin ingin menghapus catatan pengeluaran <strong>{selectedExp?.keterangan}</strong> sebesar {selectedExp ? formatRupiah(selectedExp.nominal) : ''}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 sm:justify-end gap-2">
                        <Button variant="outline" className="bg-white dark:bg-neutral-950" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
                        <Button onClick={handleConfirmDelete} disabled={isDeleting} variant="destructive">
                            {isDeleting && <Spinner className="w-4 h-4 mr-2" />}
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {canManage && (
                <Button
                    onClick={handleOpenAdd}
                    className="sm:hidden fixed bottom-20 right-6 z-50 w-14 h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(225,29,72,0.3)] bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 p-0"
                >
                    <Plus className="w-6 h-6" />
                </Button>
            )}
        </>
    );
}

Pengeluaran.layout = {
    breadcrumbs: [
        {
            title: 'Pengeluaran',
            href: '/pengeluaran',
        },
    ],
};
