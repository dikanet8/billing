import { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { useEcho } from '@laravel/echo-react';
import { RefreshCw, Network, ChevronDown, Layers, PlusCircle, Signal, MoreVertical, Trash2, Eye, Settings } from 'lucide-react';
import GponProvisionModal from '@/components/olt/GponProvisionModal';
import GponServiceModal from '@/components/olt/GponServiceModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TablePagination } from '@/components/ui/table-pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function OltMonitoring({ olt, olts = [], selectedOltId }: { olt: any, olts?: any[], selectedOltId?: string|number }) {
    const [ports, setPorts] = useState<any[]>([]);
    const [loadingPorts, setLoadingPorts] = useState(false);
    const [selectedCard, setSelectedCard] = useState('');
    const [selectedPortIndex, setSelectedPortIndex] = useState('');
    const [onus, setOnus] = useState<any[]>([]);
    const [loadingOnus, setLoadingOnus] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isClient, setIsClient] = useState(false);

    const getPageStorageKey = (portIndex: string = selectedPortIndex) => {
        if (!olt?.id) return 'olt_currentPage';
        return portIndex ? `olt_currentPage_${olt.id}_${portIndex}` : `olt_currentPage_${olt.id}`;
    };

    useEffect(() => {
        setIsClient(true);
        if (typeof sessionStorage !== 'undefined') {
            const savedCard = sessionStorage.getItem('olt_selectedCard');
            if (savedCard) setSelectedCard(savedCard);
            
            const savedPort = sessionStorage.getItem('olt_selectedPortIndex');
            if (savedPort) setSelectedPortIndex(savedPort);
            
            const savedPage = sessionStorage.getItem(getPageStorageKey(savedPort || selectedPortIndex));
            if (savedPage) {
                const parsed = parseInt(savedPage, 10);
                if (!Number.isNaN(parsed) && parsed > 0) setCurrentPage(parsed);
            }
            
            const savedItems = sessionStorage.getItem('olt_itemsPerPage');
            if (savedItems) setItemsPerPage(parseInt(savedItems, 10));
        }
    }, []);
    const [detailOnu, setDetailOnu] = useState<any>(null);
    const [isUncfgModalOpen, setIsUncfgModalOpen] = useState(false);
    const [recentlyProvisioned, setRecentlyProvisioned] = useState<{sn: string, time: number} | null>(null);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [selectedOnuForService, setSelectedOnuForService] = useState<any>(null);

    useEffect(() => { sessionStorage.setItem('olt_selectedCard', selectedCard); }, [selectedCard]);
    useEffect(() => { sessionStorage.setItem('olt_selectedPortIndex', selectedPortIndex); }, [selectedPortIndex]);
    useEffect(() => {
        if (typeof sessionStorage === 'undefined') return;
        const pageKey = getPageStorageKey();
        sessionStorage.setItem(pageKey, currentPage.toString());
        sessionStorage.setItem('olt_currentPage', currentPage.toString());
    }, [currentPage, selectedPortIndex, olt?.id]);
    useEffect(() => { sessionStorage.setItem('olt_itemsPerPage', itemsPerPage.toString()); }, [itemsPerPage]);

    // Signal quality color coding based on Rx power dBm value
    const getRxSignalClass = (rxRaw: number | null, rxPower: string): string => {
        if (!rxPower || rxPower === 'Offline') return 'text-neutral-400 dark:text-neutral-600';
        if (rxRaw === null || rxRaw === undefined) return 'text-neutral-400';
        if (rxRaw >= -20) return 'text-emerald-600 dark:text-emerald-400';          // Excellent
        if (rxRaw >= -25) return 'text-green-600 dark:text-green-400';              // Good
        if (rxRaw >= -28) return 'text-yellow-600 dark:text-yellow-400';            // Marginal
        if (rxRaw >= -33) return 'text-orange-500 dark:text-orange-400';            // Weak
        return 'text-red-500 dark:text-red-400';                                    // Very weak / floor
    };

    const getRxLabel = (rxRaw: number | null, rxPower: string): string => {
        if (!rxPower || rxPower === 'Offline') return '—';
        if (rxRaw === null || rxRaw === undefined) return rxPower;
        if (rxRaw >= -20) return rxPower;
        if (rxRaw >= -25) return rxPower;
        if (rxRaw >= -28) return rxPower;
        if (rxRaw >= -33) return rxPower;
        return `${rxPower} ⚠`;
    };

    const uniqueCards = useMemo(() => {
        const cards = new Set<string>();
        (ports || []).forEach(p => {
            const name = String(p?.name || '');
            const parts = name.split('/');
            if (parts.length >= 3) {
                cards.add(`${parts[0]}/${parts[1]}`);
            }
        });
        return Array.from(cards);
    }, [ports]);

    const availablePons = useMemo(() => {
        if (!selectedCard) return [];
        return (ports || []).filter(p => String(p?.name || '').startsWith(selectedCard + '/'));
    }, [ports, selectedCard]);

    useEffect(() => {
        if (uniqueCards.length > 0) {
            if (!selectedCard || !uniqueCards.includes(selectedCard)) {
                setSelectedCard(uniqueCards[0]);
            }
        }
    }, [uniqueCards, selectedCard]);

    useEffect(() => {
        if (availablePons.length > 0) {
            const isValid = availablePons.some(p => String(p.index) === selectedPortIndex);
            if (!isValid) {
                setSelectedPortIndex(String(availablePons[0].index));
            }
        } else if (ports.length > 0) {
            setSelectedPortIndex('');
        }
    }, [availablePons, selectedPortIndex, ports]);

    const fetchPorts = async () => {
        setLoadingPorts(true);
        try {
            const res = await fetch(`/api/olt/${olt.id}/ports`);
            const data = await res.json();
            setPorts(data.data || []);
        } catch (error: any) {
            toast.error('Gagal memuat data port');
        } finally {
            setLoadingPorts(false);
        }
    };

    useEffect(() => {
        if (olt?.id) {
            fetchPorts();
        }
    }, [olt?.id]);

    const fetchOnus = async (portIndex: string, silent = false) => {
        if (!olt?.id || !portIndex) return;
        if (!silent) {
            setLoadingOnus(true);
            setOnus([]);
        }
        try {
            const res = await fetch(`/api/olt/${olt.id}/ports/${portIndex}/onus?_t=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();
            setOnus(data.data || []);
            const storedPage = sessionStorage.getItem(getPageStorageKey(portIndex));
            if (storedPage) {
                const parsedPage = Number.parseInt(storedPage, 10);
                if (!Number.isNaN(parsedPage) && parsedPage > 0) {
                    setCurrentPage(parsedPage);
                }
            } else if (!silent) {
                setCurrentPage(1);
            }
        } catch (error) {
            console.error(error);
            if (!silent) toast.error('Gagal mengambil data modem');
        } finally {
            if (!silent) setLoadingOnus(false);
        }
    };

    useEcho(olt && selectedPortIndex ? `olt.${olt.id}.port.${selectedPortIndex}` : '', 'OltPortDataUpdated', (e: any) => {
        if (e.onus) setOnus(e.onus);
    }, [olt, selectedPortIndex], 'public');

    useEffect(() => {
        if (selectedPortIndex && olt) {
            fetchOnus(selectedPortIndex);
            
            // Ping watcher to keep daemon polling
            const pingWatch = () => {
                axios.post('/api/olt/ping-watch', { 
                    olt_id: olt.id, 
                    port_index: selectedPortIndex 
                }).catch(() => {});
            };
            
            pingWatch();
            const interval = setInterval(pingWatch, 10000);
            return () => clearInterval(interval);
        }
    }, [selectedPortIndex, olt]);

    const handleDeleteOnu = async (onu: any) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus ONU ID ${onu.onu_id} (${onu.name}) agar menjadi unconfigured?`)) return;
        try {
            const portObj = ports.find(p => String(p.index) === selectedPortIndex);
            if (!portObj) return;
            const res = await fetch(`/api/olt/${olt.id}/onu`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content
                },
                body: JSON.stringify({ port: portObj.name, onu_id: onu.onu_id })
            });
            const data = await res.json();
            if (res.ok && data.status === 'success') {
                toast.success(data.message);
                fetchOnus(selectedPortIndex);
            } else {
                toast.error(data.message || 'Gagal menghapus ONU');
            }
        } catch (e) {
            toast.error('Terjadi kesalahan jaringan saat menghapus ONU');
        }
    };

    const handleRefresh = () => {
        if (selectedPortIndex) {
            fetchOnus(selectedPortIndex);
        } else {
            fetchPorts();
        }
    };

    const totalPages = Math.ceil(onus.length / itemsPerPage);
    
    // Auto-correct current page if it exceeds total pages after data changes
    useEffect(() => {
        if (currentPage > Math.max(1, totalPages)) {
            setCurrentPage(Math.max(1, totalPages));
        }
    }, [currentPage, totalPages]);

    const currentOnuData = onus.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <>
            <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
                <Head title="Monitoring OLT" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                            Modem (ONU) pada OLT: {olt?.nama || 'Unknown'}
                        </h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Pantau status semua modem yang terhubung pada port spesifik. (IP: {olt?.ip})
                        </p>
                    </div>
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                    <Button onClick={handleRefresh} disabled={loadingOnus || loadingPorts} className="w-full sm:w-auto gap-2">
                        <RefreshCw className={`w-4 h-4 ${(loadingOnus || loadingPorts) ? 'animate-spin' : ''}`} />
                        {(loadingOnus || loadingPorts) ? 'Memuat...' : 'Refresh'}
                    </Button>
                </div>
            </div>

            <Card className="flex flex-col border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden p-0 gap-0">
                <div className="p-4 border-b border-sidebar-border/70 dark:border-sidebar-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-50/50 dark:bg-neutral-900/20">
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-1">
                        {olts && olts.length > 0 && (
                            <select 
                                value={selectedOltId || olt?.id}
                                onChange={(e) => router.get(`/olt-monitoring-index?olt_id=${e.target.value}`)}
                                className="w-full sm:w-64 pl-4 pr-10 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium"
                            >
                                {olts.map((o: any) => (
                                    <option key={o.id} value={o.id}>{o.nama} ({o.ip})</option>
                                ))}
                            </select>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:max-w-[400px]">
                            <div className="relative w-full sm:w-1/2">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                    <Layers className="h-4 w-4 text-neutral-400" />
                                </div>
                                <select
                                    value={selectedCard}
                                    onChange={(e) => setSelectedCard(e.target.value)}
                                    className="appearance-none pl-9 pr-10 relative z-0 flex h-9 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm"
                                    disabled={loadingPorts || uniqueCards.length === 0}
                                >
                                    <option value="" disabled>-- Pilih Card --</option>
                                    {uniqueCards.map(card => (
                                        <option key={card} value={card}>{card}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                                    {loadingPorts ? (
                                        <Spinner className="h-4 w-4 text-neutral-400" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-neutral-400" />
                                    )}
                                </div>
                            </div>
                            
                            <div className="relative w-full sm:w-1/2">
                                <select
                                    value={selectedPortIndex}
                                    onChange={(e) => setSelectedPortIndex(e.target.value)}
                                    className="appearance-none pl-3 pr-10 relative z-0 flex h-9 w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm"
                                    disabled={loadingPorts || availablePons.length === 0}
                                >
                                    <option value="" disabled>-- Pilih PON --</option>
                                    {availablePons.map(p => (
                                        <option key={p.index} value={p.index}>
                                            Port {p.name.split('/').pop()} {p.description ? `(${p.description})` : '' /* show description if set */}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                                </div>
                            </div>
                        </div>
                        
                        {olt?.id && (
                            <Button 
                                variant="outline" 
                                className="h-9 gap-2 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                onClick={() => setIsUncfgModalOpen(true)}
                            >
                                <PlusCircle className="w-4 h-4" />
                                ONU Baru (Unconfigured)
                            </Button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-neutral-900/50 border-b border-sidebar-border/70 dark:border-sidebar-border">
                            <tr>
                                <th className="px-6 py-3.5 font-medium whitespace-nowrap">ONU ID</th>
                                <th className="px-6 py-3.5 font-medium whitespace-nowrap">Nama / Deskripsi</th>
                                <th className="px-6 py-3.5 font-medium whitespace-nowrap">Redaman (Rx Power)</th>
                                <th className="px-6 py-3.5 font-medium whitespace-nowrap">MAC Address / SN</th>
                                <th className="px-6 py-3.5 font-medium whitespace-nowrap">Status</th>
                                <th className="px-6 py-3.5 font-medium whitespace-nowrap">Vendor</th>
                                <th className="px-6 py-3.5 font-medium whitespace-nowrap text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                            {loadingOnus ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <Spinner className="text-indigo-500 w-8 h-8" />
                                            <span className="font-medium">Mengambil data modem dari OLT...</span>
                                            <span className="text-xs opacity-75">Ini mungkin butuh beberapa detik tergantung respon OLT.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentOnuData.length > 0 ? (
                                currentOnuData.map((onu, i) => (
                                    <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                        <td className="px-6 py-3.5 font-medium text-neutral-900 dark:text-white">
                                            {onu.onu_id}
                                        </td>
                                        <td className="px-6 py-3.5 text-neutral-600 dark:text-neutral-300">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-[#1e293b] dark:text-neutral-200">{onu.name}</span>
                                                {onu.description && (
                                                    <span className="text-xs text-neutral-500 mt-0.5">{onu.description}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            {onu.rx_power === 'Offline' || !onu.rx_power ? (
                                                <span className="text-neutral-400 dark:text-neutral-600 text-sm">—</span>
                                            ) : onu.rx_power === 'N/A' ? (
                                                <span
                                                    className="text-neutral-400 dark:text-neutral-500 text-sm italic"
                                                    title="OLT tidak dapat mengukur redaman untuk port ini"
                                                >
                                                    Tidak terukur
                                                </span>
                                            ) : (
                                                <span
                                                    className={`font-mono text-sm font-medium ${getRxSignalClass(onu.rx_raw, onu.rx_power)}`}
                                                    title={`Raw: ${onu.rx_power}`}
                                                >
                                                    {getRxLabel(onu.rx_raw, onu.rx_power)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5 text-neutral-600 dark:text-neutral-300 font-mono text-sm">
                                            {onu.mac_address || 'N/A'}
                                        </td>
                                        <td className="px-6 py-3.5">
                                            {(() => {
                                                let displayStatus = onu.status;
                                                // Override status for recently provisioned ONUs (less than 90 seconds ago)
                                                if (recentlyProvisioned && recentlyProvisioned.sn === onu.mac_address && (Date.now() - recentlyProvisioned.time < 90000)) {
                                                    displayStatus = 'Synchronize';
                                                }

                                                if (displayStatus === 'Online') {
                                                    return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">Online</Badge>;
                                                } else if (displayStatus === 'Synchronize' || displayStatus === 'Syncing') {
                                                    return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">Synchronize</Badge>;
                                                } else if (displayStatus === 'Configuring') {
                                                    return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0">Configuring</Badge>;
                                                } else if (displayStatus === 'LOS') {
                                                    return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">LOS</Badge>;
                                                } else {
                                                    return <Badge className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 border-0">Offline</Badge>;
                                                }
                                            })()}
                                        </td>
                                        <td className="px-6 py-3.5 text-neutral-600 dark:text-neutral-400">
                                            {onu.vendor}
                                        </td>
                                        <td className="px-6 py-3.5 text-right space-x-1">
                                            <button 
                                                onClick={() => {
                                                    const portObj = ports.find(p => String(p.index) === selectedPortIndex);
                                                    if (portObj) {
                                                        const safePort = portObj.name.replace(/\//g, '-');
                                                        router.visit(`/olt/${olt.id}/onu/${safePort}/${onu.onu_id}/detail`);
                                                    }
                                                }}
                                                className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-md transition-colors"
                                                title="Detail ONU"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setSelectedOnuForService(onu);
                                                    setIsServiceModalOpen(true);
                                                }}
                                                className="text-amber-500 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 p-1.5 rounded-md transition-colors"
                                                title="Konfigurasi Layanan"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteOnu(onu)}
                                                className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors"
                                                title="Hapus / Jadikan Unconfigured"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-neutral-500 dark:text-neutral-400">
                                        {!selectedPortIndex ? "Silakan pilih Port PON pada dropdown di atas." : "Tidak ada modem (ONU) yang terhubung di port ini."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!loadingOnus && onus.length > 0 && (
                    <TablePagination 
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        setItemsPerPage={setItemsPerPage}
                        totalItems={onus.length}
                        paginatedLength={currentOnuData.length}
                        itemName="Modem"
                    />
                )}
            </Card>
        </div>
                {isUncfgModalOpen && (
                <GponProvisionModal
                    isOpen={isUncfgModalOpen}
                    onClose={() => setIsUncfgModalOpen(false)}
                    olt={olt}
                    ports={ports}
                    onSuccess={(sn) => {
                        setIsUncfgModalOpen(false);
                        if (sn) {
                            setRecentlyProvisioned({ sn, time: Date.now() });
                        }
                        handleRefresh();
                    }}
                />
            )}
            
            {isServiceModalOpen && selectedOnuForService && (
                <GponServiceModal
                    isOpen={isServiceModalOpen}
                    onClose={() => setIsServiceModalOpen(false)}
                    olt={olt}
                    onu={selectedOnuForService}
                    port={ports.find(p => String(p.index) === selectedPortIndex)?.name?.replace('gpon_', '') || ''}
                    onSuccess={() => {
                        setIsServiceModalOpen(false);
                        handleRefresh();
                    }}
                />
            )}
        </>
    );
}

OltMonitoring.layout = {
    breadcrumbs: [
        {
            title: 'Monitoring OLT',
            href: '/olt-monitoring-index',
        },
    ],
};
