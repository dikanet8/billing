import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Power, Trash2, Edit2, ShieldAlert, ArrowLeft, RefreshCw, Download, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function OnuDetail({ olt, port, onuId }: { olt: any, port: string, onuId: string }) {
    const [detail, setDetail] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Edit state
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);
    const [isSavingDesc, setIsSavingDesc] = useState(false);
    
    // SSR Fix
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Traffic data state
    const [trafficData, setTrafficData] = useState<any[]>([]);
    const [currentDownload, setCurrentDownload] = useState(0);
    const [currentUpload, setCurrentUpload] = useState(0);

    const safePort = port.replace(/\//g, '-');

    const fetchDetail = async () => {
        try {
            const res = await fetch(`/api/olt/${olt.id}/onu/${safePort}/${onuId}/detail`);
            const json = await res.json();
            if (json.status === 'success') {
                setDetail(json.data);
                setLogs(json.logs || []);
                setEditName(json.data.name || '');
                setEditDesc(json.data.description || '');
            }
        } catch (e) {
            console.error("Failed to fetch ONU detail", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchTraffic = async () => {
        try {
            const res = await fetch(`/api/olt/${olt.id}/onu/${safePort}/${onuId}/traffic`);
            const json = await res.json();
            if (json.status === 'success') {
                const now = new Date();
                const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
                
                setCurrentDownload(json.download);
                setCurrentUpload(json.upload);

                setTrafficData(prev => {
                    const newData = [...prev, { time: timeStr, download: json.download, upload: json.upload }];
                    if (newData.length > 20) newData.shift(); // Keep last 20 points
                    return newData;
                });
            }
        } catch (e) {
            console.error("Failed to fetch traffic", e);
        }
    };

    useEffect(() => {
        fetchDetail();
        fetchTraffic();
        // Poll traffic every 5 seconds
        const interval = setInterval(fetchTraffic, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSaveName = async () => {
        setIsSavingName(true);
        try {
            const res = await fetch(`/api/olt/${olt.id}/onu/${safePort}/${onuId}/name`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ name: editName, description: detail?.description ?? '' })
            });
            const json = await res.json();
            if (json.status === 'success') {
                toast.success('Berhasil mengubah nama ONU!');
                setIsEditingName(false);
                fetchDetail();
            } else {
                toast.error(json.message || 'Gagal mengubah nama');
            }
        } catch (e) {
            toast.error('Gagal menghubungi server');
        } finally {
            setIsSavingName(false);
        }
    };

    const handleSaveDesc = async () => {
        setIsSavingDesc(true);
        try {
            const res = await fetch(`/api/olt/${olt.id}/onu/${safePort}/${onuId}/name`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ name: detail?.name ?? onuId, description: editDesc })
            });
            const json = await res.json();
            if (json.status === 'success') {
                toast.success('Berhasil mengubah deskripsi ONU!');
                setIsEditingDesc(false);
                fetchDetail();
            } else {
                toast.error(json.message || 'Gagal mengubah nama');
            }
        } catch (e) {
            toast.error('Gagal menghubungi server');
        } finally {
            setIsSavingDesc(false);
        }
    };

    const handleAction = async (action: string) => {
        if (!confirm(`Apakah Anda yakin ingin melakukan: ${action}?`)) return;
        
        try {
            const res = await fetch(`/api/olt/${olt.id}/onu/${safePort}/${onuId}/action`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ action })
            });
            const json = await res.json();
            if (json.status === 'success') {
                toast.success(json.message);
                fetchDetail();
            } else {
                toast.error(json.message || 'Gagal melakukan aksi');
            }
        } catch (e) {
            toast.error('Gagal menghubungi server');
        }
    };

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            window.history.back();
            return;
        }

        router.visit('/olt-monitoring-index');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col p-4 sm:p-6 lg:p-8 space-y-6">
            <Head title={`Detail ONU ${onuId}`} />

            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                        Detail ONU
                    </h1>
                    <p className="text-sm text-neutral-500">
                        {olt.name} / {port.replace(/-/g, '/')} / ONU ID: {onuId}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Detail */}
                <div className="lg:col-span-2">
                    <Card className="p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold flex items-center gap-2 border-l-4 border-indigo-500 pl-2">
                                Detail Pelanggan & Perangkat
                            </h2>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                            {/* Row 1 */}
                            <div>
                                <div className="text-[13px] font-bold text-[#1e293b] mb-1">OLT</div>
                                <div className="text-[13px] text-neutral-600">{detail?.olt_name || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="text-[13px] font-bold text-[#1e293b] mb-1 capitalize">{detail?.type} Onu</div>
                                <div>
                                    <span className="bg-amber-400 text-amber-900 font-bold px-2 py-0.5 rounded text-xs">
                                        {port.replace(/^.*_/, '').replace(/-/g, '/')} : {onuId}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <div className="text-[13px] font-bold text-[#1e293b] mb-1">Type</div>
                                <div className="text-[13px] text-neutral-600">{detail?.onu_type || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="text-[13px] font-bold text-[#1e293b] mb-1">Merk / Vendor</div>
                                <div className="text-[13px] text-neutral-600 flex items-center gap-1.5">
                                    {detail?.vendor || 'Unknown'}
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div>
                                <div className="text-[13px] font-bold text-[#1e293b] mb-1">Serial Number / MAC</div>
                                <div className="text-[13px] text-neutral-600 flex items-center gap-1.5">
                                    {detail?.mac_sn || 'N/A'}
                                </div>
                            </div>
                            <div>
                                <div className="text-[13px] font-bold text-[#1e293b] mb-1">OLT / Onu RX</div>
                                <div className="text-[13px] text-neutral-600">
                                    {detail?.olt_rx || 'N/A'} / {detail?.rx_power || 'N/A'}
                                </div>
                            </div>
                            <div>
                                <div className="text-[13px] font-bold text-[#1e293b] mb-1">Status</div>
                                <div>
                                    <span className={detail?.status === 'Online' ? 'bg-[#2e8b57] text-white font-bold px-2 py-0.5 rounded text-xs' : 'bg-red-600 text-white font-bold px-2 py-0.5 rounded text-xs'}>
                                        {detail?.status || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <div className="text-[13px] font-bold text-[#1e293b] mb-1">Online Duration</div>
                                <div className="text-[13px] text-neutral-600">
                                    {detail?.online_duration || 'Offline'}
                                </div>
                            </div>

                            {/* Row 3 */}
                            <div className="col-span-2 md:col-span-4 bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-lg mt-2">
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Kolom Nama Pelanggan */}
                                    <div>
                                        <div className="text-[13px] font-bold text-[#1e293b] mb-1">Nama Pelanggan</div>
                                        {isEditingName ? (
                                            <div className="flex items-center gap-2 mt-1">
                                                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-xs w-full" placeholder="Nama Pelanggan" />
                                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0" onClick={() => { setIsEditingName(false); setEditName(detail?.name || ''); }} disabled={isSavingName}>✕</Button>
                                                <Button size="sm" className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shrink-0" onClick={handleSaveName} disabled={isSavingName}>
                                                    {isSavingName ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Menyimpan</> : 'Simpan'}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="text-[13px] text-neutral-600 font-medium">
                                                    {detail?.name || 'N/A'}
                                                </div>
                                                <button onClick={() => setIsEditingName(true)} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[11px] font-medium opacity-70 hover:opacity-100">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Kolom Deskripsi */}
                                    <div>
                                        <div className="text-[13px] font-bold text-[#1e293b] mb-1">Deskripsi</div>
                                        {isEditingDesc ? (
                                            <div className="flex items-center gap-2 mt-1">
                                                <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="h-8 text-xs w-full" placeholder="Deskripsi" />
                                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0" onClick={() => { setIsEditingDesc(false); setEditDesc(detail?.description || ''); }} disabled={isSavingDesc}>✕</Button>
                                                <Button size="sm" className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shrink-0" onClick={handleSaveDesc} disabled={isSavingDesc}>
                                                    {isSavingDesc ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Menyimpan</> : 'Simpan'}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="text-[13px] text-neutral-600 font-medium">
                                                    {detail?.description || 'N/A'}
                                                </div>
                                                <button onClick={() => setIsEditingDesc(true)} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[11px] font-medium opacity-70 hover:opacity-100">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>



                        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-sidebar-border">
                            <Button variant="outline" className="gap-2" onClick={() => handleAction('reboot')}>
                                <Power className="w-4 h-4 text-orange-500" /> Reboot ONU
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right Side: Logs */}
                <div className="lg:col-span-1 lg:relative flex flex-col h-[450px] lg:h-auto">
                    <div className="lg:absolute lg:inset-0 h-full">
                        <Card className="p-6 h-full flex flex-col">
                            <h2 className="text-lg font-semibold flex items-center gap-2 border-l-4 border-indigo-500 pl-2 mb-6 shrink-0">
                                Alarm / Log History
                            </h2>
                            
                            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                            {logs.length > 0 ? (
                                logs.map((log, i) => {
                                    const isOnline = log.message.includes('Online');
                                    const isOffline = log.message.includes('Offline');
                                    const bulletColor = isOnline ? 'bg-emerald-500' : (isOffline ? 'bg-rose-500' : 'bg-orange-400');
                                    
                                    return (
                                        <div key={i} className="flex gap-3 text-sm">
                                            <div className="mt-0.5 shrink-0">
                                                <div className={`w-2 h-2 rounded-full ${bulletColor}`}></div>
                                            </div>
                                        <div>
                                            <div className="text-neutral-500 text-xs mb-0.5">{log.time}</div>
                                            <div className="text-neutral-800 dark:text-neutral-200">{log.message}</div>
                                        </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-neutral-400 py-10 flex flex-col items-center">
                                    <ShieldAlert className="w-10 h-10 mb-3 opacity-20" />
                                    <p>Tidak ada alarm / log terekam.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                    </div>
                </div>
            </div>

            {/* Bottom: Traffic Graph */}
            <div className="w-full">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2 border-l-4 border-indigo-500 pl-2">
                            Grafik Trafik (Live)
                        </h2>
                        <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-1.5 text-rose-500 font-medium">
                                <Download className="w-4 h-4" /> {currentDownload} Kbps
                            </div>
                            <div className="flex items-center gap-1.5 text-blue-500 font-medium">
                                <Upload className="w-4 h-4" /> {currentUpload} Kbps
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-[300px] w-full mt-4">
                        {isMounted && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-neutral-800" />
                                    <XAxis dataKey="time" tick={{ fontSize: 10 }} tickMargin={10} stroke="#9ca3af" />
                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `${val}`} stroke="#9ca3af" />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#f9fafb', fontSize: '12px' }}
                                        itemStyle={{ color: '#f9fafb' }}
                                    />
                                    <Area type="monotone" dataKey="download" stroke="#f43f5e" fillOpacity={1} fill="url(#colorDownload)" name="Download (Kbps)" isAnimationActive={false} />
                                    <Area type="monotone" dataKey="upload" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUpload)" name="Upload (Kbps)" isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>
            </div>


        </div>
    );
}

OnuDetail.layout = {
    breadcrumbs: [
        {
            title: 'Monitoring OLT',
            href: '/olt-monitoring-index',
        },
        {
            title: 'Detail ONU',
            href: '#',
        },
    ],
};
