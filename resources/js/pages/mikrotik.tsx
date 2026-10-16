import { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { 
    Router, Server, Activity, ChevronDown, CheckCircle2, 
    XCircle, Cpu, HardDrive, Clock, Users, ArrowUp, ArrowDown, Network, UserCheck, UserX, Search, Plus, Loader2, RefreshCw, Edit, Trash, AlertTriangle, Package, Key
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';

export default function Mikrotik({ dataMikrotik = [] }: { dataMikrotik?: any[] }) {
    const { auth } = usePage().props as any;
    const canManage = ['SUPERADMIN', 'OWNER'].includes(auth?.user?.role);

    // State untuk Monitoring
    const [selectedRouter, setSelectedRouter] = useState(dataMikrotik.length > 0 ? dataMikrotik[0].id : '');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    
    
    // State untuk Modal Terpisah
    const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
    const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
    const [isUnsyncedModalOpen, setIsUnsyncedModalOpen] = useState(false);
    
    // State Pencarian Terpisah
    const [onlineSearch, setOnlineSearch] = useState('');
    const [offlineSearch, setOfflineSearch] = useState('');
    const [disabledSearch, setDisabledSearch] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    
    const [currentPageOnline, setCurrentPageOnline] = useState(1);
    const [itemsPerPageOnline, setItemsPerPageOnline] = useState(10);
    
    const [currentPageOffline, setCurrentPageOffline] = useState(1);
    const [itemsPerPageOffline, setItemsPerPageOffline] = useState(10);
    
    const [currentPageDisabled, setCurrentPageDisabled] = useState(1);
    const [itemsPerPageDisabled, setItemsPerPageDisabled] = useState(10);
    
    const [currentPageUnsynced, setCurrentPageUnsynced] = useState(1);
    const [itemsPerPageUnsynced, setItemsPerPageUnsynced] = useState(10);
    const [unsyncedSearch, setUnsyncedSearch] = useState('');

    const [isDisabledModalOpen, setIsDisabledModalOpen] = useState(false);

    // Live Data State
    const [liveData, setLiveData] = useState<{
        identity?: string,
        systemResource: any,
        interfaces: any[],
        pppActive: any[],
        hotspotActive: any[],
        pppDisabled: any[],
        pppOffline: any[],
        hotspotDisabled: any[],
        unsyncedPppoe: any[]
    } | null>(null);
    const [isLoadingLive, setIsLoadingLive] = useState(false);
    
    // Fix hydration issues by delaying live data rendering until mounted
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);
    const [liveError, setLiveError] = useState<string | null>(null);

    // Traffic Speed States
    const prevStatsRef = useRef<{ [name: string]: { rx: number, tx: number, time: number } }>({});
    const [trafficSpeed, setTrafficSpeed] = useState<{ [name: string]: { rxSpeed: number, txSpeed: number } }>({});

    // Fetch live data
    useEffect(() => {
        if (!selectedRouter) return;
        
        let isMounted = true;
        const fetchLiveData = async () => {
            setIsLoadingLive(true);
            setLiveError(null);
            try {
                const getXsrfToken = () => {
                    const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
                    return match ? decodeURIComponent(match[2]) : '';
                };

                const res = await fetch(`/mikrotik/${selectedRouter}/live-data`, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': getXsrfToken()
                    }
                });
                const data = await res.json();
                if (isMounted) {
                    if (data.success) {
                        setLiveData(data);
                    } else {
                        setLiveError(data.message || 'Gagal mengambil data dari Mikrotik.');
                        setLiveData(null);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setLiveError('Kesalahan jaringan saat menghubungi server.');
                    setLiveData(null);
                }
            } finally {
                if (isMounted) setIsLoadingLive(false);
            }
        };

        fetchLiveData();
        const intervalId = setInterval(fetchLiveData, 10000); // refresh every 10s
        return () => { 
            isMounted = false; 
            clearInterval(intervalId); 
            prevStatsRef.current = {}; 
        };
    }, [selectedRouter, refreshTrigger]);

    // Calculate Traffic Speed
    useEffect(() => {
        if (liveData && liveData.interfaces) {
            const now = Date.now();
            const newSpeeds: any = { ...trafficSpeed };
            const newStats: any = {};
            
            liveData.interfaces.forEach((iface: any) => {
                if (iface.type && iface.type.includes('pppoe')) return; // Skip speed calc for pppoe

                const currentRx = parseInt(iface['rx-byte'] || 0);
                const currentTx = parseInt(iface['tx-byte'] || 0);
                
                if (prevStatsRef.current[iface.name]) {
                    const prev = prevStatsRef.current[iface.name];
                    const timeDiff = (now - prev.time) / 1000;
                    if (timeDiff > 0) {
                        let rxSpeed = ((currentRx - prev.rx) * 8) / timeDiff;
                        let txSpeed = ((currentTx - prev.tx) * 8) / timeDiff;
                        if (rxSpeed < 0) rxSpeed = 0;
                        if (txSpeed < 0) txSpeed = 0;
                        newSpeeds[iface.name] = { rxSpeed, txSpeed };
                    }
                } else {
                    newSpeeds[iface.name] = { rxSpeed: 0, txSpeed: 0 };
                }
                
                newStats[iface.name] = { rx: currentRx, tx: currentTx, time: now };
            });
            
            prevStatsRef.current = newStats;
            setTrafficSpeed(newSpeeds);
        }
    }, [liveData]);

    const formatSpeed = (bps: number) => {
        if (bps >= 1000000) return (bps / 1000000).toFixed(2) + ' Mbps';
        if (bps >= 1000) return (bps / 1000).toFixed(2) + ' Kbps';
        return bps.toFixed(0) + ' bps';
    };

    const formatBytes = (bytes: number) => {
        if (isNaN(bytes) || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const systemResource = liveData ? {
        cpu: liveData.systemResource?.['cpu-load'] || 0,
        cpuAvg: liveData.systemResource?.['cpu-load'] || 0,
        ram: liveData.systemResource ? Math.round(((liveData.systemResource['total-memory'] - liveData.systemResource['free-memory']) / liveData.systemResource['total-memory']) * 100) : 0,
        ramUsed: liveData.systemResource ? formatBytes(liveData.systemResource['total-memory'] - liveData.systemResource['free-memory']) : '0 B',
        uptime: liveData.systemResource?.uptime || '-',
        identity: liveData.identity || '-',
        activeUsers: (liveData.pppActive?.length || 0) + (liveData.hotspotActive?.length || 0),
        offlineUsers: (liveData.pppOffline?.length || 0),
        disabledUsers: (liveData.pppDisabled?.length || 0) + (liveData.hotspotDisabled?.length || 0),
        unsyncedUsers: (liveData.unsyncedPppoe?.length || 0)
    } : { cpu: 0, cpuAvg: 0, ram: 0, ramUsed: '0 MB', uptime: '-', identity: '-', activeUsers: 0, offlineUsers: 0, disabledUsers: 0, unsyncedUsers: 0 };

    const interfacesList = (liveData?.interfaces || [])
        .filter((iface: any) => !(iface.type && iface.type.includes('pppoe')))
        .map((iface: any) => {
        const speed = trafficSpeed[iface.name] || { rxSpeed: 0, txSpeed: 0 };
        return {
            name: iface.name,
            type: iface.type,
            status: iface.running === 'true' ? 'Running' : 'Disabled',
            rx: formatSpeed(speed.rxSpeed),
            tx: formatSpeed(speed.txSpeed)
        };
    });

    const allActiveUsers = [
        ...(liveData?.pppActive || []).map((u: any) => {
            const iface = liveData?.interfaces?.find((i: any) => i.name === `<pppoe-${u.name}>`);
            const dl = iface ? formatBytes(parseInt(iface['tx-byte'] || 0)) : '-';
            const ul = iface ? formatBytes(parseInt(iface['rx-byte'] || 0)) : '-';
            return {
                username: u.name,
                service: u.service || 'PPPoE',
                ip: u.address || u['caller-id'] || '-',
                uptime: u.uptime || '-',
                download: dl, 
                upload: ul,
                status: 'Online'
            };
        }),
        ...(liveData?.hotspotActive || []).map((u: any) => ({
            username: u.user,
            service: 'Hotspot',
            ip: u.address || '-',
            uptime: u.uptime || '-',
            download: formatBytes(parseInt(u['bytes-out'] || 0)),
            upload: formatBytes(parseInt(u['bytes-in'] || 0)),
            status: 'Online'
        })),
    ];

    const allDisabledUsers = [
        ...(liveData?.pppDisabled || []).map((u: any) => ({
            username: u.name,
            service: u.service || 'PPPoE',
            profile: u.profile || '-',
            comment: u.comment || '-',
            status: 'Terisolir'
        })),
        ...(liveData?.hotspotDisabled || []).map((u: any) => ({
            username: u.name,
            service: 'Hotspot',
            profile: u.profile || '-',
            comment: u.comment || '-',
            status: 'Terisolir'
        }))
    ];

    // Filter Data Berdasarkan Status & Pencarian Masing-masing
    const onlineUsers = allActiveUsers.filter(u => u.username.toLowerCase().includes(onlineSearch.toLowerCase()));
    const allOfflineUsers = [
        ...(liveData?.pppOffline || []).map((u: any) => ({
            username: u.name,
            service: u.service || 'PPPoE',
            ip: u['remote-address'] || '-',
            lastDisconnect: u['last-logged-out'] || '-',
            status: 'Offline'
        }))
    ];
    const offlineUsers = allOfflineUsers.filter(u => u.username.toLowerCase().includes(offlineSearch.toLowerCase()));
    const filteredDisabledUsers = allDisabledUsers.filter(u => u.username.toLowerCase().includes(disabledSearch.toLowerCase()));
    
    const allUnsyncedUsers = liveData?.unsyncedPppoe || [];
    const unsyncedUsers = allUnsyncedUsers.filter((u: any) => u.name.toLowerCase().includes(unsyncedSearch.toLowerCase()));
    
    const paginatedInterfaces = interfacesList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const paginatedOnlineUsers = onlineUsers.slice((currentPageOnline - 1) * itemsPerPageOnline, currentPageOnline * itemsPerPageOnline);
    const paginatedOfflineUsers = offlineUsers.slice((currentPageOffline - 1) * itemsPerPageOffline, currentPageOffline * itemsPerPageOffline);
    const paginatedDisabledUsers = filteredDisabledUsers.slice((currentPageDisabled - 1) * itemsPerPageDisabled, currentPageDisabled * itemsPerPageDisabled);
    const paginatedUnsyncedUsers = unsyncedUsers.slice((currentPageUnsynced - 1) * itemsPerPageUnsynced, currentPageUnsynced * itemsPerPageUnsynced);

    return (
        <>
            <Head title="Monitoring Mikrotik" />
            <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
                
                {/* Selector */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                <Router className="h-4 w-4 text-neutral-400" />
                            </div>
                            <select 
                                value={selectedRouter}
                                onChange={(e) => setSelectedRouter(e.target.value)}
                                className="appearance-none pl-9 pr-10 relative z-0 flex h-9 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 font-medium"
                            >
                                {dataMikrotik.map(rtr => (
                                    <option key={rtr.id} value={rtr.id} className="dark:bg-neutral-900">{rtr.nama} ({rtr.ip})</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                                <ChevronDown className="h-4 w-4 text-neutral-400" />
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => setRefreshTrigger(prev => prev + 1)}
                            disabled={isLoadingLive}
                            className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shrink-0"
                            title="Refresh Data"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoadingLive ? 'animate-spin text-blue-500' : 'text-neutral-500'}`} />
                        </Button>


                    </div>
                </div>

                {/* Error/Loading Indicators */}
                {(!isMounted || (isLoadingLive && !liveData)) && (
                    <div className="flex items-center justify-center p-8 bg-white dark:bg-neutral-900 border border-sidebar-border/70 rounded-xl">
                        <Loader2 className="w-6 h-6 animate-spin text-neutral-400 mr-2" />
                        <span className="text-neutral-500">Memuat data monitoring...</span>
                    </div>
                )}
                {isMounted && liveError && (
                    <div className="flex justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <XCircle className="w-5 h-5" />
                            <span>{liveError}</span>
                        </div>
                    </div>
                )}

                {/* KPI Resource - Teks Disesuaikan (Normal tapi tidak kebesaran) & Ikon Diubah */}
                {isMounted && (!isLoadingLive || liveData) && !liveError && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 mt-2">
                        {/* System Resource Card */}
                        <Card className="relative overflow-hidden flex flex-col border border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-900/20 dark:to-neutral-950 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition-all group col-span-2 md:col-span-1">
                            <Server className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-20 h-20 sm:w-24 sm:h-24 text-indigo-500/[0.04] dark:text-indigo-500/10 pointer-events-none group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500" strokeWidth={1.5} />
                            <div className="relative z-10 flex items-center gap-2 mb-2 sm:mb-3">
                                <div className="p-1.5 bg-indigo-100/50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <Server className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </div>
                                <span className="font-bold text-neutral-900 dark:text-white text-xs sm:text-sm">System Resource</span>
                            </div>
                            <div className="grid grid-cols-2 gap-y-2 gap-x-2 relative z-10 mt-auto">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1"><Cpu className="w-2.5 h-2.5 sm:w-3 sm:h-3"/> CPU</span>
                                    <span className="font-semibold text-neutral-900 dark:text-white text-xs sm:text-sm">{systemResource.cpu}%</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1"><HardDrive className="w-2.5 h-2.5 sm:w-3 sm:h-3"/> RAM</span>
                                    <span className="font-semibold text-neutral-900 dark:text-white text-xs sm:text-sm">{systemResource.ram}%</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3"/> Uptime</span>
                                    <span className="font-semibold text-neutral-900 dark:text-white text-xs sm:text-sm truncate">{systemResource.uptime}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1"><Router className="w-2.5 h-2.5 sm:w-3 sm:h-3"/> Identity</span>
                                    <span className="font-semibold text-neutral-900 dark:text-white text-xs sm:text-sm truncate" title={systemResource.identity}>{systemResource.identity}</span>
                                </div>
                            </div>
                        </Card>

                        {/* User Online Card */}
                        <Card 
                            className="relative overflow-hidden flex flex-col justify-between border border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-900/20 dark:to-neutral-950 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
                            onClick={() => setIsOnlineModalOpen(true)}
                        >
                            <UserCheck className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-20 h-20 sm:w-24 sm:h-24 text-emerald-500/[0.04] dark:text-emerald-500/10 pointer-events-none group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500" strokeWidth={1.5} />
                            <div className="flex justify-between items-start relative z-10 mb-2 sm:mb-3">
                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                    <span className="text-[10px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 break-all pr-2">User Aktif / Online</span>
                                    <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-500 mt-0 sm:mt-1 truncate">{systemResource.activeUsers}</span>
                                </div>
                                <div className="p-1.5 bg-emerald-100/50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                    <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-auto">
                                <span className="flex items-center text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[10px]">
                                    <ArrowUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" /> Aktif
                                </span>
                                <span className="text-neutral-400 dark:text-neutral-500 truncate hidden sm:inline text-[10px]">Lihat Detail</span>
                            </div>
                        </Card>
                        
                        {/* User Offline Card */}
                        <Card 
                            className="relative overflow-hidden flex flex-col justify-between border border-rose-100 dark:border-rose-900/30 bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-900/20 dark:to-neutral-950 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer hover:border-rose-300 dark:hover:border-rose-700 transition-all group"
                            onClick={() => setIsOfflineModalOpen(true)}
                        >
                            <UserX className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-20 h-20 sm:w-24 sm:h-24 text-rose-500/[0.04] dark:text-rose-500/10 pointer-events-none group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500" strokeWidth={1.5} />
                            <div className="flex justify-between items-start relative z-10 mb-2 sm:mb-3">
                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                    <span className="text-[10px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 break-all pr-2">User Offline</span>
                                    <span className="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-500 mt-0 sm:mt-1 truncate">{systemResource.offlineUsers}</span>
                                </div>
                                <div className="p-1.5 bg-rose-100/50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg">
                                    <UserX className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-auto">
                                <span className="flex items-center text-rose-600 font-medium bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[10px]">
                                    <ArrowDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" /> Terputus
                                </span>
                                <span className="text-neutral-400 dark:text-neutral-500 truncate hidden sm:inline text-[10px]">Lihat Detail</span>
                            </div>
                        </Card>

                        {/* User Disabled Card */}
                        <Card 
                            className="relative overflow-hidden flex flex-col justify-between border border-amber-100 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/20 dark:to-neutral-950 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition-all group"
                            onClick={() => setIsDisabledModalOpen(true)}
                        >
                            <UserX className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-20 h-20 sm:w-24 sm:h-24 text-amber-500/[0.04] dark:text-amber-500/10 pointer-events-none group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500" strokeWidth={1.5} />
                            <div className="flex justify-between items-start relative z-10 mb-2 sm:mb-3">
                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                    <span className="text-[10px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 break-all pr-2">User Terisolir</span>
                                    <span className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-500 mt-0 sm:mt-1 truncate">{systemResource.disabledUsers}</span>
                                </div>
                                <div className="p-1.5 bg-amber-100/50 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-lg">
                                    <UserX className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-auto">
                                <span className="flex items-center text-amber-600 font-medium bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[10px]">
                                    Isolir
                                </span>
                                <span className="text-neutral-400 dark:text-neutral-500 truncate hidden sm:inline text-[10px]">Dinonaktifkan</span>
                            </div>
                        </Card>

                        {/* Unsynced Users Card */}
                        <Card 
                            className="relative overflow-hidden flex flex-col justify-between border border-orange-100 dark:border-orange-900/30 bg-gradient-to-br from-orange-50/80 to-white dark:from-orange-900/20 dark:to-neutral-950 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer hover:border-orange-300 dark:hover:border-orange-700 transition-all group"
                            onClick={() => setIsUnsyncedModalOpen(true)}
                        >
                            <AlertTriangle className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 w-20 h-20 sm:w-24 sm:h-24 text-orange-500/[0.04] dark:text-orange-500/10 pointer-events-none group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500" strokeWidth={1.5} />
                            <div className="flex justify-between items-start relative z-10 mb-2 sm:mb-3">
                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                    <span className="text-[10px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 break-all pr-2">PPPoE Belum Sinkron</span>
                                    <span className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-500 mt-0 sm:mt-1 truncate">{systemResource.unsyncedUsers}</span>
                                </div>
                                <div className="p-1.5 bg-orange-100/50 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs relative z-10 mt-auto">
                                <span className="flex items-center text-orange-600 font-medium bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[10px]">
                                    Belum Sinkron
                                </span>
                                <span className="text-neutral-400 dark:text-neutral-500 truncate hidden sm:inline text-[10px]">Lihat Detail</span>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Tabel Interface List */}
                <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden p-0 gap-0 mt-2">
                    <div className="px-4 py-3 border-b border-sidebar-border/70 dark:border-sidebar-border flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/20">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-neutral-100 dark:bg-neutral-800/80 rounded-md text-neutral-600 dark:text-neutral-400">
                                <Activity className="w-4 h-4" />
                            </div>
                            <h3 className="font-semibold text-neutral-900 dark:text-white">Interface Traffic Monitor (Real-time)</h3>
                        </div>
                    </div>
                    
                    <div className="overflow-auto max-h-[500px]">
                        <table className="hidden md:table w-full text-xs text-left">
                            <thead className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-2.5 font-semibold">Nama Interface</th>
                                    <th className="px-4 py-2.5 font-semibold">Status Link</th>
                                    <th className="px-4 py-2.5 font-semibold">Tipe Hardware</th>
                                    <th className="px-4 py-2.5 font-semibold text-right">Traffic In (Rx)</th>
                                    <th className="px-4 py-2.5 font-semibold text-right">Traffic Out (Tx)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {paginatedInterfaces.length > 0 ? (
                                    paginatedInterfaces.map((iface, idx) => (
                                        <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group">
                                        <td className="px-4 py-3">
                                            <div className="font-bold font-mono text-neutral-900 dark:text-white flex items-center gap-2">
                                                <Network className="w-3.5 h-3.5 text-neutral-400" /> {iface.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {iface.status === 'Running' ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold px-1.5 py-0.5 rounded">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Running
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-semibold px-1.5 py-0.5 rounded">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400"></div> Disabled
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                            {iface.type}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5 font-mono font-semibold text-blue-600 dark:text-blue-400">
                                                {iface.rx} <ArrowDown className="w-3 h-3 text-blue-400/70" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5 font-mono font-semibold text-emerald-600 dark:text-emerald-500">
                                                {iface.tx} <ArrowUp className="w-3 h-3 text-emerald-400/70" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                        Belum ada data antarmuka yang ditemukan
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile Cards */}
                    <div className="flex flex-col md:hidden divide-y divide-sidebar-border/70 dark:divide-sidebar-border border-t border-sidebar-border/70">
                        {paginatedInterfaces.length === 0 && (
                            <div className="p-8 text-center text-neutral-500 text-sm">
                                Belum ada data antarmuka yang ditemukan.
                            </div>
                        )}
                        {paginatedInterfaces.map((iface, idx) => (
                            <div key={idx} className="p-4 bg-white dark:bg-neutral-900 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-md text-neutral-500">
                                            <Network className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold font-mono text-sm text-neutral-900 dark:text-white break-all pr-2">{iface.name}</span>
                                            <span className="text-[10px] text-neutral-500">{iface.type}</span>
                                        </div>
                                    </div>
                                    <div>
                                        {iface.status === 'Running' ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold px-1.5 py-0.5 rounded">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Running
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-semibold px-1.5 py-0.5 rounded">
                                                <div className="w-1.5 h-1.5 rounded-full bg-neutral-400"></div> Disabled
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
                                    <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                                        <span className="text-neutral-500 flex items-center gap-1"><ArrowDown className="w-3 h-3 text-blue-500" /> In (Rx)</span>
                                        <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{iface.rx}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                                        <span className="text-neutral-500 flex items-center gap-1"><ArrowUp className="w-3 h-3 text-emerald-500" /> Out (Tx)</span>
                                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{iface.tx}</span>
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
                        totalItems={interfacesList.length}
                        paginatedLength={paginatedInterfaces.length}
                        itemName="antarmuka"
                    />
                </Card>
            </div>

            {/* Modal Dialog 1: Daftar User ONLINE */}
            <Dialog open={isOnlineModalOpen} onOpenChange={setIsOnlineModalOpen}>
                <DialogContent 
                    className="w-[95vw] sm:w-[90vw] max-w-md sm:max-w-4xl max-h-[90vh] sm:max-h-[85vh] flex flex-col border-sidebar-border/70 p-0 overflow-hidden gap-0 bg-neutral-50 dark:bg-neutral-950"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader className="px-6 py-4 border-b border-sidebar-border/70 bg-white dark:bg-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-lg shadow-sm">
                                <UserCheck className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col gap-0.5 text-left">
                                <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                    Daftar Pelanggan Online
                                </DialogTitle>
                                <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Memantau sesi pengguna PPPoE & Hotspot yang sedang terkoneksi aktif.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-950 border-b border-sidebar-border/70 dark:border-sidebar-border flex justify-end shrink-0">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                <Input
                                    type="search"
                                    placeholder="Cari Username Akun Online..."
                                    value={onlineSearch}
                                    onChange={(e) => setOnlineSearch(e.target.value)}
                                    className="w-full h-9 bg-white dark:bg-neutral-900 pl-9 text-sm border-neutral-200 dark:border-neutral-800 shadow-sm focus-visible:ring-emerald-500"
                                />
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                            <table className="hidden md:table w-full text-xs text-left bg-white dark:bg-neutral-900">
                                <thead className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border sticky top-0 z-10 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Username Akun</th>
                                        <th className="px-6 py-3 font-semibold">Layanan & IP Address</th>
                                        <th className="px-6 py-3 font-semibold">Uptime Sesi</th>
                                        <th className="px-6 py-3 font-semibold text-right">Data Download</th>
                                        <th className="px-6 py-3 font-semibold text-right">Data Upload</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {paginatedOnlineUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">Tidak ada pelanggan online yang cocok dengan pencarian.</td>
                                        </tr>
                                    )}
                                    {paginatedOnlineUsers.map((user, idx) => (
                                        <tr key={idx} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-emerald-500" /> {user.username}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-neutral-600 dark:text-neutral-400">{user.service}</span>
                                                    <span className="text-neutral-400 font-mono text-[10px]">{user.ip}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 font-medium text-neutral-600 dark:text-neutral-400">{user.uptime}</td>
                                            <td className="px-6 py-3 text-right">
                                                <span className="flex justify-end items-center gap-1.5 text-neutral-600 dark:text-neutral-300 font-mono font-medium"><ArrowDown className="w-3.5 h-3.5 text-emerald-500" /> {user.download}</span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <span className="flex justify-end items-center gap-1.5 text-neutral-600 dark:text-neutral-300 font-mono font-medium"><ArrowUp className="w-3.5 h-3.5 text-blue-500" /> {user.upload}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Mobile View */}
                            <div className="flex flex-col md:hidden divide-y divide-sidebar-border/70 dark:divide-sidebar-border bg-white dark:bg-neutral-900">
                                {paginatedOnlineUsers.length === 0 && (
                                    <div className="px-6 py-8 text-center text-neutral-500 text-sm">Tidak ada pelanggan online yang cocok dengan pencarian.</div>
                                )}
                                {paginatedOnlineUsers.map((user, idx) => (
                                    <div key={idx} className="p-4 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-emerald-500" />
                                                <span className="font-bold text-sm text-neutral-900 dark:text-white break-all pr-2">{user.username}</span>
                                            </div>
                                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold px-1.5 py-0.5 rounded w-fit">
                                                <UserCheck className="w-3 h-3" /> Online
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-neutral-500 flex items-center gap-1"><Router className="w-3 h-3"/> IP & Layanan</span>
                                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{user.service} <span className="text-neutral-400 dark:text-neutral-500 font-mono text-[10px] ml-1">{user.ip}</span></span>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-neutral-500 flex items-center gap-1"><Clock className="w-3 h-3"/> Uptime</span>
                                                <span className="font-medium text-neutral-700 dark:text-neutral-300">{user.uptime}</span>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-neutral-500 flex items-center gap-1"><ArrowDown className="w-3 h-3 text-emerald-500"/> Download</span>
                                                <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">{user.download}</span>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-neutral-500 flex items-center gap-1"><ArrowUp className="w-3 h-3 text-blue-500"/> Upload</span>
                                                <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">{user.upload}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <TablePagination 
                            currentPage={currentPageOnline}
                            setCurrentPage={setCurrentPageOnline}
                            itemsPerPage={itemsPerPageOnline}
                            setItemsPerPage={setItemsPerPageOnline}
                            totalItems={onlineUsers.length}
                            paginatedLength={paginatedOnlineUsers.length}
                            itemName="pelanggan online"
                        />
                    </div>
                    <DialogFooter className="p-4 border-t border-sidebar-border/70 bg-neutral-50 dark:bg-neutral-950">
                        <Button variant="outline" onClick={() => setIsOnlineModalOpen(false)} className="w-full sm:w-auto font-medium">Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Dialog 2: Daftar User OFFLINE */}
            <Dialog open={isOfflineModalOpen} onOpenChange={setIsOfflineModalOpen}>
                <DialogContent 
                    className="w-[95vw] sm:w-[90vw] max-w-md sm:max-w-4xl max-h-[90vh] sm:max-h-[85vh] flex flex-col border-sidebar-border/70 p-0 overflow-hidden gap-0 bg-neutral-50 dark:bg-neutral-950"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader className="px-6 py-4 border-b border-sidebar-border/70 bg-white dark:bg-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 rounded-lg shadow-sm">
                                <UserX className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col gap-0.5 text-left">
                                <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                    Daftar Pelanggan Offline
                                </DialogTitle>
                                <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Memantau pelanggan yang terputus (LOS / Terisolir / Perangkat Mati).
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-950 border-b border-sidebar-border/70 dark:border-sidebar-border flex justify-end shrink-0">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                <Input
                                    type="search"
                                    placeholder="Cari Username Akun Offline..."
                                    value={offlineSearch}
                                    onChange={(e) => setOfflineSearch(e.target.value)}
                                    className="w-full h-9 bg-white dark:bg-neutral-900 pl-9 text-sm border-neutral-200 dark:border-neutral-800 shadow-sm focus-visible:ring-rose-500"
                                />
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                            <table className="hidden md:table w-full text-xs text-left bg-white dark:bg-neutral-900">
                                <thead className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border sticky top-0 z-10 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Username Akun</th>
                                        <th className="px-6 py-3 font-semibold">Layanan Terdaftar</th>
                                        <th className="px-6 py-3 font-semibold">Status Saat Ini</th>
                                        <th className="px-6 py-3 font-semibold text-right">Waktu Offline</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {paginatedOfflineUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">Tidak ada pelanggan offline yang cocok dengan pencarian.</td>
                                        </tr>
                                    )}
                                    {paginatedOfflineUsers.map((user, idx) => (
                                        <tr key={idx} className="hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                                    <UserX className="w-4 h-4 text-rose-500" /> {user.username}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="font-semibold text-neutral-600 dark:text-neutral-400">{user.service}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-semibold px-1.5 py-0.5 rounded w-fit">
                                                    <XCircle className="w-3 h-3" /> Disconnected
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <span className="text-neutral-600 dark:text-neutral-400 font-medium">{user.lastDisconnect}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Mobile View */}
                            <div className="flex flex-col md:hidden divide-y divide-sidebar-border/70 dark:divide-sidebar-border bg-white dark:bg-neutral-900">
                                {paginatedOfflineUsers.length === 0 && (
                                    <div className="px-6 py-8 text-center text-neutral-500 text-sm">Tidak ada pelanggan offline yang cocok dengan pencarian.</div>
                                )}
                                {paginatedOfflineUsers.map((user, idx) => (
                                    <div key={idx} className="p-4 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <UserX className="w-4 h-4 text-rose-500" />
                                                <span className="font-bold text-sm text-neutral-900 dark:text-white break-all pr-2">{user.username}</span>
                                            </div>
                                            <span className="inline-flex items-center gap-1 text-[10px] bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-semibold px-1.5 py-0.5 rounded w-fit">
                                                <XCircle className="w-3 h-3" /> Disconnected
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-neutral-500 flex items-center gap-1"><Router className="w-3 h-3"/> Layanan</span>
                                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">{user.service}</span>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-neutral-500 flex items-center gap-1"><Clock className="w-3 h-3"/> Waktu Offline</span>
                                                <span className="font-medium text-neutral-700 dark:text-neutral-300">{user.lastDisconnect}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <TablePagination 
                            currentPage={currentPageOffline}
                            setCurrentPage={setCurrentPageOffline}
                            itemsPerPage={itemsPerPageOffline}
                            setItemsPerPage={setItemsPerPageOffline}
                            totalItems={offlineUsers.length}
                            paginatedLength={paginatedOfflineUsers.length}
                            itemName="pelanggan offline"
                        />
                    </div>
                    <DialogFooter className="p-4 border-t border-sidebar-border/70 bg-neutral-50 dark:bg-neutral-950">
                        <Button variant="outline" onClick={() => setIsOfflineModalOpen(false)} className="w-full sm:w-auto font-medium">Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Dialog 3: Daftar User DISABLED */}
            <Dialog open={isDisabledModalOpen} onOpenChange={setIsDisabledModalOpen}>
                <DialogContent 
                    className="w-[95vw] sm:w-[90vw] max-w-md sm:max-w-4xl max-h-[90vh] sm:max-h-[85vh] flex flex-col border-sidebar-border/70 p-0 overflow-hidden gap-0 bg-neutral-50 dark:bg-neutral-950"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader className="px-6 py-4 border-b border-sidebar-border/70 bg-white dark:bg-neutral-900">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded-lg shadow-sm">
                                <UserX className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col gap-0.5 text-left">
                                <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                    Daftar Pelanggan Terisolir
                                </DialogTitle>
                                <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Menampilkan daftar akun pelanggan yang saat ini sedang dinonaktifkan (disabled).
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-950 border-b border-sidebar-border/70 dark:border-sidebar-border flex justify-end shrink-0">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                <Input
                                    type="search"
                                    placeholder="Cari Username Akun Terisolir..."
                                    value={disabledSearch}
                                    onChange={(e) => setDisabledSearch(e.target.value)}
                                    className="w-full h-9 bg-white dark:bg-neutral-900 pl-9 text-sm border-neutral-200 dark:border-neutral-800 shadow-sm focus-visible:ring-amber-500"
                                />
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                            <table className="hidden md:table w-full text-xs text-left bg-white dark:bg-neutral-900">
                                <thead className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border sticky top-0 z-10 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Username Akun</th>
                                        <th className="px-6 py-3 font-semibold">Layanan & Profil</th>
                                        <th className="px-6 py-3 font-semibold">Keterangan</th>
                                        <th className="px-6 py-3 font-semibold text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {paginatedDisabledUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">Tidak ada pelanggan terisolir yang cocok dengan pencarian.</td>
                                        </tr>
                                    )}
                                    {paginatedDisabledUsers.map((user, idx) => (
                                        <tr key={idx} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-amber-500" /> {user.username}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{user.service}</span>
                                                    <span className="text-[11px] font-mono text-neutral-500">{user.profile}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="text-[11px] text-neutral-600 dark:text-neutral-400 max-w-[200px] truncate" title={user.comment}>
                                                    {user.comment}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-semibold px-1.5 py-0.5 rounded w-fit">
                                                    <UserX className="w-3 h-3" /> Terisolir
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Mobile View */}
                            <div className="flex flex-col md:hidden divide-y divide-sidebar-border/70 dark:divide-sidebar-border bg-white dark:bg-neutral-900">
                                {paginatedDisabledUsers.length === 0 && (
                                    <div className="px-6 py-8 text-center text-neutral-500 text-sm">Tidak ada pelanggan terisolir yang cocok dengan pencarian.</div>
                                )}
                                {paginatedDisabledUsers.map((user, idx) => (
                                    <div key={idx} className="p-4 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-amber-500" />
                                                <span className="font-bold text-sm text-neutral-900 dark:text-white break-all pr-2">{user.username}</span>
                                            </div>
                                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-semibold px-1.5 py-0.5 rounded w-fit">
                                                <UserX className="w-3 h-3" /> Terisolir
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-neutral-500 flex items-center gap-1"><Router className="w-3 h-3"/> Layanan & Profil</span>
                                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{user.service} <span className="text-neutral-400 dark:text-neutral-500 font-mono text-[10px] ml-1">{user.profile}</span></span>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-neutral-500 flex items-center gap-1"><Activity className="w-3 h-3"/> Keterangan</span>
                                                <span className="font-medium text-neutral-700 dark:text-neutral-300 break-all pr-2">{user.comment}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <TablePagination 
                            currentPage={currentPageDisabled}
                            setCurrentPage={setCurrentPageDisabled}
                            itemsPerPage={itemsPerPageDisabled}
                            setItemsPerPage={setItemsPerPageDisabled}
                            totalItems={filteredDisabledUsers.length}
                            paginatedLength={paginatedDisabledUsers.length}
                            itemName="pelanggan terisolir"
                        />
                    </div>
                    <DialogFooter className="p-4 border-t border-sidebar-border/70 bg-neutral-50 dark:bg-neutral-950">
                        <Button variant="outline" onClick={() => setIsDisabledModalOpen(false)} className="w-full sm:w-auto font-medium">Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Unsynced Modal */}
            <Dialog open={isUnsyncedModalOpen} onOpenChange={setIsUnsyncedModalOpen}>
                <DialogContent 
                    className="w-[95vw] sm:w-[90vw] max-w-md sm:max-w-4xl max-h-[90vh] sm:max-h-[85vh] flex flex-col border-sidebar-border/70 p-0 overflow-hidden gap-0 bg-neutral-50 dark:bg-neutral-950"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader className="px-6 py-4 border-b border-sidebar-border/70 bg-white dark:bg-neutral-900 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded-lg shadow-sm">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col gap-0.5 text-left">
                                <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                    Daftar PPPoE Belum Sinkron
                                </DialogTitle>
                                <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Akun PPPoE di Mikrotik yang tidak terdaftar di database aplikasi
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-950 border-b border-sidebar-border/70 dark:border-sidebar-border flex justify-end shrink-0">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                <Input
                                    type="search"
                                    placeholder="Cari Username PPPoE..."
                                    value={unsyncedSearch}
                                    onChange={(e) => setUnsyncedSearch(e.target.value)}
                                    className="w-full h-9 bg-white dark:bg-neutral-900 pl-9 text-sm border-neutral-200 dark:border-neutral-800 shadow-sm focus-visible:ring-amber-500"
                                />
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                            <table className="hidden md:table w-full text-xs text-left bg-white dark:bg-neutral-900">
                                <thead className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border sticky top-0 z-10 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Username (PPPoE)</th>
                                        <th className="px-6 py-3 font-semibold">Service</th>
                                        <th className="px-6 py-3 font-semibold">Profile</th>
                                        <th className="px-6 py-3 font-semibold">Password</th>
                                        <th className="px-6 py-3 font-semibold text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {paginatedUnsyncedUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">Tidak ada akun PPPoE yang belum sinkron yang cocok dengan pencarian.</td>
                                        </tr>
                                    )}
                                    {paginatedUnsyncedUsers.map((u: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4 text-amber-500" /> {u.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="font-semibold text-neutral-600 dark:text-neutral-400">{u.service || 'any'}</span>
                                            </td>
                                            <td className="px-6 py-3 text-neutral-600 dark:text-neutral-400">
                                                {u.profile || 'default'}
                                            </td>
                                            <td className="px-6 py-3 font-mono text-[11px] text-neutral-500">
                                                {u.password || '-'}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-md text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30">
                                                    Tidak Terdaftar
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Mobile View */}
                            <div className="flex flex-col md:hidden divide-y divide-sidebar-border/70 dark:divide-sidebar-border bg-white dark:bg-neutral-900">
                                {paginatedUnsyncedUsers.length === 0 && (
                                    <div className="px-6 py-8 text-center text-neutral-500 text-sm">Tidak ada akun PPPoE yang belum sinkron yang cocok dengan pencarian.</div>
                                )}
                                {paginatedUnsyncedUsers.map((u: any, idx: number) => (
                                    <div key={idx} className="p-4 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                <span className="font-bold text-sm text-neutral-900 dark:text-white break-all pr-2">{u.name}</span>
                                            </div>
                                            <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-md text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30">
                                                Belum Sinkron
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-neutral-500 flex items-center gap-1"><Router className="w-3 h-3"/> Service</span>
                                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">{u.service || 'any'}</span>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-neutral-500 flex items-center gap-1"><Package className="w-3 h-3"/> Profile</span>
                                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{u.profile || 'default'}</span>
                                            </div>
                                            <div className="flex flex-col gap-0.5 col-span-2 mt-1">
                                                <span className="text-neutral-500 flex items-center gap-1"><Key className="w-3 h-3"/> Password</span>
                                                <span className="font-mono text-neutral-700 dark:text-neutral-300">{u.password || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <TablePagination 
                            currentPage={currentPageUnsynced}
                            setCurrentPage={setCurrentPageUnsynced}
                            itemsPerPage={itemsPerPageUnsynced}
                            setItemsPerPage={setItemsPerPageUnsynced}
                            totalItems={unsyncedUsers.length}
                            paginatedLength={paginatedUnsyncedUsers.length}
                            itemName="akun pppoe"
                        />
                    </div>
                    
                    <DialogFooter className="p-4 border-t border-sidebar-border/70 bg-neutral-50 dark:bg-neutral-950">
                        <Button variant="outline" onClick={() => setIsUnsyncedModalOpen(false)} className="w-full sm:w-auto font-medium">Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

Mikrotik.layout = {
    breadcrumbs: [
        {
            title: 'Monitoring Mikrotik',
            href: '/mikrotik',
        },
    ],
};
