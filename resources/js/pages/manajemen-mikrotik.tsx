import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { 
    Router, Server, ChevronDown, CheckCircle2, 
    XCircle, Plus, Loader2, Edit, Trash, Network, Activity
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { Spinner } from '@/components/ui/spinner';

export default function ManajemenMikrotik({ dataMikrotik = [] }: { dataMikrotik?: any[] }) {
    const { auth } = usePage().props as any;
    const canManage = ['SUPERADMIN', 'OWNER'].includes(auth?.user?.role);

    // State untuk Tambah Router
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
    const [formData, setFormData] = useState({
        nama: '',
        ip: '',
        port: 8728,
        username: 'admin',
        password: '',
        isolir_profile: '',
        is_isolir_enabled: false
    });

    const [mikrotikProfiles, setMikrotikProfiles] = useState<string[]>([]);
    const [isFetchingProfiles, setIsFetchingProfiles] = useState(false);

    const handleFetchProfiles = async (isEdit = false) => {
        setIsFetchingProfiles(true);
        try {
            const dataToUse = isEdit ? editFormData : formData;
            const getXsrfToken = () => {
                const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
                return match ? decodeURIComponent(match[2]) : '';
            };

            const response = await fetch('/mikrotik/fetch-profiles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken()
                },
                body: JSON.stringify({
                    ip: dataToUse.ip,
                    port: dataToUse.port,
                    username: dataToUse.username,
                    password: dataToUse.password
                })
            });
            const result = await response.json();
            if (result.success && result.profiles) {
                const names = result.profiles.map((p: any) => p.name);
                setMikrotikProfiles(names);
            } else {
                setMikrotikProfiles([]);
            }
        } catch (e) {
            console.error('Failed to fetch profiles', e);
        } finally {
            setIsFetchingProfiles(false);
        }
    };

    const handleTestConnection = async (isEdit = false) => {
        setIsTesting(true);
        setTestResult(null);
        try {
            const getXsrfToken = () => {
                const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
                return match ? decodeURIComponent(match[2]) : '';
            };

            const response = await fetch('/mikrotik/test-connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken()
                },
                body: JSON.stringify(isEdit ? editFormData : formData)
            });
            const data = await response.json();
            setTestResult(data);
        } catch (error: any) {
            setTestResult({ success: false, message: 'Gagal menghubungi server' });
        } finally {
            setIsTesting(false);
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSave = () => {
        setIsSubmitting(true);
        router.post('/mikrotik', formData, {
            onSuccess: () => {
                setIsAddOpen(false);
                setFormData({ nama: '', ip: '', port: 8728, username: 'admin', password: '', isolir_profile: '', is_isolir_enabled: false });
                setTestResult(null);
            },
            onFinish: () => setIsSubmitting(false)
        });
    };

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedRouterId, setSelectedRouterId] = useState<string>('');
    const [editFormData, setEditFormData] = useState({
        id: '', nama: '', ip: '', port: 8728, username: '', password: '', isolir_profile: '', is_isolir_enabled: false
    });

    const handleEditClick = (id: string) => {
        const routerData = dataMikrotik.find(r => r.id.toString() === id.toString());
        if (routerData) {
            setEditFormData({
                id: routerData.id,
                nama: routerData.nama,
                ip: routerData.ip,
                port: routerData.port || 8728,
                username: routerData.username || 'admin',
                password: routerData.password || '',
                isolir_profile: routerData.isolir_profile || '',
                is_isolir_enabled: !!routerData.is_isolir_enabled
            });
            setIsEditOpen(true);
        }
    };

    const handleUpdate = () => {
        setIsSubmittingEdit(true);
        router.put(`/mikrotik/${editFormData.id}`, editFormData, {
            onSuccess: () => {
                setIsEditOpen(false);
                setEditFormData({ id: '', nama: '', ip: '', port: 8728, username: '', password: '', isolir_profile: '', is_isolir_enabled: false });
                setTestResult(null);
            },
            onFinish: () => setIsSubmittingEdit(false)
        });
    };

    const handleDelete = () => {
        if (!selectedRouterId) return;
        setIsDeleting(true);
        router.delete(`/mikrotik/${selectedRouterId}`, {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedRouterId('');
            },
            onFinish: () => setIsDeleting(false)
        });
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const paginatedMikrotik = dataMikrotik.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <>
            <Head title="Manajemen Mikrotik" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-6">
                
                {/* Header (Text Removed) */}
                {canManage && (
                    <div className="hidden md:flex justify-end">
                        <Button 
                            onClick={() => setIsAddOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Router
                        </Button>
                    </div>
                )}

                {/* Tabel Mikrotik */}
                <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden p-0 gap-0 mt-2">
                    <div className="px-4 py-3 border-b border-sidebar-border/70 dark:border-sidebar-border flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-neutral-100 dark:bg-neutral-800/80 rounded-md text-neutral-600 dark:text-neutral-400">
                                <Router className="w-4 h-4" />
                            </div>
                            <h3 className="font-semibold text-neutral-900 dark:text-white">Daftar Router Mikrotik</h3>
                        </div>
                    </div>
                    
                    <div className="overflow-auto max-h-[500px]">
                        <table className="hidden md:table w-full text-xs text-left">
                            <thead className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-2.5 font-semibold">Nama Router</th>
                                    <th className="px-4 py-2.5 font-semibold">IP Address</th>
                                    <th className="px-4 py-2.5 font-semibold">Port</th>
                                    <th className="px-4 py-2.5 font-semibold">Username</th>
                                    <th className="px-4 py-2.5 font-semibold">Fitur Isolir</th>
                                    <th className="px-4 py-2.5 font-semibold">Profile Isolir</th>
                                    <th className="px-4 py-2.5 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {paginatedMikrotik.length > 0 ? (
                                    paginatedMikrotik.map((router, idx) => (
                                        <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group">
                                            <td className="px-4 py-3 font-bold text-neutral-900 dark:text-white">
                                                {router.nama}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400">
                                                {router.ip}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400">
                                                {router.port || 8728}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400">
                                                {router.username || 'admin'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {router.is_isolir_enabled ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 font-semibold px-1.5 py-0.5 rounded">
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-semibold px-1.5 py-0.5 rounded">
                                                        Tidak Aktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                                {router.isolir_profile || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {canManage && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="w-8 h-8 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                            onClick={() => handleEditClick(router.id)}
                                                            title="Edit Router"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="w-8 h-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            onClick={() => {
                                                                setSelectedRouterId(router.id);
                                                                setIsDeleteOpen(true);
                                                            }}
                                                            title="Hapus Router"
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                            Belum ada data router mikrotik yang ditambahkan
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile Cards View */}
                    <div className="flex flex-col md:hidden border-t border-sidebar-border/70 bg-neutral-50 dark:bg-neutral-950 pb-4">
                        {paginatedMikrotik.length === 0 && (
                            <div className="p-8 text-center text-neutral-500 text-sm bg-white dark:bg-neutral-900 mt-2 mx-3 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                Belum ada data router.
                            </div>
                        )}
                        {paginatedMikrotik.map((router, idx) => (
                            <div key={idx} className="p-4 mx-3 my-2 rounded-md shadow-sm border border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col gap-3 relative overflow-hidden transition-transform duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 active:bg-neutral-100 dark:active:bg-neutral-800 active:scale-[0.98]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-md text-neutral-500">
                                            <Router className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-1">{router.nama}</span>
                                            <span className="text-[10px] text-neutral-500 font-mono">{router.ip}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {canManage && (
                                            <>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="w-7 h-7 text-blue-500"
                                                    onClick={() => handleEditClick(router.id)}
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="w-7 h-7 text-red-500"
                                                    onClick={() => {
                                                        setSelectedRouterId(router.id);
                                                        setIsDeleteOpen(true);
                                                    }}
                                                >
                                                    <Trash className="w-3.5 h-3.5" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-[11px] mt-1 p-3 bg-neutral-50/50 dark:bg-neutral-800/30 rounded-lg border border-neutral-100 dark:border-neutral-800/60">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase tracking-wider text-neutral-500">Username</span>
                                        <span className="font-semibold text-neutral-700 dark:text-neutral-300 font-mono">{router.username || 'admin'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase tracking-wider text-neutral-500">API Port</span>
                                        <span className="font-semibold text-neutral-700 dark:text-neutral-300 font-mono">{router.port || 8728}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase tracking-wider text-neutral-500">Fitur Isolir</span>
                                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                            {router.is_isolir_enabled ? (
                                                <span className="text-emerald-600 dark:text-emerald-400">Aktif</span>
                                            ) : (
                                                <span className="text-neutral-500">Tidak Aktif</span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase tracking-wider text-neutral-500">Profile Isolir</span>
                                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">{router.isolir_profile || '-'}</span>
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
                        totalItems={dataMikrotik.length}
                        paginatedLength={paginatedMikrotik.length}
                        itemName="router"
                    />
                </Card>
            </div>

            {/* Mobile FAB */}
            {canManage && (
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95 transition-all z-50 focus:outline-none"
                    aria-label="Tambah Router"
                >
                    <Plus className="w-6 h-6" />
                </button>
            )}

            {/* Modal Tambah Router */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-xl overflow-hidden p-0 bg-white dark:bg-neutral-950 border-sidebar-border/70 rounded-xl">
                    <DialogHeader className="px-4 sm:px-6 py-4 border-b border-sidebar-border/70">
                        <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <Server className="w-5 h-5 text-blue-500" />
                            Tambah Router Mikrotik
                        </DialogTitle>
                        <DialogDescription className="text-xs text-neutral-500">
                            Masukkan informasi koneksi API Mikrotik Anda. Pastikan layanan API pada port 8728 telah diaktifkan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-4 sm:px-6 py-4 grid gap-4 max-h-[80vh] overflow-y-auto">
                        <div className="grid gap-1.5">
                            <Label htmlFor="nama" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Nama Pengenal <span className="text-red-500">*</span></Label>
                            <Input 
                                id="nama" 
                                value={formData.nama} 
                                onChange={e => setFormData({...formData, nama: e.target.value})} 
                                placeholder="Misal: Router Pusat"
                                className="h-9 text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                            <div className="grid gap-1.5 col-span-2 sm:col-span-3">
                                <Label htmlFor="ip" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">IP Address <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="ip" 
                                    value={formData.ip} 
                                    onChange={e => setFormData({...formData, ip: e.target.value})} 
                                    placeholder="192.168.1.1"
                                    className="h-9 text-sm font-mono"
                                />
                            </div>
                            <div className="grid gap-1.5 col-span-1">
                                <Label htmlFor="port" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">API Port <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="port" 
                                    type="number"
                                    value={formData.port} 
                                    onChange={e => setFormData({...formData, port: parseInt(e.target.value) || 8728})} 
                                    placeholder="8728"
                                    className="h-9 text-sm font-mono"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="username" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Username <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="username" 
                                    value={formData.username} 
                                    onChange={e => setFormData({...formData, username: e.target.value})} 
                                    placeholder="admin"
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="password" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Password</Label>
                                <Input 
                                    id="password" 
                                    type="password"
                                    value={formData.password} 
                                    onChange={e => setFormData({...formData, password: e.target.value})} 
                                    placeholder="Kosongkan jika tidak ada"
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>

                        <div className="border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-lg mt-2">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="checkbox"
                                        id="is_isolir_enabled"
                                        checked={formData.is_isolir_enabled}
                                        onChange={e => setFormData({...formData, is_isolir_enabled: e.target.checked})}
                                        className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <Label htmlFor="is_isolir_enabled" className="text-xs font-bold text-amber-900 dark:text-amber-500 cursor-pointer">
                                        Aktifkan Fitur Isolir Otomatis
                                    </Label>
                                </div>
                                <p className="text-[10px] text-amber-700/80 dark:text-amber-500/70 leading-relaxed mb-2">
                                    Jika diaktifkan, pelanggan yang menunggak akan otomatis diubah profilenya (PPPoE/Hotspot) ke profile khusus isolir yang dibatasi akses internetnya.
                                </p>
                                    
                                {formData.is_isolir_enabled && (
                                        <div className="mt-1 flex flex-col sm:flex-row items-end gap-2 w-full">
                                            <div className="flex-1 w-full flex flex-col gap-1.5">
                                                <Label htmlFor="isolir_profile" className="text-[10px] font-semibold text-amber-800 dark:text-amber-600">Pilih Profile Isolir di Mikrotik</Label>
                                                <div className="flex gap-2">
                                                    <select
                                                        id="isolir_profile"
                                                        value={formData.isolir_profile}
                                                        onChange={e => setFormData({...formData, isolir_profile: e.target.value})}
                                                        className="h-9 text-sm flex-1 rounded-md border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-neutral-900 px-3 py-1.5 focus:ring-2 focus:ring-amber-500"
                                                    >
                                                        <option value="">-- Pilih Profile --</option>
                                                        {mikrotikProfiles.map(p => (
                                                            <option key={p} value={p}>{p}</option>
                                                        ))}
                                                    </select>
                                                    <Button 
                                                        type="button" 
                                                        variant="outline" 
                                                        className="h-9 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-500 bg-white dark:bg-neutral-900 hover:bg-amber-50"
                                                        onClick={() => handleFetchProfiles(false)}
                                                        disabled={isFetchingProfiles}
                                                    >
                                                        {isFetchingProfiles ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tarik Data'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => handleTestConnection(false)} 
                                disabled={isTesting || !formData.ip}
                                className="h-8 text-xs font-semibold px-3"
                            >
                                {isTesting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Activity className="w-3.5 h-3.5 mr-1.5" />}
                                Test Koneksi API
                            </Button>
                            {testResult && (
                                <span className={`text-xs font-medium flex items-center ${testResult.success ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {testResult.success ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                                    {testResult.success ? 'Berhasil' : 'Gagal terhubung'}
                                </span>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="px-4 sm:px-6 py-4 border-t border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
                            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="w-1/2 sm:w-auto">Batal</Button>
                            <Button 
                                type="button" 
                                className="w-1/2 sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20" 
                                onClick={handleSave}
                                disabled={!formData.nama || !formData.ip || !formData.username || isTesting || (formData.is_isolir_enabled && !formData.isolir_profile) || isSubmitting}
                            >
                                {isSubmitting ? <Spinner className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                {isSubmitting ? 'Menyimpan...' : 'Tambah Router'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Edit Router */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-xl overflow-hidden p-0 bg-white dark:bg-neutral-950 border-sidebar-border/70 rounded-xl">
                    <DialogHeader className="px-4 sm:px-6 py-4 border-b border-sidebar-border/70">
                        <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <Edit className="w-5 h-5 text-blue-500" />
                            Edit Konfigurasi Mikrotik
                        </DialogTitle>
                    </DialogHeader>
                    <div className="px-4 sm:px-6 py-4 grid gap-4 max-h-[80vh] overflow-y-auto">
                        <div className="grid gap-1.5">
                            <Label htmlFor="edit-nama" className="text-xs font-semibold">Nama Pengenal <span className="text-red-500">*</span></Label>
                            <Input 
                                id="edit-nama" 
                                value={editFormData.nama} 
                                onChange={e => setEditFormData({...editFormData, nama: e.target.value})} 
                                className="h-9 text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                            <div className="grid gap-1.5 col-span-2 sm:col-span-3">
                                <Label htmlFor="edit-ip" className="text-xs font-semibold">IP Address <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="edit-ip" 
                                    value={editFormData.ip} 
                                    onChange={e => setEditFormData({...editFormData, ip: e.target.value})} 
                                    className="h-9 text-sm font-mono"
                                />
                            </div>
                            <div className="grid gap-1.5 col-span-1">
                                <Label htmlFor="edit-port" className="text-xs font-semibold">API Port <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="edit-port" 
                                    type="number"
                                    value={editFormData.port} 
                                    onChange={e => setEditFormData({...editFormData, port: parseInt(e.target.value) || 8728})} 
                                    className="h-9 text-sm font-mono"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="edit-username" className="text-xs font-semibold">Username <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="edit-username" 
                                    value={editFormData.username} 
                                    onChange={e => setEditFormData({...editFormData, username: e.target.value})} 
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="edit-password" className="text-xs font-semibold">Password <span className="text-neutral-400 font-normal">(Kosongkan jika tidak diubah)</span></Label>
                                <Input 
                                    id="edit-password" 
                                    type="password"
                                    value={editFormData.password} 
                                    onChange={e => setEditFormData({...editFormData, password: e.target.value})} 
                                    placeholder="••••••"
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>
                        
                        <div className="border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-lg mt-2">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="checkbox"
                                        id="edit_is_isolir_enabled"
                                        checked={editFormData.is_isolir_enabled}
                                        onChange={e => setEditFormData({...editFormData, is_isolir_enabled: e.target.checked})}
                                        className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <Label htmlFor="edit_is_isolir_enabled" className="text-xs font-bold text-amber-900 dark:text-amber-500 cursor-pointer">
                                        Aktifkan Fitur Isolir Otomatis
                                    </Label>
                                </div>
                                    
                                {editFormData.is_isolir_enabled && (
                                        <div className="mt-2 flex flex-col gap-1.5">
                                            <Label htmlFor="edit_isolir_profile" className="text-[10px] font-semibold text-amber-800 dark:text-amber-600">Pilih Profile Isolir di Mikrotik</Label>
                                            <div className="flex gap-2">
                                                <select
                                                    id="edit_isolir_profile"
                                                    value={editFormData.isolir_profile}
                                                    onChange={e => setEditFormData({...editFormData, isolir_profile: e.target.value})}
                                                    className="h-9 text-sm flex-1 rounded-md border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-neutral-900 px-3 py-1.5 focus:ring-2 focus:ring-amber-500"
                                                >
                                                    <option value="">-- Pilih Profile --</option>
                                                    {/* Sertakan nilai sebelumnya jika tidak di-fetch ulang namun ada nilainya */}
                                                    {editFormData.isolir_profile && !mikrotikProfiles.includes(editFormData.isolir_profile) && (
                                                        <option value={editFormData.isolir_profile}>{editFormData.isolir_profile}</option>
                                                    )}
                                                    {mikrotikProfiles.map(p => (
                                                        <option key={p} value={p}>{p}</option>
                                                    ))}
                                                </select>
                                                <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    className="h-9 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-500 bg-white hover:bg-amber-50"
                                                    onClick={() => handleFetchProfiles(true)}
                                                    disabled={isFetchingProfiles}
                                                >
                                                    {isFetchingProfiles ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tarik Data'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        <div className="flex items-center gap-2 mt-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => handleTestConnection(true)} 
                                disabled={isTesting || !editFormData.ip}
                                className="h-8 text-xs font-semibold px-3"
                            >
                                {isTesting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Activity className="w-3.5 h-3.5 mr-1.5" />}
                                Test Koneksi API
                            </Button>
                            {testResult && (
                                <span className={`text-xs font-medium flex items-center ${testResult.success ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {testResult.success ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                                    {testResult.success ? 'Berhasil' : 'Gagal terhubung'}
                                </span>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="px-4 sm:px-6 py-4 border-t border-sidebar-border/70 bg-neutral-50 dark:bg-neutral-900/50">
                        <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
                            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="w-1/2 sm:w-auto">Batal</Button>
                            <Button 
                                type="button" 
                                className="w-1/2 sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20" 
                                onClick={handleUpdate}
                                disabled={!editFormData.nama || !editFormData.ip || !editFormData.username || isTesting || (editFormData.is_isolir_enabled && !editFormData.isolir_profile) || isSubmittingEdit}
                            >
                                {isSubmittingEdit ? <Spinner className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                {isSubmittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Hapus */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-red-100 dark:border-red-900/30 shadow-lg shadow-red-500/10 rounded-xl bg-white dark:bg-neutral-950">
                    <div className="p-6 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                            <Trash className="w-8 h-8 text-red-600 dark:text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Hapus Konfigurasi Mikrotik?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                            Apakah Anda yakin ingin menghapus Mikrotik ini? Hal ini tidak akan menghapus data di Mikrotik secara fisik, namun sistem tidak bisa lagi berkomunikasi dengan router ini.
                        </p>
                        <div className="flex items-center gap-3 w-full">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDeleteOpen(false)}>
                                Batal
                            </Button>
                            <Button type="button" className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={isDeleting} onClick={handleDelete}>
                                {isDeleting ? <Spinner className="w-4 h-4 mr-2" /> : <Trash className="w-4 h-4 mr-2" />}
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
ManajemenMikrotik.layout = {
    breadcrumbs: [
        {
            title: 'Manajemen Mikrotik',
            href: '/manajemen-mikrotik',
        },
    ],
};
