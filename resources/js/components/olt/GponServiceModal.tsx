import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function GponServiceModal({
    isOpen,
    onClose,
    onSuccess,
    olt,
    onu,
    port
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    olt: any;
    onu: any;
    port: string;
}) {
    const [profiles, setProfiles] = useState<string[]>([]);
    const [vlans, setVlans] = useState<string[]>([]);
    const [isConfiguring, setIsConfiguring] = useState(false);
    
    const [formData, setFormData] = useState({
        tcont_id: '1',
        gemport_id: '1',
        tcont_profile: '',
        vlan: '10',
        mode: 'bridge',
        pppoe_user: '',
        pppoe_pass: '',
        static_ip: '',
        static_mask: '255.255.255.0',
        static_gw: '',
        tcont_name: 'internet',
        gemport_name: 'internet',
        encryption_mode: 'disable'
    });

    useEffect(() => {
        if (isOpen && olt) {
            fetchProfiles();
            fetchVlans();
        }
    }, [isOpen, olt]);

    const fetchProfiles = async () => {
        try {
            const response = await fetch(`/api/olt/${olt.id}/gpon/profiles`);
            const data = await response.json();
            if (data.status === 'success') {
                setProfiles(data.data);
                if (data.data.length > 0) {
                    setFormData(prev => ({ ...prev, tcont_profile: data.data[0] }));
                }
            }
        } catch (err: any) {
            console.error('Failed to load profiles');
        }
    };

    const fetchVlans = async () => {
        try {
            const response = await fetch(`/api/olt/${olt.id}/gpon/vlans`);
            const data = await response.json();
            if (data.status === 'success') {
                setVlans(data.data);
                if (data.data.length > 0) {
                    setFormData(prev => ({ ...prev, vlan: data.data[0] }));
                }
            }
        } catch (err: any) {
            console.error('Failed to load VLANs');
        }
    };

    const handleConfigure = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsConfiguring(true);

        try {
            const response = await fetch(`/api/olt/${olt.id}/gpon/service`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content
                },
                body: JSON.stringify({
                    port: port,
                    onu_id: onu?.onu_id,
                    ...formData
                })
            });

            const data = await response.json();
            if (response.ok && data.status === 'success') {
                toast.success(data.message);
                if (onSuccess) {
                    onSuccess();
                } else {
                    onClose();
                }
            } else {
                toast.error(data.message || 'Gagal mengkonfigurasi layanan');
            }
        } catch (err) {
            toast.error('Terjadi kesalahan jaringan saat konfigurasi');
        } finally {
            setIsConfiguring(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="w-[95vw] max-h-[90vh] sm:max-w-2xl border-sidebar-border/70 p-0 overflow-hidden gap-0 bg-white dark:bg-neutral-950 rounded-xl">
                <DialogHeader className="relative px-6 py-4 border-b border-sidebar-border/70 overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/20">
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-indigo-600 dark:text-indigo-400 rounded-lg shadow-sm flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </div>
                        <div className="flex flex-col gap-0.5 text-left">
                            <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                                Konfigurasi Layanan ONU
                            </DialogTitle>
                            <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                                Atur parameter VLAN, TCONT, dan Internet/WAN untuk ONU <strong>{onu?.name}</strong> (ID: {onu?.onu_id}).
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleConfigure} className="flex flex-col max-h-[calc(90vh-140px)]">
                    <div className="flex flex-col px-6 py-6 gap-6 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="tcont_id" className="text-neutral-700 dark:text-neutral-300">TCONT ID <span className="text-red-500">*</span></Label>
                                <Input
                                    id="tcont_id"
                                    type="number"
                                    value={formData.tcont_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tcont_id: e.target.value }))}
                                    required
                                    className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-indigo-500"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="tcont_profile" className="text-neutral-700 dark:text-neutral-300">TCONT Profile <span className="text-red-500">*</span></Label>
                                <select
                                    id="tcont_profile"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-indigo-800"
                                    value={formData.tcont_profile}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tcont_profile: e.target.value }))}
                                    required
                                >
                                    {profiles.length === 0 && <option value="">Memuat profile...</option>}
                                    {profiles.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="tcont_name" className="text-neutral-700 dark:text-neutral-300">TCONT Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="tcont_name"
                                    type="text"
                                    value={formData.tcont_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tcont_name: e.target.value }))}
                                    required
                                    className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-indigo-500"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="gemport_name" className="text-neutral-700 dark:text-neutral-300">GEMPORT Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="gemport_name"
                                    type="text"
                                    value={formData.gemport_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, gemport_name: e.target.value }))}
                                    required
                                    className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-indigo-500"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="gemport_id" className="text-neutral-700 dark:text-neutral-300">GEMPORT ID <span className="text-red-500">*</span></Label>
                                <Input
                                    id="gemport_id"
                                    type="number"
                                    value={formData.gemport_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, gemport_id: e.target.value }))}
                                    required
                                    className="bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-indigo-500"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="vlan" className="text-neutral-700 dark:text-neutral-300">VLAN ID <span className="text-red-500">*</span></Label>
                                <select
                                    id="vlan"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-indigo-800"
                                    value={formData.vlan}
                                    onChange={(e) => setFormData(prev => ({ ...prev, vlan: e.target.value }))}
                                    required
                                >
                                    {vlans.length === 0 && <option value="">Memuat VLAN...</option>}
                                    {vlans.map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="encryption_mode" className="text-neutral-700 dark:text-neutral-300">Encryption Mode</Label>
                                <select
                                    id="encryption_mode"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-indigo-800"
                                    value={formData.encryption_mode}
                                    onChange={(e) => setFormData(prev => ({ ...prev, encryption_mode: e.target.value }))}
                                >
                                    <option value="disable">Disable</option>
                                    <option value="aes">AES</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 border-t border-neutral-200 dark:border-neutral-800 pt-5 mt-2">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="mode" className="text-neutral-700 dark:text-neutral-300 font-semibold">Mode WAN / Internet</Label>
                                <select
                                    id="mode"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-indigo-800"
                                    value={formData.mode}
                                    onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value }))}
                                >
                                    <option value="bridge">Bridge (Dial dari Router/Mikrotik)</option>
                                    <option value="pppoe">PPPoE (Dial dari Modem)</option>
                                    <option value="dhcp">DHCP (Otomatis dari OLT/Router)</option>
                                    <option value="static">Static IP</option>
                                </select>
                            </div>
                            
                            {formData.mode === 'pppoe' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-2 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="pppoe_user" className="text-indigo-900 dark:text-indigo-300">PPPoE Username</Label>
                                        <Input
                                            id="pppoe_user"
                                            value={formData.pppoe_user}
                                            onChange={(e) => setFormData(prev => ({ ...prev, pppoe_user: e.target.value }))}
                                            required
                                            className="bg-white dark:bg-neutral-900 border-indigo-200 dark:border-indigo-800 focus-visible:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="pppoe_pass" className="text-indigo-900 dark:text-indigo-300">PPPoE Password</Label>
                                        <Input
                                            id="pppoe_pass"
                                            type="password"
                                            value={formData.pppoe_pass}
                                            onChange={(e) => setFormData(prev => ({ ...prev, pppoe_pass: e.target.value }))}
                                            required
                                            className="bg-white dark:bg-neutral-900 border-indigo-200 dark:border-indigo-800 focus-visible:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {formData.mode === 'static' && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 animate-in fade-in slide-in-from-top-2 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="static_ip" className="text-indigo-900 dark:text-indigo-300">IP Address</Label>
                                        <Input
                                            id="static_ip"
                                            value={formData.static_ip}
                                            onChange={(e) => setFormData(prev => ({ ...prev, static_ip: e.target.value }))}
                                            placeholder="192.168.1.2"
                                            required
                                            className="bg-white dark:bg-neutral-900 border-indigo-200 dark:border-indigo-800 focus-visible:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="static_mask" className="text-indigo-900 dark:text-indigo-300">Subnet Mask</Label>
                                        <Input
                                            id="static_mask"
                                            value={formData.static_mask}
                                            onChange={(e) => setFormData(prev => ({ ...prev, static_mask: e.target.value }))}
                                            required
                                            className="bg-white dark:bg-neutral-900 border-indigo-200 dark:border-indigo-800 focus-visible:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="static_gw" className="text-indigo-900 dark:text-indigo-300">Gateway</Label>
                                        <Input
                                            id="static_gw"
                                            value={formData.static_gw}
                                            onChange={(e) => setFormData(prev => ({ ...prev, static_gw: e.target.value }))}
                                            placeholder="192.168.1.1"
                                            required
                                            className="bg-white dark:bg-neutral-900 border-indigo-200 dark:border-indigo-800 focus-visible:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-sidebar-border/70 bg-neutral-50/50 dark:bg-neutral-900/20 sm:justify-end shrink-0">
                        <Button type="button" variant="outline" className="bg-white dark:bg-neutral-950" onClick={() => onClose()}>
                            Batal
                        </Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]" disabled={isConfiguring}>
                            {isConfiguring && <Spinner className="w-4 h-4 mr-2" />}
                            {isConfiguring ? 'Menyimpan...' : 'Simpan Layanan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
