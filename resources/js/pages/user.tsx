import { useState, useEffect, useRef } from 'react';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Search, Plus, MoreHorizontal, CheckCircle2, XCircle, AlertCircle, Filter, Edit, Trash2, UserCog, Mail, Shield, ChevronDown, UserSquare2, Key, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TablePagination } from '@/components/ui/table-pagination';
import { Spinner } from '@/components/ui/spinner';

export default function User({ dataUser = [], dataArea = [] }: { dataUser?: any[], dataArea?: any[] }) {
    const { auth } = usePage().props;
    const canManageUsers = ['SUPERADMIN', 'OWNER'].includes((auth?.user as any)?.role);

    const [searchQuery, setSearchQuery] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [visibleMobileCount, setVisibleMobileCount] = useState(10);
    
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

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
    const [actionMenuOpenId, setActionMenuOpenId] = useState<string | number | null>(null);
    const [isLongPressTriggered, setIsLongPressTriggered] = useState(false);
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
        setIsLongPressTriggered(false);
        longPressTimerRef.current = setTimeout(() => {
            setIsLongPressTriggered(true);
            setActionMenuOpenId(id);
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
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
                setIsLongPressTriggered(false);
            }
        }
    };

    const { data: formData, setData: setFormData, post, put, reset, clearErrors, errors, processing } = useForm({
        id: '',
        name: '',
        email: '',
        password: '',
        role: 'TEKNISI',
        status: 'AKTIF',
        area_ids: [] as number[],
        alamat: '',
        telepon: '',
    });

    const handleOpenAdd = () => {
        reset();
        clearErrors();
        setIsAddOpen(true);
    };

    const handleOpenEdit = (user: any) => {
        setSelectedUser(user);
        setFormData({
            id: user.id,
            name: user.nama,
            email: user.email,
            password: '',
            role: user.role,
            status: user.status,
            area_ids: user.area_ids || [],
            alamat: user.alamat || '',
            telepon: user.telepon || ''
        });
        clearErrors();
        setIsEditOpen(true);
    };

    const handleOpenDelete = (user: any) => {
        setSelectedUser(user);
        setIsDeleteOpen(true);
    };

    const [isDeleting, setIsDeleting] = useState(false);

    const handleSaveAdd = () => {
        post('/user', {
            onSuccess: () => {
                toast.success('Pengguna berhasil ditambahkan!');
                reset();
                setIsAddOpen(false);
            }
        });
    };

    const handleSaveEdit = () => {
        put(`/user/${selectedUser.id}`, {
            onSuccess: () => {
                toast.success('Pengguna berhasil diperbarui!');
                reset();
                setIsEditOpen(false);
            }
        });
    };

    const handleConfirmDelete = () => {
        if (selectedUser) {
            setIsDeleting(true);
            router.delete(`/user/${selectedUser.id}`, {
                onSuccess: () => {
                    toast.success('Pengguna berhasil dihapus!');
                    setIsDeleteOpen(false);
                },
                onFinish: () => {
                    setIsDeleting(false);
                }
            });
        }
    };

    const filteredUsers = (dataUser || []).filter(user => 
        String(user.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        String(user.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const mobileUsers = filteredUsers.slice(0, visibleMobileCount);

    const activeUsersCount = dataUser.filter(u => u.status?.toUpperCase() === 'AKTIF').length;
    const totalUsersCount = dataUser.length;

    return (
        <>
            <Head title="Manajemen Pengguna" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 lg:p-6">
                <div className="hidden sm:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Manajemen Pengguna</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Kelola staf, teknisi, penagih, dan hak akses aplikasi.</p>
                    </div>
                    <div className="flex justify-end w-full sm:w-auto">
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
                            {canManageUsers && (
                                <Button 
                                    onClick={handleOpenAdd}
                                    size="sm" 
                                    className="hidden sm:flex gap-2 h-9 bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Tambah Pengguna</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-lg shadow-sm overflow-hidden p-0 gap-0">
                    <div className="p-4 border-b border-sidebar-border/70 dark:border-sidebar-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="relative w-full sm:max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                type="search"
                                placeholder="Cari nama atau email staf..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-neutral-950 pl-9 border-neutral-200 dark:border-neutral-800 shadow-sm transition-all focus-visible:ring-blue-500"
                            />
                        </div>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 bg-white dark:bg-neutral-950">
                            <Filter className="w-4 h-4 mr-2 text-neutral-500" /> Filter Role
                        </Button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="hidden md:table w-full text-sm text-left">
                            <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-3.5 font-medium whitespace-nowrap">Nama Staf & ID</th>
                                    <th className="px-6 py-3.5 font-medium whitespace-nowrap">Email / Akun Login</th>
                                    <th className="px-6 py-3.5 font-medium whitespace-nowrap">Kontak & Lokasi</th>
                                    <th className="px-6 py-3.5 font-medium whitespace-nowrap">Hak Akses (Role)</th>
                                    <th className="px-6 py-3.5 font-medium whitespace-nowrap">Status Akun</th>
                                    {canManageUsers && <th className="px-6 py-3.5 font-medium text-center whitespace-nowrap">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {paginatedUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                                            Tidak ada data pengguna.
                                        </td>
                                    </tr>
                                )}
                                {paginatedUsers.map((u: any) => (
                                    <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-xs">
                                                    {u.nama?.substring(0,2).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-neutral-900 dark:text-white">{u.nama}</span>
                                                    <span className="text-xs text-neutral-500">{u.username}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-neutral-600 dark:text-neutral-300">
                                            {u.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-neutral-600 dark:text-neutral-300">
                                            <div className="flex flex-col gap-1">
                                                <span className="flex items-center gap-1.5 text-xs"><Phone className="w-3.5 h-3.5 text-emerald-500" /> {u.telepon || '-'}</span>
                                                <span className="flex items-center gap-1.5 text-xs truncate max-w-[200px]" title={u.alamat}><MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" /> <span className="truncate">{u.alamat || '-'}</span></span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {u.role === 'SUPERADMIN' && (
                                                <span className="inline-flex items-center text-[10px] uppercase tracking-wider bg-transparent border border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-400 font-bold px-2 py-0.5 rounded-sm">
                                                    SUPERADMIN
                                                </span>
                                            )}
                                            {u.role === 'OWNER' && (
                                                <span className="inline-flex items-center text-[10px] uppercase tracking-wider bg-transparent border border-rose-300 dark:border-rose-600 text-rose-700 dark:text-rose-400 font-bold px-2 py-0.5 rounded-sm">
                                                    OWNER
                                                </span>
                                            )}
                                            {u.role === 'PENAGIH' && (
                                                <span className="inline-flex items-center text-[10px] uppercase tracking-wider bg-transparent border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 font-bold px-2 py-0.5 rounded-sm">
                                                    PENAGIH
                                                </span>
                                            )}
                                            {u.role === 'TEKNISI' && (
                                                <span className="inline-flex items-center text-[10px] uppercase tracking-wider bg-transparent border border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-sm">
                                                    TEKNISI
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {u.status?.toUpperCase() === 'AKTIF' ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                                                    AKTIF
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                                                    NONAKTIF
                                                </span>
                                            )}
                                        </td>
                                        {canManageUsers && (
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-8 px-3 rounded-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                                        onClick={() => handleOpenEdit(u)}
                                                    >
                                                        <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-8 px-3 rounded-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                                                        onClick={() => handleOpenDelete(u)}
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
                    <div className="flex flex-col md:hidden divide-y divide-sidebar-border/70 dark:divide-sidebar-border border-t border-sidebar-border/70 dark:border-sidebar-border bg-neutral-50 dark:bg-neutral-950 pb-0">
                        {mobileUsers.length === 0 && (
                            <div className="p-8 text-center text-neutral-500 text-sm bg-white dark:bg-neutral-900 mt-2 mx-3 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                Tidak ada data pengguna.
                            </div>
                        )}
                        {mobileUsers.map((u: any) => (
                            <div key={u.id}
                                className={`p-4 mx-3 my-2 rounded-md shadow-sm border border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-900 select-none cursor-pointer relative overflow-hidden transition-transform duration-200 ${actionMenuOpenId === null ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800/80 active:bg-neutral-100 dark:active:bg-neutral-800 active:scale-[0.98]' : ''}`}
                                onTouchStart={(e) => handleTouchStart(e, u.id)}
                                onTouchEnd={handleTouchEnd}
                                onTouchCancel={handleTouchEnd}
                                onTouchMove={handleTouchEnd}
                                onContextMenu={(e) => { e.preventDefault(); }}
                                onClick={(e) => {
                                    if (!isLongPressTriggered) {
                                        if (canManageUsers) {
                                            handleOpenEdit(u);
                                        }
                                    }
                                    setTimeout(() => {
                                        setIsLongPressTriggered(false);
                                    }, 50);
                                }}
                            >
                                <div className="flex items-start justify-between gap-2 w-full">
                                    <div className="flex flex-col min-w-0 flex-1 pr-2">

                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                                <span className="font-bold text-base text-neutral-900 dark:text-white leading-tight truncate pb-0.5">{u.nama || '-'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col mt-1 min-w-0 w-full gap-0.5">
                                            <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                                                <Mail className="w-3 h-3" /> {u.email || '-'}
                                            </div>
                                            <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                                                <Phone className="w-3 h-3 text-emerald-500" /> {u.telepon || '-'}
                                            </div>
                                            <div className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 leading-snug mt-0.5 pr-2 pb-1 flex items-start gap-1.5">
                                                <MapPin className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" /> <span>{u.alamat || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end justify-start shrink-0 ml-auto h-full">
                                        <div className="flex flex-col items-end gap-1.5">
                                            {u.role === 'SUPERADMIN' && (
                                                <span className="inline-flex items-center text-[9px] uppercase tracking-wider bg-transparent border border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-400 font-bold px-1.5 py-0.5 rounded-sm">
                                                    SUPERADMIN
                                                </span>
                                            )}
                                            {u.role === 'OWNER' && (
                                                <span className="inline-flex items-center text-[9px] uppercase tracking-wider bg-transparent border border-rose-300 dark:border-rose-600 text-rose-700 dark:text-rose-400 font-bold px-1.5 py-0.5 rounded-sm">
                                                    OWNER
                                                </span>
                                            )}
                                            {u.role === 'PENAGIH' && (
                                                <span className="inline-flex items-center text-[9px] uppercase tracking-wider bg-transparent border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded-sm">
                                                    PENAGIH
                                                </span>
                                            )}
                                            {u.role === 'TEKNISI' && (
                                                <span className="inline-flex items-center text-[9px] uppercase tracking-wider bg-transparent border border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded-sm">
                                                    TEKNISI
                                                </span>
                                            )}
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${u.status?.toUpperCase() === 'AKTIF' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                                                {u.status?.toUpperCase() || 'NONAKTIF'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {visibleMobileCount < filteredUsers.length && (
                            <div className="p-4 flex justify-center">
                                <Button variant="outline" size="sm" onClick={() => setVisibleMobileCount(prev => prev + 10)} className="w-full text-xs font-medium">Tampilkan Lebih Banyak</Button>
                            </div>
                        )}
                    </div>

                    {/* Action Menu Bottom Modal (No Animation) */}
                    {actionMenuOpenId !== null && (
                        (() => {
                            const u = filteredUsers.find((user: any) => user.id === actionMenuOpenId);
                            if (!u) return null;
                            return (
                                <div className="fixed inset-0 z-[9999] flex flex-col justify-end md:hidden">
                                    <div
                                        className="absolute inset-0 bg-black/60"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActionMenuOpenId(null); }}
                                        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setActionMenuOpenId(null); }}
                                        onTouchStart={(e) => { e.stopPropagation(); }}
                                    />
                                    <div className="relative bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl border-t border-neutral-200/50 dark:border-neutral-800/50 pb-8 ring-1 ring-black/5">
                                        <div className="flex justify-center p-4">
                                            <div className="w-16 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
                                        </div>
                                        <div className="px-5 pb-4 pt-1">
                                            <div className="flex items-center gap-3 mb-6 px-1">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shadow-inner">
                                                    {u.nama?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">Menu Pengguna</h3>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{u.nama || 'Unknown'}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                {canManageUsers && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start h-12 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl font-semibold text-base transition-colors"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setActionMenuOpenId(null);
                                                                handleOpenEdit(u);
                                                            }}
                                                        >
                                                            <Edit className="w-5 h-5 mr-3" /> Edit Data
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start h-12 text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl font-semibold text-base transition-colors"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setActionMenuOpenId(null);
                                                                handleOpenDelete(u);
                                                            }}
                                                        >
                                                            <Trash2 className="w-5 h-5 mr-3" /> Hapus Data
                                                        </Button>
                                                    </>
                                                )}
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
                            totalItems={filteredUsers.length}
                            paginatedLength={paginatedUsers.length}
                            itemName="staf/user"
                        />
                    </div>
                </Card>
            </div>

            {/* Add / Edit Modal */}
            <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsAddOpen(false);
                    setIsEditOpen(false);
                }
            }}>
                <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-xl border-sidebar-border/70 p-0 overflow-hidden gap-0 bg-white dark:bg-neutral-950">
                    <DialogHeader className="px-6 py-4 border-b border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-blue-600 dark:text-blue-400 rounded-lg shadow-sm">
                                {!!formData.id ? <Edit className="w-4 h-4" /> : <UserCog className="w-4 h-4" />}
                            </div>
                            <div className="flex flex-col gap-0.5 text-left">
                                <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                    {!!formData.id ? 'Edit Data Pengguna' : 'Tambah Staf Baru'}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Atur informasi login dan hak akses (Role) sistem.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex flex-col px-6 py-6 gap-6 overflow-y-auto max-h-[65vh]">
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <Label htmlFor="name" className="text-neutral-700 dark:text-neutral-300">Nama Lengkap Staf <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <UserSquare2 className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Cth: Aidika Akbar" className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                    </div>
                                    {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name}</span>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="email" className="text-neutral-700 dark:text-neutral-300">Alamat Email <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <Mail className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <Input type="email" id="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Cth: admin@domain.com" className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                    </div>
                                    {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email}</span>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="password" className="text-neutral-700 dark:text-neutral-300">Kata Sandi {!!formData.id && <span className="text-xs text-neutral-400 font-normal">(Kosongkan jika tidak diubah)</span>}</Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <Key className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <Input type="password" id="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" className="pl-9 w-full bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                    </div>
                                    {errors.password && <span className="text-red-500 text-xs mt-1">{errors.password}</span>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="role" className="text-neutral-700 dark:text-neutral-300">Hak Akses (Role) <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <Shield className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <select id="role" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="appearance-none pl-9 pr-10 relative z-0 flex h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                            <option value="SUPERADMIN" className="dark:bg-neutral-900 text-purple-600">SUPERADMIN (Master Admin)</option>
                                            <option value="OWNER" className="dark:bg-neutral-900 text-rose-600">OWNER (Owner / Admin)</option>
                                            <option value="TEKNISI" className="dark:bg-neutral-900 text-indigo-600">TEKNISI (Jaringan & Tiket)</option>
                                            <option value="PENAGIH" className="dark:bg-neutral-900 text-amber-600">PENAGIH (Staf Lapangan)</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                                            <ChevronDown className="h-4 w-4 text-neutral-400" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="status" className="text-neutral-700 dark:text-neutral-300">Status Akun</Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <CheckCircle2 className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <select id="status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="appearance-none pl-9 pr-10 relative z-0 flex h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                            <option value="AKTIF" className="dark:bg-neutral-900">Aktif (Bisa Login)</option>
                                            <option value="NONAKTIF" className="dark:bg-neutral-900">Nonaktif (Suspend / Resign)</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                                            <ChevronDown className="h-4 w-4 text-neutral-400" />
                                        </div>
                                    </div>
                                </div>

                                    {formData.role !== 'OWNER' && (
                                        <>
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="telepon" className="text-neutral-700 dark:text-neutral-300">No. Telepon</Label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                                        <Phone className="h-4 w-4 text-neutral-400" />
                                                    </div>
                                                    <Input type="text" id="telepon" value={formData.telepon} onChange={e => setFormData({...formData, telepon: e.target.value})} placeholder="Cth: 081234567890" className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="alamat" className="text-neutral-700 dark:text-neutral-300">Alamat</Label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                                        <MapPin className="h-4 w-4 text-neutral-400" />
                                                    </div>
                                                    <Input type="text" id="alamat" value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} placeholder="Cth: Jl. Raya No. 123" className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {formData.role === 'PENAGIH' && (
                                <div className="flex flex-col gap-3 pt-4 border-t border-sidebar-border/70">
                                    <Label className="text-neutral-700 dark:text-neutral-300">Cakupan Area Penagihan <span className="text-red-500">*</span></Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {dataArea.length === 0 ? (
                                            <span className="text-sm text-neutral-500">Belum ada data area.</span>
                                        ) : (
                                            dataArea.map((area: any) => (
                                                <label key={area.id_area} className="flex items-center gap-2 text-sm p-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                                    <input 
                                                        type="checkbox" 
                                                        className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                                                        checked={formData.area_ids.includes(area.id_area)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setFormData({...formData, area_ids: [...formData.area_ids, area.id_area]});
                                                            } else {
                                                                setFormData({...formData, area_ids: formData.area_ids.filter(id => id !== area.id_area)});
                                                            }
                                                        }}
                                                    />
                                                    <span className="text-neutral-700 dark:text-neutral-300">{area.nama_area}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                    <p className="text-xs text-neutral-500">Pilih satu atau lebih area yang menjadi tanggung jawab penagih ini.</p>
                                </div>
                            )}
                        </div>
                    
                    <DialogFooter className="px-6 py-4 border-t border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20 sm:justify-end">
                        <Button variant="outline" className="bg-white dark:bg-neutral-950" onClick={() => {setIsAddOpen(false); setIsEditOpen(false);}}>Batal</Button>
                        <Button type="button" onClick={!!formData.id ? handleSaveEdit : handleSaveAdd} disabled={processing} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
                            {processing && <Spinner className="w-4 h-4 mr-2" />}
                            {processing ? 'Memproses...' : (!!formData.id ? 'Simpan Perubahan' : 'Simpan Akun')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-sm border-sidebar-border/70">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> Hapus Pengguna
                        </DialogTitle>
                        <DialogDescription className="mt-2 text-neutral-500 dark:text-neutral-400">
                            Hapus akun <strong>{selectedUser?.nama}</strong>? Pengguna ini tidak akan bisa login ke sistem lagi secara permanen.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 sm:justify-end gap-2">
                        <Button variant="outline" className="bg-white dark:bg-neutral-950" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
                        <Button onClick={handleConfirmDelete} disabled={isDeleting} variant="destructive">
                            {isDeleting && <Spinner className="w-4 h-4 mr-2" />}
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Akun'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {canManageUsers && (
                <Button
                    onClick={(e) => { e.currentTarget.blur(); handleOpenAdd(); }}
                    className={`sm:hidden fixed right-6 md:right-8 z-[60] w-14 h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.3)] bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 p-0 ${isFabVisible && !isAddOpen && !isEditOpen ? 'bottom-20 md:bottom-8 scale-100' : '-bottom-20 scale-0'}`}
                >
                    <Plus className="w-6 h-6" />
                </Button>
            )}
        </>
    );
}

User.layout = {
    breadcrumbs: [
        {
            title: 'User Management',
            href: '/user',
        },
    ],
};
