import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Search, Plus, MoreHorizontal, CheckCircle2, AlertTriangle, AlertCircle, Filter, Edit, Trash2, Server, Activity, Network, ChevronDown, Repeat, Wifi, Shield, Box, SignalLow, Unplug, WifiOff, PlusSquare, MinusSquare, Edit2, Eye, EyeOff, Cpu, Thermometer, CalendarClock, Info, Radio, Fingerprint, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TablePagination } from '@/components/ui/table-pagination';
import { Spinner } from '@/components/ui/spinner';

export default function Acs({ dataAcs = [] }: { dataAcs?: any[] }) {
    const { auth } = usePage().props;
    const canManage = ['SUPERADMIN', 'OWNER'].includes((auth?.user as any)?.role);
    
    const [acsData, setAcsData] = useState(dataAcs);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedAcs, setSelectedAcs] = useState<any>(null);
    const [activeDetailTab, setActiveDetailTab] = useState('umum');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittingDetail, setIsSubmittingDetail] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setAcsData(dataAcs);
    }, [dataAcs]);

    const [formData, setFormData] = useState({
        serialNumber: '',
        wanIp: '',
        pppoeUsername: '',
        profile: 'PPPoE Router',
        status: 'Online',
        uplink: '',
        ssid: '',
        wlanPassword: '',
        wan1PppInstances: [] as any[],
        wan1IpInstances: [] as any[],
        wan2PppInstances: [] as any[],
        vlanInstances: [{ id: 1, pppInterface: '1_TR069_INTERNET_R_VID_100', enable: true, vlanId: '' }],
        wlanInstances: [] as any[]
    });

    const handleOpenAdd = () => {
        setFormData({ 
            serialNumber: '', wanIp: '', pppoeUsername: '', profile: 'PPPoE Router', status: 'Online', uplink: '', ssid: '', wlanPassword: '',
            wan1PppInstances: [{ id: 1, enable: true, connName: '1_TR069_INTERNET_R_VID_100', connMode: 'IP_Routed', serviceList: 'TR069,INTERNET', username: '', password: '' }],
            wan1IpInstances: [], wan2PppInstances: [], vlanInstances: [{ id: 1, pppInterface: '1_TR069_INTERNET_R_VID_100', enable: true, vlanId: '' }],
            wlanInstances: [{ id: 1, enable: true, ssid: '', password: '', authType: 'WPA/WPA2-PSK', encryption: 'TKIP/AES', showPassword: false }]
        });
        setIsAddOpen(true);
    };

    const handleSummon = (id: string | number) => {
        router.post(`/acs/${id}/summon`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                alert('Berhasil mengirim perintah Summon Node ke perangkat.');
            }
        });
    };
    
    const handleOpenDetail = (acs: any) => {
        setSelectedAcs(acs);
        setFormData({
            serialNumber: acs.serialNumber || '',
            wanIp: acs.wanIp || '',
            pppoeUsername: acs.pppoeUsername || '',
            profile: acs.profile || 'PPPoE Router',
            status: acs.status || 'Online',
            uplink: acs.uplink || '',
            ssid: acs.ssid || '',
            wlanPassword: acs.wlanPassword || '',
            wan1PppInstances: [{ id: 1, enable: true, connName: '1_TR069_INTERNET_R_VID_100', connMode: 'IP_Routed', serviceList: 'TR069,INTERNET', username: acs.pppoeUsername || '', password: acs.pppoePassword !== '-' ? '********' : '' }],
            wan1IpInstances: [],
            wan2PppInstances: [],
            vlanInstances: [{ id: 1, pppInterface: '1_TR069_INTERNET_R_VID_100', enable: true, vlanId: acs.uplink || '' }],
            wlanInstances: [{ id: 1, enable: true, ssid: acs.ssid || '', password: acs.wlanPassword || '', authType: 'WPA/WPA2-PSK', encryption: 'TKIP/AES', showPassword: false }]
        });
        setActiveDetailTab('umum');
        setIsDetailOpen(true);
    };

    const handleOpenDelete = (acs: any) => {
        setSelectedAcs(acs);
        setIsDeleteOpen(true);
    };

    const handleSaveAdd = () => {
        if (!formData.serialNumber || !formData.pppoeUsername) return;
        setIsSubmitting(true);
        const newAcs = {
            id: `ACS-00${Math.floor(Math.random() * 9) + 4}`,
            serialNumber: formData.serialNumber.toUpperCase(),
            wanIp: formData.wanIp || 'Menunggu...',
            pppoeUsername: formData.pppoeUsername,
            profile: formData.profile,
            status: formData.status,
            uplink: formData.uplink,
            ssid: formData.ssid,
            wlanPassword: formData.wlanPassword,
            lastSync: 'Baru saja'
        };
        router.post('/acs', { ...newAcs, rawData: formData }, {
            onSuccess: () => {
                setAcsData([newAcs, ...acsData]);
                setIsAddOpen(false);
            },
            onFinish: () => setIsSubmitting(false)
        });
    };

    const handleSaveDetail = () => {
        if (!selectedAcs) return;
        setIsSubmittingDetail(true);
        const updatedAcs = {
            ...selectedAcs,
            serialNumber: formData.serialNumber.toUpperCase(),
            wanIp: formData.wanIp || 'Menunggu...',
            pppoeUsername: formData.pppoeUsername,
            profile: formData.profile,
            status: formData.status,
            uplink: formData.uplink,
            ssid: formData.ssid,
            wlanPassword: formData.wlanPassword,
            lastSync: 'Baru saja (Diedit)'
        };
        router.put(`/acs/${selectedAcs.id}`, { ...updatedAcs, rawData: formData }, {
            onSuccess: () => {
                setAcsData(acsData.map(a => a.id === selectedAcs.id ? updatedAcs : a));
                setIsDetailOpen(false);
            },
            onFinish: () => setIsSubmittingDetail(false)
        });
    };

    const handleConfirmDelete = () => {
        if (!selectedAcs) return;
        setIsDeleting(true);
        router.delete(`/acs/${selectedAcs.id}`, {
            onSuccess: () => {
                setAcsData(acsData.filter(a => a.id !== selectedAcs.id));
                setIsDeleteOpen(false);
            },
            onFinish: () => setIsDeleting(false)
        });
    };

    const filteredAcs = acsData.filter(a => 
        (a.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (a.wanIp?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.pppoeUsername?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const paginatedAcs = filteredAcs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <>
            <Head title="Auto Configuration Server (ACS)" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Auto Configuration Server</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Sistem TR-069 untuk provisioning modem / ONT pelanggan otomatis.</p>
                    </div>
                </div>
                
                {/* Horizontal Monitoring KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="p-5 flex flex-col gap-4 border-b-4 border-b-blue-500 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-none">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total ONU</span>
                                <span className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{acsData.length}</span>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <Box className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center">+12</span> bulan ini
                        </div>
                    </Card>

                    <Card className="p-5 flex flex-col gap-4 border-b-4 border-b-emerald-500 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-none">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">ONU Online</span>
                                <span className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{acsData.filter((a: any) => a.status === 'Online').length}</span>
                            </div>
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                <Wifi className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center">97.3%</span> Tingkat sukses
                        </div>
                    </Card>

                    <Card className="p-5 flex flex-col gap-4 border-b-4 border-b-neutral-400 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-none">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">ONU Offline</span>
                                <span className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{acsData.filter((a: any) => a.status !== 'Online').length}</span>
                            </div>
                            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                                <WifiOff className="w-6 h-6 text-neutral-500 dark:text-neutral-400" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                            Perlu tindakan teknisi
                        </div>
                    </Card>

                    <Card className="p-5 flex flex-col gap-4 border-b-4 border-b-red-500 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-none">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">RX Tinggi</span>
                                <span className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{acsData.filter((a: any) => parseFloat(a.rxPower) < -27).length}</span>
                            </div>
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                <Radio className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                            Redaman optik buruk
                        </div>
                    </Card>

                    <Card className="p-5 flex flex-col gap-4 border-b-4 border-b-rose-500 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-none">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">ACS Loss</span>
                                <span className="text-xl font-bold text-neutral-900 dark:text-white mt-1">5</span>
                            </div>
                            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                                <ServerCrash className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                            Gagal komunikasi TR-069
                        </div>
                    </Card>
                </div>
                
                <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-none overflow-hidden p-0 gap-0">
                    <div className="p-4 border-b border-sidebar-border/70 dark:border-sidebar-border flex flex-col sm:flex-row items-center justify-end gap-4 bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="relative w-full sm:max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                type="search"
                                placeholder="Cari Serial Number atau Username..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-neutral-950 pl-9 border-neutral-200 dark:border-neutral-800 shadow-none transition-all focus-visible:ring-blue-500"
                            />
                        </div>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 bg-white dark:bg-neutral-950">
                            <Repeat className="w-4 h-4 mr-2 text-neutral-500" /> Sync Semua Perangkat
                        </Button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-3.5 font-medium whitespace-nowrap">Serial Number</th>
                                    <th className="px-6 py-3.5 font-medium whitespace-nowrap">Perangkat</th>
                                    <th className="px-6 py-3.5 font-medium whitespace-nowrap">Firmware</th>
                                    <th className="px-6 py-3.5 font-medium whitespace-nowrap">WAN IP</th>
                                    <th className="px-6 py-3.5 font-medium whitespace-nowrap">Username PPPoE</th>
                                    <th className="px-6 py-3.5 font-medium whitespace-nowrap">RX Power</th>
                                    <th className="px-6 py-3.5 font-medium whitespace-nowrap">Status</th>
                                    <th className="px-6 py-3.5 font-medium text-center whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {paginatedAcs.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-neutral-500">
                                            Tidak ada data ACS Server.
                                        </td>
                                    </tr>
                                )}
                                {paginatedAcs.map((acs: any) => (
                                    <tr key={acs.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                                <Server className="w-4 h-4 text-neutral-400" /> {acs.serialNumber}
                                            </div>
                                            <div className="text-xs text-neutral-500 mt-1 pl-6">Profil: {acs.profile || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-neutral-900 dark:text-neutral-200">
                                                {acs.manufacturer || 'Unknown'}
                                            </div>
                                            <div className="text-[11px] text-neutral-500 font-mono mt-1">
                                                {acs.modelName || 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
                                                {acs.firmware || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-neutral-900 dark:text-neutral-200">
                                                {acs.wanIp}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                                                {acs.pppoeUsername}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold font-mono tracking-wider ${parseFloat(acs.rxPower) < -27 ? 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30'}`}>
                                                <Radio className="w-3 h-3" />
                                                <span>{acs.rxPower || '-'} dBm</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center w-fit gap-1.5 text-[11px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${acs.status === 'Online' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                                                    {acs.status === 'Online' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />} {acs.status}
                                                </span>
                                                <span className="text-[10px] text-neutral-500">{acs.lastSync}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Buka menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[200px]">
                                                    {canManage && (
                                                        <DropdownMenuItem className="cursor-pointer text-blue-600 focus:text-blue-700 focus:bg-blue-50 dark:focus:bg-blue-950/50">
                                                            <Repeat className="w-4 h-4 mr-2" /> Force Provisioning
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => handleOpenDetail(acs)} className="cursor-pointer">
                                                        <Activity className="w-4 h-4 mr-2 text-neutral-500" /> Detail & Konfigurasi
                                                    </DropdownMenuItem>
                                                    {canManage && (
                                                        <DropdownMenuItem onClick={() => handleOpenDelete(acs)} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
                                                            <Trash2 className="w-4 h-4 mr-2" /> Hapus ONT
                                                        </DropdownMenuItem>
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
                        totalItems={filteredAcs.length}
                        paginatedLength={paginatedAcs.length}
                        itemName="ACS Server"
                    />
                </Card>
            </div>

            {/* Detail & Edit Modal */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-5xl w-[95vw] border-sidebar-border/70 bg-white dark:bg-neutral-950 p-0 overflow-hidden shadow-2xl">
                    <div className="px-6 py-4 border-b border-sidebar-border/70 dark:border-sidebar-border bg-neutral-50/50 dark:bg-neutral-900/20 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white">Detail & Konfigurasi ONT</DialogTitle>
                            <DialogDescription className="text-sm text-neutral-500">
                                Informasi lengkap ditarik dari ACS Server dan dapat diubah.
                            </DialogDescription>
                        </div>
                    </div>
                    {selectedAcs && (
                        <div className="flex flex-col">
                            {/* Tabs Navigation */}
                            <div className="flex px-6 pt-4 space-x-6 border-b border-sidebar-border/70 dark:border-sidebar-border">
                                <button 
                                    className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeDetailTab === 'umum' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                                    onClick={() => setActiveDetailTab('umum')}
                                >
                                    Informasi Umum
                                </button>
                                <button 
                                    className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeDetailTab === 'jaringan' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                                    onClick={() => setActiveDetailTab('jaringan')}
                                >
                                    Parameter Jaringan
                                </button>
                                <button 
                                    className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeDetailTab === 'optik' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                                    onClick={() => setActiveDetailTab('optik')}
                                >
                                    Optik & WiFi
                                </button>
                            </div>

                            <div className="px-6 py-6 min-h-[300px] max-h-[50vh] overflow-y-auto">
                                {activeDetailTab === 'umum' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        
                                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                                            {/* Header Area with subtle gradient */}
                                            <div className="p-5 md:p-6 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-transparent dark:from-blue-900/10 dark:via-indigo-900/5 dark:to-transparent border-b border-neutral-100 dark:border-neutral-800/50">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="p-2.5 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-lg">
                                                        <Fingerprint className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Informasi Perangkat</h3>
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Identitas, spesifikasi, dan diagnostik kesehatan</p>
                                                    </div>
                                                </div>
                                                
                                                {/* Identity & Status */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white/60 dark:bg-neutral-950/50 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 shadow-sm">
                                                        <Label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">Serial Number</Label>
                                                        <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-1">{selectedAcs.serialNumber || '-'}</div>
                                                    </div>
                                                    <div className="bg-white/60 dark:bg-neutral-950/50 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 shadow-sm">
                                                        <Label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">Status Perangkat</Label>
                                                        <div className="mt-1">
                                                            {selectedAcs.status === 'Online' ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                                    Online
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                                                    Offline
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Body Area */}
                                            <div className="p-5 md:p-6 space-y-8">
                                                
                                                {/* Specs & Diagnostics Section */}
                                                <div>
                                                    <h4 className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <Server className="w-3.5 h-3.5" /> Spesifikasi & Diagnostik
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-neutral-50/50 dark:bg-neutral-900/30 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800/80 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/50">
                                                            <Label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Box className="w-3 h-3 text-indigo-400" /> Merek</Label>
                                                            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate mt-1">{selectedAcs.manufacturer || '-'}</div>
                                                        </div>
                                                        <div className="bg-neutral-50/50 dark:bg-neutral-900/30 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800/80 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/50">
                                                            <Label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Cpu className="w-3 h-3 text-indigo-400" /> Tipe / Model</Label>
                                                            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate mt-1">{selectedAcs.modelName || '-'}</div>
                                                        </div>
                                                        <div className="bg-neutral-50/50 dark:bg-neutral-900/30 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800/80 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/50">
                                                            <Label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Activity className="w-3 h-3 text-indigo-400" /> Firmware</Label>
                                                            <div className="text-sm font-mono text-neutral-900 dark:text-neutral-100 truncate mt-1">{selectedAcs.firmware || '-'}</div>
                                                        </div>
                                                        <div className="bg-neutral-50/50 dark:bg-neutral-900/30 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800/80 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/50">
                                                            <Label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><CalendarClock className="w-3 h-3 text-indigo-400" /> Waktu Sinkronisasi</Label>
                                                            <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 truncate mt-1.5">{selectedAcs.lastSync}</div>
                                                        </div>
                                                        <div className={`p-3 rounded-lg border ${parseFloat(selectedAcs.rxPower) < -27 ? 'bg-red-50/30 border-red-200 dark:bg-red-900/10 dark:border-red-900/50' : 'bg-emerald-50/30 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/50'} transition-colors hover:shadow-sm`}>
                                                            <Label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Radio className={`w-3 h-3 ${parseFloat(selectedAcs.rxPower) < -27 ? 'text-red-500' : 'text-emerald-500'}`} /> RX Power</Label>
                                                            <div className={`text-sm font-bold truncate mt-1 ${parseFloat(selectedAcs.rxPower) < -27 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                                {selectedAcs.rxPower} <span className="text-[10px] font-medium opacity-60 font-normal">dBm</span>
                                                            </div>
                                                        </div>
                                                        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/30 dark:bg-amber-900/10 dark:border-amber-900/50 transition-colors hover:shadow-sm">
                                                            <Label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Thermometer className="w-3 h-3 text-amber-500" /> Suhu</Label>
                                                            <div className="text-sm font-bold text-amber-600 dark:text-amber-500 truncate mt-1">
                                                                {selectedAcs.temperature} <span className="text-[10px] font-medium opacity-60 font-normal">°C</span>
                                                            </div>
                                                        </div>
                                                        <div className="bg-neutral-50/50 dark:bg-neutral-900/30 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800/80 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/50 col-span-2">
                                                            <Label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Info className="w-3 h-3 text-neutral-500" /> PON MAC</Label>
                                                            <div className="text-sm font-mono font-bold text-neutral-800 dark:text-neutral-200 mt-1">
                                                                {selectedAcs.ponMac || '-'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                        
                                    </div>
                                )}

                                {activeDetailTab === 'jaringan' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-4 px-1 w-full">
                                        
                                        {/* WAN 1 PPP Section */}
                                        <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden shadow-sm">
                                            <div className="flex justify-between items-center px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                                                <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                                                    <Network className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    WAN 1 PPP (Internet)
                                                </h3>
                                                <Button variant="outline" size="sm" onClick={() => handleSummon(selectedAcs.id)} className="h-7 text-xs px-3 shadow-none">Summon Node</Button>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead>
                                                        <tr className="text-neutral-500 dark:text-neutral-400 font-medium bg-neutral-50/50 dark:bg-neutral-900/20 border-b border-neutral-200 dark:border-neutral-800">
                                                            <th className="px-4 py-2 font-medium">Enable</th>
                                                            <th className="px-4 py-2 font-medium">Conn Name</th>
                                                            <th className="px-4 py-2 font-medium">Conn Mode</th>
                                                            <th className="px-4 py-2 font-medium">Service List</th>
                                                            <th className="px-4 py-2 font-medium">Username</th>
                                                            <th className="px-4 py-2 font-medium">Password</th>
                                                            <th className="px-4 py-2 font-medium text-right">Aksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                        {formData.wan1PppInstances.map((inst, idx) => (
                                                            <tr key={inst.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                                                                <td className="px-4 py-2 align-middle">
                                                                    <span onClick={() => {
                                                                        const newArr = [...formData.wan1PppInstances];
                                                                        newArr[idx].enable = !newArr[idx].enable;
                                                                        setFormData({...formData, wan1PppInstances: newArr});
                                                                    }} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium cursor-pointer ${inst.enable ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                                                                        {inst.enable ? <><CheckCircle2 className="w-3 h-3" /> true</> : 'false'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2 align-middle font-mono text-xs text-neutral-600 dark:text-neutral-300">
                                                                    <Input 
                                                                        value={inst.connName}
                                                                        onChange={e => {
                                                                            const newArr = [...formData.wan1PppInstances];
                                                                            newArr[idx].connName = e.target.value;
                                                                            setFormData({...formData, wan1PppInstances: newArr});
                                                                        }}
                                                                        className="h-8 text-xs bg-transparent border-neutral-200 dark:border-neutral-800 focus-visible:ring-1 w-32 font-mono"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2 align-middle text-neutral-600 dark:text-neutral-300">
                                                                    <Input 
                                                                        value={inst.connMode}
                                                                        onChange={e => {
                                                                            const newArr = [...formData.wan1PppInstances];
                                                                            newArr[idx].connMode = e.target.value;
                                                                            setFormData({...formData, wan1PppInstances: newArr});
                                                                        }}
                                                                        className="h-8 text-xs bg-transparent border-neutral-200 dark:border-neutral-800 focus-visible:ring-1 w-24"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2 align-middle">
                                                                    <Input 
                                                                        value={inst.serviceList}
                                                                        onChange={e => {
                                                                            const newArr = [...formData.wan1PppInstances];
                                                                            newArr[idx].serviceList = e.target.value;
                                                                            setFormData({...formData, wan1PppInstances: newArr});
                                                                        }}
                                                                        className="h-8 text-xs bg-transparent border-neutral-200 dark:border-neutral-800 focus-visible:ring-1 w-28 text-blue-600 dark:text-blue-400 font-medium"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2 align-middle">
                                                                    <Input 
                                                                        value={idx === 0 ? formData.pppoeUsername : inst.username}
                                                                        onChange={e => {
                                                                            const newArr = [...formData.wan1PppInstances];
                                                                            newArr[idx].username = e.target.value;
                                                                            if(idx === 0) setFormData({...formData, wan1PppInstances: newArr, pppoeUsername: e.target.value});
                                                                            else setFormData({...formData, wan1PppInstances: newArr});
                                                                        }}
                                                                        className="h-8 text-xs bg-transparent border-neutral-200 dark:border-neutral-800 focus-visible:ring-1 w-32"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2 align-middle">
                                                                    <Input 
                                                                        value={inst.password}
                                                                        onChange={e => {
                                                                            const newArr = [...formData.wan1PppInstances];
                                                                            newArr[idx].password = e.target.value;
                                                                            setFormData({...formData, wan1PppInstances: newArr});
                                                                        }}
                                                                        type="password"
                                                                        className="h-8 text-xs bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-800 w-24 text-neutral-500"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2 align-middle text-right">
                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                        <Button variant="ghost" size="icon" onClick={() => setFormData({...formData, wan1PppInstances: formData.wan1PppInstances.filter(i => i.id !== inst.id)})} className="h-7 w-7 text-neutral-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        <tr>
                                                            <td colSpan={8} className="px-4 py-2 text-center">
                                                                <Button variant="link" size="sm" onClick={() => setFormData({...formData, wan1PppInstances: [...formData.wan1PppInstances, { id: Date.now(), enable: true, connName: '', connMode: 'IP_Routed', serviceList: '', ip: '', username: '', password: '' }]})} className="h-7 text-xs text-blue-600 dark:text-blue-400 p-0">
                                                                    <Plus className="w-3 h-3 mr-1" /> Add WAN 1 PPP Instance
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* WAN 1 IP / WAN 2 IP Sections */}
                                        <div className="grid grid-cols-2 gap-6 w-full">
                                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden shadow-sm">
                                                <div className="flex justify-between items-center px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                                                    <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">WAN 1 IP</h3>
                                                    <Button variant="outline" size="sm" onClick={() => handleSummon(selectedAcs.id)} className="h-7 text-xs px-3 shadow-none">Summon Node</Button>
                                                </div>
                                                {formData.wan1IpInstances.length === 0 ? (
                                                    <div className="p-6 text-center">
                                                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-2">
                                                            <Box className="w-5 h-5 text-neutral-400" />
                                                        </div>
                                                        <p className="text-sm text-neutral-500 dark:text-neutral-400">No instances found</p>
                                                        <Button variant="link" size="sm" onClick={() => setFormData({...formData, wan1IpInstances: [...formData.wan1IpInstances, { id: Date.now(), ip: '', subnet: '', gateway: '' }]})} className="h-7 text-xs text-blue-600 dark:text-blue-400 p-0 mt-1">
                                                            <Plus className="w-3 h-3 mr-1" /> Add Instance
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm text-left">
                                                            <thead>
                                                                <tr className="text-neutral-500 dark:text-neutral-400 font-medium bg-neutral-50/50 dark:bg-neutral-900/20 border-b border-neutral-200 dark:border-neutral-800">
                                                                    <th className="px-4 py-2 font-medium">IP Address</th>
                                                                    <th className="px-4 py-2 font-medium">Subnet Mask</th>
                                                                    <th className="px-4 py-2 font-medium">Gateway</th>
                                                                    <th className="px-4 py-2 font-medium text-right">Aksi</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                                {formData.wan1IpInstances.map((inst, idx) => (
                                                                    <tr key={inst.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                                                                        <td className="px-4 py-2 align-middle">
                                                                            <Input 
                                                                                value={inst.ip}
                                                                                onChange={e => {
                                                                                    const newArr = [...formData.wan1IpInstances];
                                                                                    newArr[idx].ip = e.target.value;
                                                                                    setFormData({...formData, wan1IpInstances: newArr});
                                                                                }}
                                                                                placeholder="192.168.x.x"
                                                                                className="h-8 text-xs bg-transparent border-neutral-200 dark:border-neutral-800 focus-visible:ring-1 w-28"
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-2 align-middle">
                                                                            <Input 
                                                                                value={inst.subnet}
                                                                                onChange={e => {
                                                                                    const newArr = [...formData.wan1IpInstances];
                                                                                    newArr[idx].subnet = e.target.value;
                                                                                    setFormData({...formData, wan1IpInstances: newArr});
                                                                                }}
                                                                                placeholder="255.255.255.0"
                                                                                className="h-8 text-xs bg-transparent border-neutral-200 dark:border-neutral-800 focus-visible:ring-1 w-28"
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-2 align-middle">
                                                                            <Input 
                                                                                value={inst.gateway}
                                                                                onChange={e => {
                                                                                    const newArr = [...formData.wan1IpInstances];
                                                                                    newArr[idx].gateway = e.target.value;
                                                                                    setFormData({...formData, wan1IpInstances: newArr});
                                                                                }}
                                                                                placeholder="192.168.x.1"
                                                                                className="h-8 text-xs bg-transparent border-neutral-200 dark:border-neutral-800 focus-visible:ring-1 w-28"
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-2 align-middle text-right">
                                                                            <Button variant="ghost" size="icon" onClick={() => setFormData({...formData, wan1IpInstances: formData.wan1IpInstances.filter(i => i.id !== inst.id)})} className="h-7 w-7 text-neutral-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                <tr>
                                                                    <td colSpan={4} className="px-4 py-2 text-center">
                                                                        <Button variant="link" size="sm" onClick={() => setFormData({...formData, wan1IpInstances: [...formData.wan1IpInstances, { id: Date.now(), ip: '', subnet: '', gateway: '' }]})} className="h-7 text-xs text-blue-600 dark:text-blue-400 p-0">
                                                                            <Plus className="w-3 h-3 mr-1" /> Add Instance
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden shadow-sm">
                                                <div className="flex justify-between items-center px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                                                    <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">WAN 2 PPP</h3>
                                                    <Button variant="outline" size="sm" onClick={() => handleSummon(selectedAcs.id)} className="h-7 text-xs px-3 shadow-none">Summon Node</Button>
                                                </div>
                                                {formData.wan2PppInstances.length === 0 ? (
                                                    <div className="p-6 text-center">
                                                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-2">
                                                            <Box className="w-5 h-5 text-neutral-400" />
                                                        </div>
                                                        <p className="text-sm text-neutral-500 dark:text-neutral-400">No instances found</p>
                                                        <Button variant="link" size="sm" onClick={() => setFormData({...formData, wan2PppInstances: [...formData.wan2PppInstances, { id: Date.now(), username: '', password: '' }]})} className="h-7 text-xs text-blue-600 dark:text-blue-400 p-0 mt-1">
                                                            <Plus className="w-3 h-3 mr-1" /> Add Instance
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm text-left">
                                                            <thead>
                                                                <tr className="text-neutral-500 dark:text-neutral-400 font-medium bg-neutral-50/50 dark:bg-neutral-900/20 border-b border-neutral-200 dark:border-neutral-800">
                                                                    <th className="px-4 py-2 font-medium">Username</th>
                                                                    <th className="px-4 py-2 font-medium">Password</th>
                                                                    <th className="px-4 py-2 font-medium text-right">Aksi</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                                {formData.wan2PppInstances.map((inst, idx) => (
                                                                    <tr key={inst.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                                                                        <td className="px-4 py-2 align-middle">
                                                                            <Input 
                                                                                value={inst.username}
                                                                                onChange={e => {
                                                                                    const newArr = [...formData.wan2PppInstances];
                                                                                    newArr[idx].username = e.target.value;
                                                                                    setFormData({...formData, wan2PppInstances: newArr});
                                                                                }}
                                                                                placeholder="username@isp"
                                                                                className="h-8 text-xs bg-transparent border-neutral-200 dark:border-neutral-800 focus-visible:ring-1 w-32"
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-2 align-middle">
                                                                            <Input 
                                                                                value={inst.password}
                                                                                onChange={e => {
                                                                                    const newArr = [...formData.wan2PppInstances];
                                                                                    newArr[idx].password = e.target.value;
                                                                                    setFormData({...formData, wan2PppInstances: newArr});
                                                                                }}
                                                                                placeholder="***"
                                                                                type="password"
                                                                                className="h-8 text-xs bg-transparent border-neutral-200 dark:border-neutral-800 focus-visible:ring-1 w-24"
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-2 align-middle text-right">
                                                                            <Button variant="ghost" size="icon" onClick={() => setFormData({...formData, wan2PppInstances: formData.wan2PppInstances.filter(i => i.id !== inst.id)})} className="h-7 w-7 text-neutral-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                <tr>
                                                                    <td colSpan={3} className="px-4 py-2 text-center">
                                                                        <Button variant="link" size="sm" onClick={() => setFormData({...formData, wan2PppInstances: [...formData.wan2PppInstances, { id: Date.now(), username: '', password: '' }]})} className="h-7 text-xs text-blue-600 dark:text-blue-400 p-0">
                                                                            <Plus className="w-3 h-3 mr-1" /> Add Instance
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* VLAN WAN Section */}
                                        <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden shadow-sm">
                                            <div className="flex justify-between items-center px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                                                <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                                                    <Network className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    VLAN WAN Configuration
                                                </h3>
                                                <Button variant="outline" size="sm" onClick={() => handleSummon(selectedAcs.id)} className="h-7 text-xs px-3 shadow-none">Summon Node</Button>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead>
                                                        <tr className="text-neutral-500 dark:text-neutral-400 font-medium bg-neutral-50/50 dark:bg-neutral-900/20 border-b border-neutral-200 dark:border-neutral-800">
                                                            <th className="px-4 py-2 font-medium">WAN PPP Interface</th>
                                                            <th className="px-4 py-2 font-medium">VLAN Enable</th>
                                                            <th className="px-4 py-2 font-medium">VLAN ID</th>
                                                            <th className="px-4 py-2 font-medium text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                        {formData.vlanInstances.map((inst, idx) => (
                                                            <tr key={inst.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                                                                <td className="px-4 py-2 align-middle font-mono text-xs text-neutral-600 dark:text-neutral-300">
                                                                    <Input 
                                                                        value={inst.pppInterface}
                                                                        onChange={e => {
                                                                            const newArr = [...formData.vlanInstances];
                                                                            newArr[idx].pppInterface = e.target.value;
                                                                            setFormData({...formData, vlanInstances: newArr});
                                                                        }}
                                                                        className="h-8 text-xs bg-transparent border-neutral-200 dark:border-neutral-800 focus-visible:ring-1 w-48 font-mono"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2 align-middle">
                                                                    <span onClick={() => {
                                                                        const newArr = [...formData.vlanInstances];
                                                                        newArr[idx].enable = !newArr[idx].enable;
                                                                        setFormData({...formData, vlanInstances: newArr});
                                                                    }} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium cursor-pointer ${inst.enable ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                                                                        {inst.enable ? <><CheckCircle2 className="w-3 h-3" /> true</> : 'false'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2 align-middle">
                                                                    <Input 
                                                                        value={idx === 0 ? formData.uplink : inst.vlanId}
                                                                        onChange={e => {
                                                                            const newArr = [...formData.vlanInstances];
                                                                            newArr[idx].vlanId = e.target.value;
                                                                            if(idx === 0) setFormData({...formData, vlanInstances: newArr, uplink: e.target.value});
                                                                            else setFormData({...formData, vlanInstances: newArr});
                                                                        }}
                                                                        placeholder="VLAN ID"
                                                                        className="h-8 text-xs bg-transparent border-neutral-200 dark:border-neutral-800 focus-visible:ring-1 w-24"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2 align-middle text-right">
                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                        <Button variant="ghost" size="icon" onClick={() => setFormData({...formData, vlanInstances: formData.vlanInstances.filter(i => i.id !== inst.id)})} className="h-7 w-7 text-neutral-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        <tr>
                                                            <td colSpan={4} className="px-4 py-2 text-center">
                                                                <Button variant="link" size="sm" onClick={() => setFormData({...formData, vlanInstances: [...formData.vlanInstances, { id: Date.now(), pppInterface: '', enable: true, vlanId: '' }]})} className="h-7 text-xs text-blue-600 dark:text-blue-400 p-0">
                                                                    <Plus className="w-3 h-3 mr-1" /> Add VLAN Instance
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                    </div>
                                )}

                                {activeDetailTab === 'optik' && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {/* WLAN Section */}
                                        <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden shadow-sm">
                                            <div className="flex justify-between items-center px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                                                <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                                                    <Wifi className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    WLAN (WiFi) Configuration
                                                </h3>
                                                <Button variant="outline" size="sm" onClick={() => handleSummon(selectedAcs.id)} className="h-7 text-xs px-3 shadow-none">Summon Node</Button>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead>
                                                        <tr className="text-neutral-500 dark:text-neutral-400 font-medium bg-neutral-50/50 dark:bg-neutral-900/20 border-b border-neutral-200 dark:border-neutral-800">
                                                            <th className="px-4 py-2 font-medium">Enable</th>
                                                            <th className="px-4 py-2 font-medium">SSID Name</th>
                                                            <th className="px-4 py-2 font-medium">Password</th>
                                                            <th className="px-4 py-2 font-medium">Auth Type</th>
                                                            <th className="px-4 py-2 font-medium">Encryption</th>
                                                            <th className="px-4 py-2 font-medium text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                        {formData.wlanInstances.map((inst, idx) => (
                                                            <tr key={inst.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                                                                <td className="px-4 py-2 align-middle">
                                                                    <span onClick={() => {
                                                                        const newArr = [...formData.wlanInstances];
                                                                        newArr[idx].enable = !newArr[idx].enable;
                                                                        setFormData({...formData, wlanInstances: newArr});
                                                                    }} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium cursor-pointer ${inst.enable ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                                                                        {inst.enable ? <><CheckCircle2 className="w-3 h-3" /> true</> : 'false'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2 align-middle">
                                                                    <Input 
                                                                        value={idx === 0 ? formData.ssid : inst.ssid}
                                                                        onChange={e => {
                                                                            const newArr = [...formData.wlanInstances];
                                                                            newArr[idx].ssid = e.target.value;
                                                                            if(idx === 0) setFormData({...formData, wlanInstances: newArr, ssid: e.target.value});
                                                                            else setFormData({...formData, wlanInstances: newArr});
                                                                        }}
                                                                        className="h-8 text-xs bg-transparent border-neutral-200 dark:border-neutral-800 focus-visible:ring-1 w-40"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2 align-middle relative group">
                                                                    <div className="relative">
                                                                        <Input 
                                                                            type={inst.showPassword ? "text" : "password"}
                                                                            value={idx === 0 ? formData.wlanPassword : inst.password}
                                                                            onChange={e => {
                                                                                const newArr = [...formData.wlanInstances];
                                                                                newArr[idx].password = e.target.value;
                                                                                if(idx === 0) setFormData({...formData, wlanInstances: newArr, wlanPassword: e.target.value});
                                                                                else setFormData({...formData, wlanInstances: newArr});
                                                                            }}
                                                                            className="h-8 text-xs bg-transparent border-neutral-200 dark:border-neutral-800 focus-visible:ring-1 w-32 pr-8"
                                                                        />
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newArr = [...formData.wlanInstances];
                                                                                newArr[idx].showPassword = !newArr[idx].showPassword;
                                                                                setFormData({...formData, wlanInstances: newArr});
                                                                            }}
                                                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                                                        >
                                                                            {inst.showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 align-middle">
                                                                    <select 
                                                                        value={inst.authType}
                                                                        onChange={e => {
                                                                            const newArr = [...formData.wlanInstances];
                                                                            newArr[idx].authType = e.target.value;
                                                                            setFormData({...formData, wlanInstances: newArr});
                                                                        }}
                                                                        className="h-8 text-xs bg-transparent border border-neutral-200 dark:border-neutral-800 rounded px-2 w-32 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                    >
                                                                        <option value="None">None</option>
                                                                        <option value="WEP">WEP</option>
                                                                        <option value="WPA-PSK">WPA-PSK</option>
                                                                        <option value="WPA2-PSK">WPA2-PSK</option>
                                                                        <option value="WPA/WPA2-PSK">WPA/WPA2-PSK</option>
                                                                        <option value="WPA3-SAE">WPA3-SAE</option>
                                                                    </select>
                                                                </td>
                                                                <td className="px-4 py-2 align-middle">
                                                                    <select 
                                                                        value={inst.encryption}
                                                                        onChange={e => {
                                                                            const newArr = [...formData.wlanInstances];
                                                                            newArr[idx].encryption = e.target.value;
                                                                            setFormData({...formData, wlanInstances: newArr});
                                                                        }}
                                                                        className="h-8 text-xs bg-transparent border border-neutral-200 dark:border-neutral-800 rounded px-2 w-28 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                    >
                                                                        <option value="None">None</option>
                                                                        <option value="TKIP">TKIP</option>
                                                                        <option value="AES">AES</option>
                                                                        <option value="TKIP/AES">TKIP/AES</option>
                                                                    </select>
                                                                </td>
                                                                <td className="px-4 py-2 align-middle text-right">
                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                        <Button variant="ghost" size="icon" onClick={() => setFormData({...formData, wlanInstances: formData.wlanInstances.filter(i => i.id !== inst.id)})} className="h-7 w-7 text-neutral-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        <tr>
                                                            <td colSpan={6} className="px-4 py-2 text-center">
                                                                <Button variant="link" size="sm" onClick={() => setFormData({...formData, wlanInstances: [...formData.wlanInstances, { id: Date.now(), enable: true, ssid: '', password: '', authType: 'WPA/WPA2-PSK', encryption: 'TKIP/AES', showPassword: false }]})} className="h-7 text-xs text-blue-600 dark:text-blue-400 p-0">
                                                                    <Plus className="w-3 h-3 mr-1" /> Add WLAN Instance
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs text-neutral-500 uppercase tracking-wider mb-1 block">PON MAC</Label>
                                                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-200 font-mono">{selectedAcs.ponMac}</div>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-neutral-500 uppercase tracking-wider mb-1 block">Perangkat Aktif (Client)</Label>
                                                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-200">{selectedAcs.activeDevices} Perangkat</div>
                                            </div>
                                        </div>

                                        {/* Perangkat Terhubung (Hosts) */}
                                        <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden shadow-sm mt-5">
                                            <div className="flex justify-between items-center px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                                                <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                                                    <SignalLow className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                    Daftar Perangkat Terhubung ({selectedAcs.activeDevices})
                                                </h3>
                                                <Button variant="outline" size="sm" onClick={() => handleSummon(selectedAcs.id)} className="h-7 text-xs px-3 shadow-none">Summon Node</Button>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead>
                                                        <tr className="text-neutral-500 dark:text-neutral-400 font-medium bg-neutral-50/50 dark:bg-neutral-900/20 border-b border-neutral-200 dark:border-neutral-800">
                                                            <th className="px-4 py-2 font-medium">Hostname</th>
                                                            <th className="px-4 py-2 font-medium">IP Address</th>
                                                            <th className="px-4 py-2 font-medium">MAC Address</th>
                                                            <th className="px-4 py-2 font-medium">Tipe Koneksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                        {(!selectedAcs.hosts || selectedAcs.hosts.length === 0) ? (
                                                            <tr>
                                                                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500 dark:text-neutral-400 text-sm">
                                                                    Data perangkat (Host) belum tersedia dari server ACS.<br/>
                                                                    Coba klik <b>Summon Node</b> untuk memperbarui.
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            selectedAcs.hosts.map((host: any, idx: number) => (
                                                                <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                                                                    <td className="px-4 py-2 align-middle font-medium text-neutral-900 dark:text-neutral-100">{host.hostname || 'Unknown'}</td>
                                                                    <td className="px-4 py-2 align-middle">{host.ipAddress || '-'}</td>
                                                                    <td className="px-4 py-2 align-middle font-mono text-xs text-neutral-600 dark:text-neutral-400">{host.macAddress || '-'}</td>
                                                                    <td className="px-4 py-2 align-middle">
                                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                                            {host.interfaceType || 'WiFi'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="px-6 py-4 border-t border-sidebar-border/70 dark:border-sidebar-border bg-neutral-50/50 dark:bg-neutral-900/20 sm:justify-between items-center flex-row">
                        <Button type="button" variant="outline" onClick={() => setIsDetailOpen(false)} className="h-9 text-sm font-medium transition-colors">
                            Tutup
                        </Button>
                        {canManage && (
                            <Button type="button" onClick={handleSaveDetail} disabled={isSubmittingDetail} className="h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm min-w-[140px]">
                                {isSubmittingDetail && <Spinner className="w-4 h-4 mr-2" />}
                                {isSubmittingDetail ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[425px] border-sidebar-border/70 bg-white dark:bg-neutral-950 p-0 overflow-hidden shadow-2xl">
                    <div className="px-6 py-4 border-b border-sidebar-border/70 dark:border-sidebar-border bg-neutral-50/50 dark:bg-neutral-900/20 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-white">Tambah ONT Baru</DialogTitle>
                            <DialogDescription className="text-sm text-neutral-500">
                                Masukkan detail ONT secara manual jika tidak terdeteksi otomatis.
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="px-6 py-6 max-h-[60vh] overflow-y-auto space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="serialNumber" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Serial Number <span className="text-red-500">*</span></Label>
                            <Input 
                                id="serialNumber" 
                                placeholder="Contoh: ZTEGC1234567" 
                                value={formData.serialNumber}
                                onChange={e => setFormData({...formData, serialNumber: e.target.value.toUpperCase()})}
                                className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pppoeUsername" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Username PPPoE <span className="text-red-500">*</span></Label>
                            <Input 
                                id="pppoeUsername" 
                                placeholder="Contoh: user123@isp" 
                                value={formData.pppoeUsername}
                                onChange={e => setFormData({...formData, pppoeUsername: e.target.value})}
                                className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="profile" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Profil Provisioning</Label>
                            <div className="relative">
                                <select 
                                    id="profile" 
                                    value={formData.profile}
                                    onChange={e => setFormData({...formData, profile: e.target.value})}
                                    className="appearance-none w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="PPPoE Router">PPPoE Router</option>
                                    <option value="Bridge Mode">Bridge Mode</option>
                                    <option value="IP Static">IP Static</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-neutral-500 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="uplink" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Uplink VLAN ID (Opsional)</Label>
                            <Input 
                                id="uplink" 
                                placeholder="Contoh: 100" 
                                value={formData.uplink}
                                onChange={e => setFormData({...formData, uplink: e.target.value})}
                                className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ssid" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Nama WiFi (SSID)</Label>
                                <Input 
                                    id="ssid" 
                                    placeholder="WIFI Pelanggan" 
                                    value={formData.ssid}
                                    onChange={e => setFormData({...formData, ssid: e.target.value})}
                                    className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="wlanPassword" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Password WiFi</Label>
                                <Input 
                                    id="wlanPassword" 
                                    placeholder="Minimal 8 karakter" 
                                    value={formData.wlanPassword}
                                    onChange={e => setFormData({...formData, wlanPassword: e.target.value})}
                                    className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="wanIp" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Static WAN IP (Opsional)</Label>
                            <Input 
                                id="wanIp" 
                                placeholder="Biarkan kosong untuk dinamis" 
                                value={formData.wanIp}
                                onChange={e => setFormData({...formData, wanIp: e.target.value})}
                                className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500"
                            />
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t border-sidebar-border/70 dark:border-sidebar-border bg-neutral-50/50 dark:bg-neutral-900/20">
                        <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="w-full sm:w-auto h-9 text-sm font-medium transition-colors">
                            Batal
                        </Button>
                        <Button type="button" onClick={handleSaveAdd} disabled={isSubmitting} className="w-full sm:w-auto h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm min-w-[140px]">
                            {isSubmitting && <Spinner className="w-4 h-4 mr-2" />}
                            {isSubmitting ? 'Menyimpan...' : 'Tambah Konfigurasi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-sm border-sidebar-border/70">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" /> Hapus Konfigurasi ONT
                        </DialogTitle>
                        <DialogDescription className="mt-2">
                            Hapus konfigurasi ACS untuk SN <strong>{selectedAcs?.serialNumber}</strong>? Modem ini mungkin akan di-reset ke pengaturan pabrik.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 sm:justify-end gap-2">
                        <Button variant="outline" className="bg-white dark:bg-neutral-950" onClick={() => setIsDeleteOpen(false)}>Batal</Button>
                        <Button onClick={handleConfirmDelete} disabled={isDeleting} variant="destructive">
                            {isDeleting && <Spinner className="w-4 h-4 mr-2" />}
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Konfigurasi'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

Acs.layout = {
    breadcrumbs: [
        {
            title: 'Auto Config Server (ACS)',
            href: '/acs',
        },
    ],
};
