import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Search, Plus, MoreHorizontal, CheckCircle2, AlertTriangle, AlertCircle, Filter, Edit, Trash2, Cpu, Activity, Network, ChevronDown, Layers, Server, Terminal, ThermometerSun, HardDrive, Loader2, RefreshCw, XCircle, Database, Shield, Signal, Settings, PlusCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TablePagination } from '@/components/ui/table-pagination';
import { Spinner } from '@/components/ui/spinner';
import axios from 'axios';

export default function Olt({ dataOlt = [] }: { dataOlt?: any[] }) {
    const { auth } = usePage().props;
    const canManage = ['SUPERADMIN', 'OWNER'].includes((auth?.user as any)?.role);
    
    const [searchQuery, setSearchQuery] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isSystemOpen, setIsSystemOpen] = useState(false);
    const [selectedOlt, setSelectedOlt] = useState<any>(null);
    
    const [systemData, setSystemData] = useState<any>(null);
    const [isSystemLoading, setIsSystemLoading] = useState(false);
    const [systemError, setSystemError] = useState('');

    const [oltStats, setOltStats] = useState<Record<number, {status?: string, portCapacity?: number | string}>>({});

    useEffect(() => {
        dataOlt.forEach(olt => {
            axios.get(`/olt/${olt.id}/system`).then(res => {
                const isOnline = res.data?.data?.isOnline;
                setOltStats(prev => ({
                    ...prev,
                    [olt.id]: { ...prev[olt.id], status: isOnline ? 'Normal' : 'Offline' }
                }));
            }).catch(() => {
                setOltStats(prev => ({ ...prev, [olt.id]: { ...prev[olt.id], status: 'Offline' } }));
            });
            
            axios.get(`/api/olt/${olt.id}/ports`).then(res => {
                const ports = res.data?.data || [];
                const ponPorts = ports.filter((p: any) => p.name.toLowerCase().includes('pon'));
                const capacity = ponPorts.length > 0 ? ponPorts.length : '-';
                setOltStats(prev => ({ ...prev, [olt.id]: { ...prev[olt.id], portCapacity: capacity } }));
            }).catch(() => {});
        });
    }, [dataOlt]);

    const [formData, setFormData] = useState({
        name: '',
        vendor: 'ZTE C300 V2',
        ipAddress: '',
        snmpPort: '161',
        snmpRead: 'public',
        snmpWrite: 'private',
        username: 'admin',
        password: '',
        portCapacity: '8',
        location: '',
        status: 'Normal'
    });

    const handleOpenAdd = () => {
        setFormData({ name: '', vendor: 'ZTE C300 V2', ipAddress: '', snmpPort: '161', snmpRead: 'public', snmpWrite: 'private', username: 'admin', password: '', portCapacity: '8', location: '', status: 'Normal' });
        setIsAddOpen(true);
    };

    const handleOpenEdit = (olt: any) => {
        setSelectedOlt(olt);
        setFormData({
            name: olt.name || olt.nama,
            vendor: olt.vendor || 'ZTE C300 V2',
            ipAddress: olt.ipAddress || olt.ip,
            snmpPort: olt.snmpPort || '161',
            snmpRead: olt.snmpRead || olt.snmp_community || 'public',
            snmpWrite: olt.snmpWrite || 'private',
            username: olt.username || 'admin',
            password: olt.password || '',
            portCapacity: olt.portCapacity || '8',
            location: olt.location || '',
            status: olt.status || 'Normal'
        });
        setIsEditOpen(true);
    };

    const handleOpenDelete = (olt: any) => {
        setSelectedOlt(olt);
        setIsDeleteOpen(true);
    };

    const handleOpenSystem = (olt: any) => {
        setSelectedOlt(olt);
        setIsSystemOpen(true);
        fetchSystemData(olt.id);
    };

    const fetchSystemData = async (id: any) => {
        setIsSystemLoading(true);
        setSystemError('');
        try {
            const response = await fetch(`/olt/${id}/system`);
            const data = await response.json();
            if (data.status === 'success') {
                setSystemData(data.data);
            } else {
                setSystemData(data.data);
                setSystemError(data.message);
            }
        } catch (err: any) {
            setSystemError('Gagal menghubungi server.');
            setSystemData({ uptime: '0d', cpu: 0, memory: 0, temperature: 0, isOnline: false });
        } finally {
            setIsSystemLoading(false);
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSaveAdd = () => {
        if (!formData.name || !formData.ipAddress) return;
        setIsSubmitting(true);
        router.post('/olt', formData, {
            onSuccess: () => setIsAddOpen(false),
            onFinish: () => setIsSubmitting(false)
        });
    };

    const handleSaveEdit = () => {
        if (!formData.name || !formData.ipAddress || !selectedOlt) return;
        setIsSubmitting(true);
        router.put(`/olt/${selectedOlt?.id}`, formData, {
            onSuccess: () => setIsEditOpen(false),
            onFinish: () => setIsSubmitting(false)
        });
    };

    const handleConfirmDelete = () => {
        if (!selectedOlt) return;
        setIsDeleting(true);
        router.delete(`/olt/${selectedOlt?.id}`, {
            onSuccess: () => setIsDeleteOpen(false),
            onFinish: () => setIsDeleting(false)
        });
    };

    const filteredOlts = dataOlt.filter(o => 
        (o.nama?.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (o.ip?.includes(searchQuery))
    );

    const paginatedOlts = filteredOlts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <>
            <Head title="Manajemen OLT" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Manajemen OLT</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Kelola perangkat Optical Line Terminal dan pantau status port.</p>
                    </div>
                </div>
                
                <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden p-0 gap-0">
                    <div className="p-4 border-b border-sidebar-border/70 dark:border-sidebar-border flex flex-col sm:flex-row items-center justify-end gap-4 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="relative w-full sm:max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                type="search"
                                placeholder="Cari nama atau IP address OLT..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-neutral-950 pl-9 border-neutral-200 dark:border-neutral-800 shadow-sm transition-all focus-visible:ring-blue-500"
                            />
                        </div>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 bg-white dark:bg-neutral-950">
                            <Filter className="w-4 h-4 mr-2 text-neutral-500" /> Filter Status
                        </Button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-3.5 font-medium">Perangkat & ID</th>
                                    <th className="px-6 py-3.5 font-medium">Manajemen IP</th>
                                    <th className="px-6 py-3.5 font-medium">Kapasitas PON</th>
                                    <th className="px-6 py-3.5 font-medium">Status Koneksi</th>
                                    <th className="px-6 py-3.5 font-medium text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {paginatedOlts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                                            Tidak ada data OLT.
                                        </td>
                                    </tr>
                                )}
                                {paginatedOlts.map((olt: any) => (
                                    <tr key={olt.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                                <Cpu className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 transition-colors" /> {olt.nama}
                                            </div>
                                            <div className="text-xs text-neutral-500 mt-1 pl-6">ID: {olt.id} — Vendor: {olt.vendor}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-neutral-900 dark:text-neutral-200 font-mono text-[13px] bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded w-fit">
                                                {olt.ip}:{olt.port}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-indigo-500" />
                                                <span className="font-semibold text-neutral-900 dark:text-white">
                                                    {oltStats[olt.id]?.portCapacity || olt.portCapacity || olt.port_capacity || (oltStats[olt.id]?.portCapacity === undefined ? <Loader2 className="w-3 h-3 animate-spin inline-block mr-1" /> : '-')}
                                                    {oltStats[olt.id]?.portCapacity !== undefined ? ' Port' : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {(!oltStats[olt.id]?.status && !olt.status) && (
                                                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 font-semibold px-2.5 py-1 rounded-md">
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing
                                                </span>
                                            )}
                                            {(oltStats[olt.id]?.status || olt.status) === 'Normal' && (
                                                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 font-semibold px-2.5 py-1 rounded-md">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Normal
                                                </span>
                                            )}
                                            {(oltStats[olt.id]?.status || olt.status) === 'Alarm LOS' && (
                                                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-semibold px-2.5 py-1 rounded-md">
                                                    <AlertTriangle className="w-3.5 h-3.5" /> Alarm LOS
                                                </span>
                                            )}
                                            {(oltStats[olt.id]?.status || olt.status) && (oltStats[olt.id]?.status || olt.status) !== 'Normal' && (oltStats[olt.id]?.status || olt.status) !== 'Alarm LOS' && (
                                                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-semibold px-2.5 py-1 rounded-md">
                                                    <Activity className="w-3.5 h-3.5" /> {oltStats[olt.id]?.status || olt.status || 'Unknown'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 border-sidebar-border/70 shadow-md">
                                                    <DropdownMenuItem onClick={() => handleOpenSystem(olt)} className="cursor-pointer font-medium text-blue-600 dark:text-blue-400 focus:bg-blue-50 dark:focus:bg-blue-900/20">
                                                        <Activity className="w-4 h-4 mr-2" /> Lihat Sistem
                                                    </DropdownMenuItem>
                                                    {canManage && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => router.get(`/olt/${olt.id}/monitoring`)} className="cursor-pointer font-medium text-indigo-600 dark:text-indigo-400 focus:bg-indigo-50 dark:focus:bg-indigo-900/20">
                                                                <Network className="w-4 h-4 mr-2" /> Monitoring Port
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleOpenEdit(olt)} className="cursor-pointer">
                                                                <Edit className="w-4 h-4 mr-2 text-neutral-500" /> Edit OLT
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleOpenDelete(olt)} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
                                                                <Trash2 className="w-4 h-4 mr-2" /> Hapus
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <TablePagination 
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        setItemsPerPage={setItemsPerPage}
                        totalItems={filteredOlts.length}
                        paginatedLength={paginatedOlts.length}
                        itemName="OLT"
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
                <DialogContent className="sm:max-w-xl border-sidebar-border/70 p-0 overflow-hidden gap-0 bg-white dark:bg-neutral-950">
                    <DialogHeader className="px-6 py-4 border-b border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-blue-600 dark:text-blue-400 rounded-lg shadow-sm">
                                {isEditOpen ? <Edit className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                            </div>
                            <div className="flex flex-col gap-0.5 text-left">
                                <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                    {isEditOpen ? 'Edit Perangkat OLT' : 'Tambah Perangkat OLT'}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Konfigurasi IP manajemen dan kapasitas PON.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex flex-col px-6 py-6 gap-6 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 border-b border-sidebar-border/70 pb-2">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-md text-blue-600 dark:text-blue-400">
                                    <Server className="w-4 h-4" />
                                </div>
                                <h3 className="font-semibold text-neutral-900 dark:text-white">Informasi Perangkat</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="name" className="text-neutral-700 dark:text-neutral-300">Nama Perangkat <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <Cpu className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Cth: OLT Pusat" className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="vendor" className="text-neutral-700 dark:text-neutral-300">Model OLT <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <Server className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <select id="vendor" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} className="appearance-none pl-9 pr-10 relative z-0 flex h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                            <option value="ZTE C300 V2" className="dark:bg-neutral-900">ZTE C300 V2</option>
                                            <option value="ZTE C320" className="dark:bg-neutral-900">ZTE C320</option>
                                            <option value="Hi-So" className="dark:bg-neutral-900">Hi-So</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                                            <ChevronDown className="h-4 w-4 text-neutral-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Divider for SNMP Config */}
                                <div className="md:col-span-2 pt-2 pb-1">
                                    <div className="flex items-center gap-2 border-b border-sidebar-border/70 pb-2">
                                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-md text-emerald-600 dark:text-emerald-400">
                                            <Network className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-semibold text-neutral-900 dark:text-white">Protokol SNMP</h3>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="ipAddress" className="text-neutral-700 dark:text-neutral-300">IP SNMP <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <Network className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <Input id="ipAddress" value={formData.ipAddress} onChange={e => setFormData({...formData, ipAddress: e.target.value})} placeholder="Cth: 10.20.20.1" className="pl-9 bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 font-mono text-sm" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="snmpPort" className="text-neutral-700 dark:text-neutral-300">Port SNMP</Label>
                                    <div className="relative">
                                        <Input id="snmpPort" value={formData.snmpPort} onChange={e => setFormData({...formData, snmpPort: e.target.value})} placeholder="161" className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 font-mono text-sm" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="snmpRead" className="text-neutral-700 dark:text-neutral-300">SNMP Read Community</Label>
                                    <div className="relative">
                                        <Input id="snmpRead" value={formData.snmpRead} onChange={e => setFormData({...formData, snmpRead: e.target.value})} placeholder="public" className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 font-mono text-sm" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="snmpWrite" className="text-neutral-700 dark:text-neutral-300">SNMP Write Community</Label>
                                    <div className="relative">
                                        <Input id="snmpWrite" type="password" value={formData.snmpWrite} onChange={e => setFormData({...formData, snmpWrite: e.target.value})} placeholder="private" className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 font-mono text-sm" />
                                    </div>
                                </div>

                                {/* Divider for Kredensial Login */}
                                <div className="md:col-span-2 pt-2 pb-1">
                                    <div className="flex items-center gap-2 border-b border-sidebar-border/70 pb-2">
                                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-md text-blue-600 dark:text-blue-400">
                                            <Server className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-semibold text-neutral-900 dark:text-white">Kredensial Login OLT</h3>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="username" className="text-neutral-700 dark:text-neutral-300">Username Login</Label>
                                    <div className="relative">
                                        <Input id="username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="admin" className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 font-mono text-sm" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="password" className="text-neutral-700 dark:text-neutral-300">Password Login</Label>
                                    <div className="relative">
                                        <Input id="password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 font-mono text-sm" />
                                    </div>
                                </div>

                                {/* Divider for Lainnya */}
                                <div className="md:col-span-2 pt-2 pb-1">
                                    <div className="flex items-center gap-2 border-b border-sidebar-border/70 pb-2">
                                        <h3 className="font-semibold text-neutral-900 dark:text-white">Lainnya</h3>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <Label htmlFor="portCapacity" className="text-neutral-700 dark:text-neutral-300">Kapasitas PON</Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <Layers className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <select id="portCapacity" value={formData.portCapacity} onChange={e => setFormData({...formData, portCapacity: e.target.value})} className="appearance-none pl-9 pr-10 relative z-0 flex h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                            <option value="4" className="dark:bg-neutral-900">4 Port PON</option>
                                            <option value="8" className="dark:bg-neutral-900">8 Port PON</option>
                                            <option value="16" className="dark:bg-neutral-900">16 Port PON</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                                            <ChevronDown className="h-4 w-4 text-neutral-400" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <Label htmlFor="location" className="text-neutral-700 dark:text-neutral-300">Lokasi / Keterangan</Label>
                                    <textarea id="location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Cth: Rak B3 Ruang NOC" className="flex w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] resize-none"></textarea>
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <Label htmlFor="status" className="text-neutral-700 dark:text-neutral-300">Status OLT Saat Ini</Label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                            <Activity className="h-4 w-4 text-neutral-400" />
                                        </div>
                                        <select id="status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="appearance-none pl-9 pr-10 relative z-0 flex h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                            <option value="Normal" className="dark:bg-neutral-900">Normal (Semua PON Up)</option>
                                            <option value="Alarm LOS" className="dark:bg-neutral-900">Alarm LOS (Loss of Signal)</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                                            <ChevronDown className="h-4 w-4 text-neutral-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter className="px-6 py-4 border-t border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20 sm:justify-end">
                        <Button variant="outline" className="bg-white dark:bg-neutral-950" onClick={() => {setIsAddOpen(false); setIsEditOpen(false);}}>Batal</Button>
                        <Button type="button" onClick={isEditOpen ? handleSaveEdit : handleSaveAdd} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
                            {isSubmitting && <Spinner className="w-4 h-4 mr-2" />}
                            {isSubmitting ? 'Memproses...' : (isEditOpen ? 'Simpan Perubahan' : 'Simpan OLT')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-sm border-sidebar-border/70">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> Hapus OLT
                        </DialogTitle>
                        <DialogDescription className="mt-2">
                            Menghapus <strong>{selectedOlt?.nama}</strong>? Data ONU/ONT yang terikat mungkin akan terpengaruh.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 sm:justify-end gap-2">
                        <Button variant="outline" className="bg-white dark:bg-neutral-950" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
                        <Button onClick={handleConfirmDelete} disabled={isDeleting} variant="destructive">
                            {isDeleting && <Spinner className="w-4 h-4 mr-2" />}
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus OLT'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* System Info Modal */}
            <Dialog open={isSystemOpen} onOpenChange={setIsSystemOpen}>
                <DialogContent className="sm:max-w-2xl border-sidebar-border/70 p-0 overflow-hidden bg-neutral-50 dark:bg-neutral-950">
                    <DialogHeader className="px-6 py-4 border-b border-sidebar-border/70 bg-white dark:bg-neutral-900 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shadow-sm border border-blue-100 dark:border-blue-800">
                                <Terminal className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col gap-0.5 text-left">
                                <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                    Sistem OLT: {selectedOlt?.nama}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {selectedOlt?.ip}:{selectedOlt?.port} — {selectedOlt?.vendor}
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                ONLINE
                            </span>
                        </div>
                    </DialogHeader>

                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto max-h-[70vh]">
                        {isSystemLoading ? (
                            <div className="col-span-2 md:col-span-4 py-12 flex flex-col items-center justify-center text-neutral-500">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                                <p>Mengambil data sistem via SNMP...</p>
                            </div>
                        ) : (
                            <>
                                {systemError && (
                                    <div className="col-span-2 md:col-span-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800 text-sm flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                        {systemError}
                                    </div>
                                )}
                                <Card className="p-4 border-sidebar-border/70 bg-white dark:bg-neutral-900 shadow-sm flex flex-col items-center justify-center text-center gap-2">
                                    <div className="p-2 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                                        <Cpu className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">{systemData?.cpu || 0}<span className="text-sm font-medium text-neutral-500">%</span></div>
                                        <div className="text-xs text-neutral-500 mt-0.5">CPU Usage</div>
                                    </div>
                                </Card>
                                
                                <Card className="p-4 border-sidebar-border/70 bg-white dark:bg-neutral-900 shadow-sm flex flex-col items-center justify-center text-center gap-2">
                                    <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                                        <HardDrive className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">{systemData?.memory || 0}<span className="text-sm font-medium text-neutral-500">%</span></div>
                                        <div className="text-xs text-neutral-500 mt-0.5">Memory Usage</div>
                                    </div>
                                </Card>

                                <Card className="p-4 border-sidebar-border/70 bg-white dark:bg-neutral-900 shadow-sm flex flex-col items-center justify-center text-center gap-2">
                                    <div className="p-2 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400">
                                        <ThermometerSun className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">{systemData?.temperature || 0}<span className="text-sm font-medium text-neutral-500">°C</span></div>
                                        <div className="text-xs text-neutral-500 mt-0.5">Temperature</div>
                                    </div>
                                </Card>

                                <Card className="p-4 border-sidebar-border/70 bg-white dark:bg-neutral-900 shadow-sm flex flex-col items-center justify-center text-center gap-2">
                                    <div className="p-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">{systemData?.uptime || '0d'}</div>
                                        <div className="text-xs text-neutral-500 mt-0.5">Uptime</div>
                                    </div>
                                </Card>

                                <div className="col-span-2 md:col-span-4 mt-2">
                                    <Card className="border-sidebar-border/70 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
                                        <div className="px-4 py-3 border-b border-sidebar-border/70 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/30">
                                            <h4 className="font-semibold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-blue-500" /> Status Port PON
                                            </h4>
                                        </div>
                                        <div className="p-4 flex flex-col gap-3">
                                            <div className="text-xs text-center text-neutral-400 mt-2 italic flex items-center justify-center gap-2">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                Data PON belum diambil dari SNMP. Menunggu sinkronisasi berkala.
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </>
                        )}
                    </div>
                    
                    <DialogFooter className="px-6 py-4 border-t border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20 sm:justify-end">
                        <Button variant="outline" className="bg-white dark:bg-neutral-950" onClick={() => setIsSystemOpen(false)}>Tutup</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSystemLoading} onClick={() => fetchSystemData(selectedOlt?.id)}>
                            {isSystemLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Network className="w-4 h-4 mr-2" />}
                            Segarkan Data
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {canManage && (
                <Button
                    onClick={handleOpenAdd}
                    className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-50 w-14 h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.3)] bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 p-0"
                >
                    <Plus className="w-6 h-6" />
                </Button>
            )}
        </>
    );
}

Olt.layout = {
    breadcrumbs: [
        {
            title: 'OLT',
            href: '/olt',
        },
    ],
};
