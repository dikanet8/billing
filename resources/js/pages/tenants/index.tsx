import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Server, Plus, Search, Edit, Trash2, Building2, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function Tenants({ tenants = [] }: { tenants: any[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<any>(null);

    const { data, setData, post, put, delete: destroy, reset, errors, processing } = useForm({
        nama: '',
        owner_name: '',
        owner_email: '',
        owner_password: '',
    });

    const filteredTenants = tenants.filter(t => 
        t.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.alamat && t.alamat.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const openModal = (tenant: any = null) => {
        if (tenant) {
            setEditingTenant(tenant);
            setData({
                nama: tenant.nama,
                owner_name: tenant.owner?.nama || '',
                owner_email: tenant.owner?.email || '',
                owner_password: '',
            });
        } else {
            setEditingTenant(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTenant) {
            put(`/tenants/${editingTenant.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/tenants', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus tenant ini? Semua data terkait tenant ini akan terhapus secara permanen.')) {
            destroy(`/tenants/${id}`);
        }
    };

    return (
        <>
            <Head title="Manajemen Tenant" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Manajemen Tenant</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Kelola data mitra dan cabang (Multi-Tenant).</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                        <Input
                            type="search"
                            placeholder="Cari nama tenant..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-neutral-900 pl-9 border-sidebar-border/70 dark:border-sidebar-border shadow-sm transition-all focus-visible:ring-blue-500 rounded-xl"
                        />
                    </div>
                </div>

                {/* Cards Grid */}
                {filteredTenants.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-sidebar-border/70 dark:border-sidebar-border bg-transparent shadow-none">
                        <Building2 className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-3" />
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Tidak ada data tenant ditemukan.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredTenants.map((t) => (
                            <Card key={t.id} className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-[transform,box-shadow] hover:-translate-y-0.5">
                                <div className="p-4 sm:p-5 flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-neutral-900 dark:text-white line-clamp-1">{t.nama}</div>
                                                <div className="text-xs text-neutral-500">ID: {t.id}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button variant="ghost" size="icon" onClick={() => openModal(t)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-3 py-3 border-y border-sidebar-border/70 dark:border-sidebar-border">
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                                            <div className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2">{t.alamat || '-'}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                                            <div className="text-sm text-neutral-600 dark:text-neutral-300">{t.telepon || '-'}</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Pemilik / Owner</div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 font-medium text-xs shrink-0">
                                                {t.owner?.nama ? t.owner.nama.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-sm font-medium text-neutral-900 dark:text-white line-clamp-1">{t.owner?.nama || '-'}</span>
                                                <span className="text-xs text-neutral-500 line-clamp-1">{t.owner?.email || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-xl border-sidebar-border/70 p-0 overflow-hidden gap-0 bg-white dark:bg-neutral-950">
                    <DialogHeader className="relative px-6 py-4 border-b border-sidebar-border/70 overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="relative z-10 flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-blue-600 dark:text-blue-400 rounded-lg shadow-sm">
                                {editingTenant ? <Edit className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                            </div>
                            <div className="flex flex-col gap-0.5 text-left">
                                <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                    {editingTenant ? 'Edit Tenant' : 'Tambah Tenant Baru'}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Isi informasi detail untuk tenant / mitra cabang ini.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col">
                        <div className="flex flex-col px-6 py-6 gap-6 overflow-y-auto max-h-[65vh]">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 border-b border-sidebar-border/70 pb-2">
                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-md text-blue-600 dark:text-blue-400">
                                        <Building2 className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-semibold text-neutral-900 dark:text-white">Informasi Profil Tenant</h3>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nama" className="text-neutral-700 dark:text-neutral-300">Nama Tenant <span className="text-rose-500">*</span></Label>
                                    <Input
                                        id="nama"
                                        value={data.nama}
                                        onChange={e => setData('nama', e.target.value)}
                                        className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500"
                                        placeholder="Cth: AJ Net"
                                        required
                                    />
                                    {errors.nama && <p className="text-[13px] text-rose-500 mt-1">{errors.nama}</p>}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 mt-2">
                                <div className="flex items-center gap-2 border-b border-sidebar-border/70 pb-2">
                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-md text-blue-600 dark:text-blue-400">
                                        <Server className="w-4 h-4" />
                                    </div>
                                    <h3 className="font-semibold text-neutral-900 dark:text-white">Informasi Akun Pemilik (Owner)</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="owner_name" className="text-neutral-700 dark:text-neutral-300">Nama Pemilik <span className="text-rose-500">*</span></Label>
                                        <Input
                                            id="owner_name"
                                            value={data.owner_name}
                                            onChange={e => setData('owner_name', e.target.value)}
                                            className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500"
                                            placeholder="Cth: Budi Santoso"
                                            required
                                        />
                                        {errors.owner_name && <p className="text-[13px] text-rose-500 mt-1">{errors.owner_name}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="owner_email" className="text-neutral-700 dark:text-neutral-300">Email Login <span className="text-rose-500">*</span></Label>
                                        <Input
                                            id="owner_email"
                                            type="email"
                                            value={data.owner_email}
                                            onChange={e => setData('owner_email', e.target.value)}
                                            className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500"
                                            placeholder="Cth: budi@ajnet.com"
                                            required
                                        />
                                        {errors.owner_email && <p className="text-[13px] text-rose-500 mt-1">{errors.owner_email}</p>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="owner_password" className="text-neutral-700 dark:text-neutral-300">Kata Sandi {editingTenant && <span className="text-neutral-400 font-normal">(Kosongkan jika tidak diubah)</span>} {!editingTenant && <span className="text-rose-500">*</span>}</Label>
                                    <Input
                                        id="owner_password"
                                        type="password"
                                        value={data.owner_password}
                                        onChange={e => setData('owner_password', e.target.value)}
                                        className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500"
                                        placeholder="Min. 4 karakter"
                                        required={!editingTenant}
                                    />
                                    {errors.owner_password && <p className="text-[13px] text-rose-500 mt-1">{errors.owner_password}</p>}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={closeModal} disabled={processing} className="bg-white dark:bg-neutral-950">
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
                                {processing && <Spinner className="w-4 h-4 mr-2" />}
                                {processing ? 'Menyimpan...' : (editingTenant ? 'Simpan Perubahan' : 'Tambah Tenant')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Button
                onClick={() => openModal()}
                className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-50 w-14 h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.3)] bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 p-0"
            >
                <Plus className="w-6 h-6" />
            </Button>
        </>
    );
}
