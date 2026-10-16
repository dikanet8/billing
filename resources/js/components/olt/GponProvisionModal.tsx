import { useState, useEffect } from 'react';
import { useEcho } from '@laravel/echo-react';
import axios from 'axios';
import { 
    Search, 
    CheckCircle2, 
    AlertCircle, 
    RefreshCw, 
    Activity,
    Network,
    PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { TablePagination } from '@/components/ui/table-pagination';
import { toast } from 'sonner';

export default function GponProvisionModal({ 
    isOpen, 
    onClose,
    onSuccess, 
    olt,
    ports = []
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSuccess?: (sn?: string) => void;
    olt: any;
    ports?: any[];
}) {
    const [uncfgOnus, setUncfgOnus] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<string[]>([]);
    const [onuTypes, setOnuTypes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isProvisioning, setIsProvisioning] = useState(false);
    const [isProvisionFormOpen, setIsProvisionFormOpen] = useState(false);
    const [selectedOnu, setSelectedOnu] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        onu_type: 'ZTE-G'
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPon, setSelectedPon] = useState('');

    const fetchUncfgOnus = async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const response = await fetch(`/api/olt/${olt.id}/gpon/uncfg?_t=${Date.now()}`, { cache: 'no-store' });
            const data = await response.json();
            if (data.status === 'success') {
                setUncfgOnus(data.data);
            } else {
                toast.error(data.message || 'Gagal memuat daftar ONU');
            }
        } catch (err: any) {
            toast.error('Terjadi kesalahan jaringan.');
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    useEcho(olt && isOpen ? `olt.${olt.id}.uncfg` : '', 'OltUncfgDataUpdated', (e: any) => {
        if (e.uncfgOnus) setUncfgOnus(e.uncfgOnus);
    }, [olt, isOpen], 'public');

    const fetchOnuTypes = async () => {
        try {
            const response = await fetch(`/api/olt/${olt.id}/gpon/types`);
            const data = await response.json();
            if (data.status === 'success' && data.data.length > 0) {
                setOnuTypes(data.data);
                setFormData(prev => ({ ...prev, onu_type: data.data[0] }));
            }
        } catch (err: any) {
            console.error('Failed to load ONU types');
        }
    };

    useEffect(() => {
        if (isOpen && olt) {
            fetchUncfgOnus();
            fetchOnuTypes();
            
            const pingWatch = () => {
                axios.post('/api/olt/ping-watch', { olt_id: olt.id, uncfg: true }).catch(() => {});
            };
            
            const interval = setInterval(pingWatch, 10000);
            return () => clearInterval(interval);
        }
    }, [isOpen, olt]);




    const openProvisionForm = (onu: any) => {
        setSelectedOnu(onu);
        setFormData(prev => ({ ...prev, name: '' }));
        setIsProvisionFormOpen(true);
    };

    const handleProvision = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProvisioning(true);

        try {
            const response = await fetch(`/api/olt/${olt.id}/gpon/provision`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content
                },
                body: JSON.stringify({
                    port: selectedOnu.port,
                    sn: selectedOnu.sn,
                    ...formData
                })
            });

            const data = await response.json();
            if (response.ok && data.status === 'success') {
                toast.success(data.message);
                setIsProvisionFormOpen(false);
                if (onSuccess) {
                    onSuccess(selectedOnu.sn);
                } else {
                    onClose();
                }
            } else {
                toast.error(data.message || 'Gagal melakukan provisioning');
            }
        } catch (err) {
            toast.error('Terjadi kesalahan jaringan saat provisioning');
        } finally {
            setIsProvisioning(false);
        }
    };

    const filteredOnus = (uncfgOnus || []).filter(onu => {
        const onuSn = String(onu?.sn || '').toLowerCase();
        const onuPort = String(onu?.port || '').toLowerCase();
        const sq = String(searchQuery || '').toLowerCase();
        
        const matchesSearch = onuSn.includes(sq) || onuPort.includes(sq);
        const matchesPon = selectedPon === '' || String(onu?.port || '') === selectedPon;
        return matchesSearch && matchesPon;
    });

    const uniquePons = ports && ports.length > 0 
        ? ports.map(p => {
            const rawPort = p?.name ? String(p.name).replace('epon_', '').replace('gpon_', '') : '';
            const isGpon = p?.name ? String(p.name).includes('gpon') : false;
            const isEpon = p?.name ? String(p.name).includes('epon') : false;
            let label = `Port ${rawPort}`;
            if (isGpon) label = `GPON ${rawPort}`;
            if (isEpon) label = `EPON ${rawPort}`;
            return { value: rawPort, label };
        }).sort((a, b) => (a.value || '').localeCompare((b.value || ''), undefined, { numeric: true }))
        : Array.from(new Set((uncfgOnus || []).map(onu => onu?.port)))
            .filter(Boolean)
            .map(port => ({ value: port, label: `Port ${port}` }))
            .sort((a, b) => (String(a.value || '')).localeCompare(String(b.value || ''), undefined, { numeric: true }));

    const paginatedOnus = filteredOnus.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-4xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>Unconfigured ONU (GPON Baru)</span>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => fetchUncfgOnus()} 
                                disabled={isLoading}
                                className="mr-6"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Scan
                            </Button>
                        </DialogTitle>
                        <DialogDescription>
                            Daftar perangkat ONT/Modem GPON baru yang terdeteksi di OLT namun belum dikonfigurasi.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl my-4">
                        <div className="relative w-full sm:flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <Input
                                placeholder="Cari SN atau Port..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                            />
                        </div>
                        <div className="w-full sm:w-48 relative">
                            <select
                                value={selectedPon}
                                onChange={(e) => setSelectedPon(e.target.value)}
                                className="appearance-none flex h-9 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm ring-offset-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:focus:ring-indigo-800"
                            >
                                <option value="">Semua Port PON</option>
                                {uniquePons.map(pon => (
                                    <option key={pon.value} value={pon.value}>{pon.label}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-neutral-500 dark:text-neutral-400 uppercase bg-neutral-50/50 dark:bg-neutral-900/50">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Serial Number (SN)</th>
                                    <th className="px-4 py-3 font-medium">Port GPON</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-950">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center">
                                            <div className="flex flex-col items-center justify-center text-neutral-400">
                                                <Spinner className="w-6 h-6 mb-2 text-indigo-500" />
                                                <p className="text-xs">Memindai ONU unauthenticated...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedOnus.length > 0 ? (
                                    paginatedOnus.map((onu, index) => (
                                        <tr key={index} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-md text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                                                        <Activity className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-neutral-900 dark:text-neutral-100">{onu.sn}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono text-xs border border-neutral-200 dark:border-neutral-700">
                                                    <Network className="w-3 h-3" />
                                                    {onu.port}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-medium border border-amber-200/50 dark:border-amber-500/20">
                                                    <span className="relative flex h-1.5 w-1.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                                                    </span>
                                                    Unconfigured
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button 
                                                    size="sm" 
                                                    variant="default" 
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs shadow-sm shadow-indigo-500/20"
                                                    onClick={() => openProvisionForm(onu)}
                                                >
                                                    <PlusCircle className="w-3 h-3 mr-1.5" />
                                                    Provision
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-full mb-3">
                                                    <CheckCircle2 className="w-6 h-6 text-neutral-400" />
                                                </div>
                                                <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm mb-1">Tidak ada ONU baru</p>
                                                <p className="text-xs">Semua ONU di GPON sudah teregistrasi.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!isLoading && filteredOnus.length > 0 && (
                        <div className="pt-4">
                            <TablePagination
                                currentPage={currentPage}
                                setCurrentPage={setCurrentPage}
                                itemsPerPage={itemsPerPage}
                                setItemsPerPage={setItemsPerPage}
                                totalItems={filteredOnus.length}
                                paginatedLength={paginatedOnus.length}
                                itemName="ONU"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isProvisionFormOpen} onOpenChange={setIsProvisionFormOpen}>
                <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="w-[95vw] max-h-[90vh] sm:max-w-xl border-sidebar-border/70 p-0 overflow-hidden gap-0 bg-white dark:bg-neutral-950 rounded-xl">
                    <DialogHeader className="relative px-6 py-4 border-b border-sidebar-border/70 overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="relative z-10 flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-indigo-600 dark:text-indigo-400 rounded-lg shadow-sm">
                                <PlusCircle className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col gap-0.5 text-left">
                                <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                    Provisioning ONU Baru
                                </DialogTitle>
                                <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Daftarkan ONU {selectedOnu?.sn} ke OLT pada port {selectedOnu?.port}.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <form onSubmit={handleProvision} className="flex flex-col">
                        <div className="flex flex-col px-6 py-6 gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <Label htmlFor="name" className="text-neutral-700 dark:text-neutral-300">Nama Pelanggan <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Contoh: John Doe"
                                        required
                                        className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <Label htmlFor="onu_type" className="text-neutral-700 dark:text-neutral-300">Tipe ONU</Label>
                                    <select
                                        id="onu_type"
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-indigo-800"
                                        value={formData.onu_type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, onu_type: e.target.value }))}
                                    >
                                        {onuTypes.length === 0 && <option value="ZTE-G">ZTE-G (Memuat dari OLT...)</option>}
                                        {onuTypes.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 border-t border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20 sm:justify-end">
                            <Button type="button" variant="outline" className="bg-white dark:bg-neutral-950" onClick={() => setIsProvisionFormOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]" disabled={isProvisioning}>
                                {isProvisioning && <Spinner className="w-4 h-4 mr-2" />}
                                {isProvisioning ? 'Memproses...' : 'Provision ONU'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
