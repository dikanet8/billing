import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { Search, MapPin, UserCog, Edit, Map, Users, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { Spinner } from '@/components/ui/spinner';

export default function AreaPenagih({ penagih = [], areas = [] }: { penagih: any[], areas: any[] }) {
    const { auth } = usePage().props as any;
    const canManage = ['SUPERADMIN', 'OWNER'].includes(auth?.user?.role);

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPenagih, setSelectedPenagih] = useState<any>(null);
    const [selectedAreaIds, setSelectedAreaIds] = useState<number[]>([]);

    const filteredPenagih = penagih.filter(p => 
        p.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const paginatedPenagih = filteredPenagih.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleEditClick = (user: any) => {
        setSelectedPenagih(user);
        setSelectedAreaIds(user.areas ? user.areas.map((a: any) => a.id_area) : []);
        setIsEditOpen(true);
    };

    const toggleAreaSelection = (areaId: number) => {
        if (selectedAreaIds.includes(areaId)) {
            setSelectedAreaIds(selectedAreaIds.filter(id => id !== areaId));
        } else {
            setSelectedAreaIds([...selectedAreaIds, areaId]);
        }
    };

    const handleUpdate = () => {
        if (!selectedPenagih) return;

        setIsSubmitting(true);
        router.post(`/area-penagih/${selectedPenagih.id}`, {
            areas: selectedAreaIds
        }, {
            onSuccess: () => {
                toast.success('Pemetaan area penagih berhasil diperbarui!');
                setIsEditOpen(false);
            },
            onError: () => {
                toast.error('Terjadi kesalahan saat memperbarui pemetaan.');
            },
            onFinish: () => setIsSubmitting(false)
        });
    };

    return (
        <>
            <Head title="Manajemen Area Penagih" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 lg:p-6">
                


                <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden p-0 gap-0 mt-2">
                    <div className="p-4 border-b border-sidebar-border/70 dark:border-sidebar-border flex flex-col sm:flex-row items-center justify-end gap-4 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="relative w-full sm:max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                type="search"
                                placeholder="Cari nama atau username penagih..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-white dark:bg-neutral-950 pl-9 border-neutral-200 dark:border-neutral-800 shadow-sm transition-all focus-visible:ring-blue-500"
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto hidden md:block">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Nama Penagih</th>
                                    <th className="px-6 py-3 font-semibold">Username</th>
                                    <th className="px-6 py-3 font-semibold w-1/2">Area Terdaftar</th>
                                    <th className="px-6 py-3 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {paginatedPenagih.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                                            Tidak ada data penagih ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPenagih.map((user, idx) => (
                                        <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold">
                                                        {user.nama.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-neutral-900 dark:text-white">
                                                        {user.nama}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-neutral-600 dark:text-neutral-400">
                                                {user.username}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {user.areas && user.areas.length > 0 ? (
                                                        user.areas.map((area: any) => (
                                                            <span key={area.id_area} className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-medium px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/30">
                                                                <MapPin className="w-3 h-3" />
                                                                {area.nama_area}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-neutral-400 italic">Belum ada area ditugaskan</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {canManage && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                        onClick={() => handleEditClick(user)}
                                                    >
                                                        <Map className="w-4 h-4 mr-2" /> Atur Area
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="flex flex-col md:hidden divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                        {paginatedPenagih.length === 0 ? (
                            <div className="p-6 text-center text-neutral-500">
                                Tidak ada data penagih ditemukan.
                            </div>
                        ) : (
                            paginatedPenagih.map((user, idx) => (
                                <div key={idx} className="p-4 flex flex-col gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold text-lg">
                                                {user.nama.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-neutral-900 dark:text-white text-base">
                                                    {user.nama}
                                                </span>
                                                <span className="text-xs font-mono text-neutral-500">
                                                    {user.username}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-1">
                                        <div className="text-[10px] font-semibold text-neutral-500 mb-1.5 uppercase tracking-wider">Area Terdaftar</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {user.areas && user.areas.length > 0 ? (
                                                user.areas.map((area: any) => (
                                                    <span key={area.id_area} className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-medium px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/30">
                                                        <MapPin className="w-3 h-3" />
                                                        {area.nama_area}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-neutral-400 italic">Belum ada area ditugaskan</span>
                                            )}
                                        </div>
                                    </div>
                                    {canManage && (
                                        <div className="mt-2 flex justify-end">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-8 text-xs text-blue-600 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full"
                                                onClick={() => handleEditClick(user)}
                                            >
                                                <Map className="w-3.5 h-3.5 mr-1.5" /> Atur Area
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <TablePagination 
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        setItemsPerPage={setItemsPerPage}
                        totalItems={filteredPenagih.length}
                        paginatedLength={paginatedPenagih.length}
                        itemName="penagih"
                    />
                </Card>
            </div>

            {/* Modal Edit Penugasan */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white dark:bg-neutral-950 rounded-xl">
                    <DialogHeader className="px-6 py-4 border-b border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <Map className="w-5 h-5 text-blue-500" /> Penugasan Area
                        </DialogTitle>
                        <DialogDescription className="text-sm">
                            Pilih area yang akan ditugaskan kepada <span className="font-semibold text-neutral-900 dark:text-white">{selectedPenagih?.nama}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        {areas.length === 0 ? (
                            <div className="text-center text-neutral-500 text-sm py-8">
                                Belum ada data area di sistem.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {areas.map(area => (
                                    <div 
                                        key={area.id_area}
                                        onClick={() => toggleAreaSelection(area.id_area)}
                                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                                            selectedAreaIds.includes(area.id_area)
                                                ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                                                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-blue-200 dark:hover:border-blue-800/50'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 shrink-0 ${
                                            selectedAreaIds.includes(area.id_area)
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700'
                                        }`}>
                                            {selectedAreaIds.includes(area.id_area) && <CheckCircle2 className="w-3.5 h-3.5" />}
                                        </div>
                                        <span className={`text-sm font-medium ${
                                            selectedAreaIds.includes(area.id_area)
                                                ? 'text-blue-900 dark:text-blue-100'
                                                : 'text-neutral-700 dark:text-neutral-300'
                                        }`}>
                                            {area.nama_area}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20 flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                        <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="w-full sm:w-auto">Batal</Button>
                        <Button type="button" onClick={handleUpdate} disabled={isSubmitting} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
                            {isSubmitting && <Spinner className="w-4 h-4 mr-2" />}
                            {isSubmitting ? 'Memproses...' : 'Simpan Area'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

AreaPenagih.layout = {
    breadcrumbs: [
        {
            title: 'Area Penagih',
            href: '/area-penagih',
        },
    ],
};
