import { Head } from '@inertiajs/react';
import { Building, FileText, Upload, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { useForm } from '@inertiajs/react';

import { useState } from 'react';

export default function PengaturanBilling({ tenant }: { tenant: any }) {
    const { data, setData, post, processing, errors } = useForm({
        nama: tenant?.nama || '',
        alamat: tenant?.alamat || '',
        telepon: tenant?.telepon || '',
        email: tenant?.email || '',
        invoice_footer: tenant?.invoice_footer || 'Terima kasih atas pembayaran Anda. Harap simpan struk ini sebagai bukti pembayaran yang sah.',
        jatuh_tempo_default: tenant?.jatuh_tempo_default || 10,
    });
    
    const [submittingSection, setSubmittingSection] = useState<'informasi' | 'invoice' | null>(null);

    const handleSaveInformasi = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingSection('informasi');
        post('/pengaturan-billing', {
            preserveScroll: true,
            onSuccess: () => toast.success('Informasi perusahaan berhasil disimpan!'),
            onError: () => toast.error('Gagal menyimpan pengaturan, silakan periksa isian form.'),
            onFinish: () => setSubmittingSection(null)
        });
    };

    const handleSaveInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingSection('invoice');
        post('/pengaturan-billing', {
            preserveScroll: true,
            onSuccess: () => toast.success('Pengaturan invoice berhasil disimpan!'),
            onError: () => toast.error('Gagal menyimpan pengaturan, silakan periksa isian form.'),
            onFinish: () => setSubmittingSection(null)
        });
    };

    return (
        <>
            <Head title="Pengaturan Umum" />
            <div className="flex h-full flex-1 flex-col items-center p-4 lg:p-6">
                <div className="w-full max-w-3xl flex flex-col gap-6">
                    {/* Logo Perusahaan */}
                    <Card className="p-6 border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-neutral-500" /> Logo Perusahaan
                        </h2>
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg p-6 bg-neutral-50 dark:bg-neutral-950">
                            <div className="w-24 h-24 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mb-4 shadow-sm overflow-hidden">
                                {tenant?.logo ? (
                                    <img src={`/storage/${tenant.logo}`} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                                )}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => toast.info('Fitur unggah logo akan segera tersedia')}>
                                Unggah Logo Baru
                            </Button>
                            <p className="text-[10px] text-neutral-500 text-center mt-3">Format disarankan: PNG atau JPG transparan (Maks. 2MB)</p>
                        </div>
                    </Card>

                    {/* Informasi Perusahaan */}
                    <Card className="p-6 border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                            <Building className="w-5 h-5 text-neutral-500" /> Informasi Perusahaan
                        </h2>
                        <form onSubmit={handleSaveInformasi} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Nama Perusahaan / ISP</label>
                                <Input value={data.nama} onChange={(e) => setData('nama', e.target.value)} className="bg-white dark:bg-neutral-950" />
                                {errors.nama && <span className="text-red-500 text-xs">{errors.nama}</span>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Alamat Perusahaan</label>
                                <Input value={data.alamat} onChange={(e) => setData('alamat', e.target.value)} className="bg-white dark:bg-neutral-950" />
                                {errors.alamat && <span className="text-red-500 text-xs">{errors.alamat}</span>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Nomor Telepon / WA</label>
                                    <Input value={data.telepon} onChange={(e) => setData('telepon', e.target.value)} className="bg-white dark:bg-neutral-950" />
                                    {errors.telepon && <span className="text-red-500 text-xs">{errors.telepon}</span>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email Kontak</label>
                                    <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="bg-white dark:bg-neutral-950" />
                                    {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
                                </div>
                            </div>
                            <div className="pt-2">
                                <Button type="submit" disabled={processing && submittingSection === 'informasi'} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
                                    {processing && submittingSection === 'informasi' ? <Spinner className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
                                    {processing && submittingSection === 'informasi' ? 'Menyimpan...' : 'Simpan Informasi'}
                                </Button>
                            </div>
                        </form>
                    </Card>

                    {/* Pengaturan Invoice */}
                    <Card className="p-6 border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-neutral-900 rounded-xl shadow-sm">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-neutral-500" /> Pengaturan Invoice & Tagihan
                        </h2>
                        <form onSubmit={handleSaveInvoice} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Pesan Bawah Invoice (Footer)</label>
                                <Input value={data.invoice_footer} onChange={(e) => setData('invoice_footer', e.target.value)} className="bg-white dark:bg-neutral-950" />
                                {errors.invoice_footer && <span className="text-red-500 text-xs">{errors.invoice_footer}</span>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Jatuh Tempo Default (Tanggal)</label>
                                <Input type="number" value={data.jatuh_tempo_default} onChange={(e) => setData('jatuh_tempo_default', parseInt(e.target.value) || 10)} className="bg-white dark:bg-neutral-950 w-full md:w-1/3" min="1" max="28" />
                                <p className="text-xs text-neutral-500">Tanggal default setiap bulannya untuk penagihan pelanggan baru.</p>
                                {errors.jatuh_tempo_default && <span className="text-red-500 text-xs">{errors.jatuh_tempo_default}</span>}
                            </div>
                            <div className="pt-2">
                                <Button type="submit" disabled={processing && submittingSection === 'invoice'} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
                                    {processing && submittingSection === 'invoice' ? <Spinner className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
                                    {processing && submittingSection === 'invoice' ? 'Menyimpan...' : 'Simpan Pengaturan Invoice'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </>
    );
}

PengaturanBilling.layout = {
    breadcrumbs: [
        {
            title: 'Pengaturan Umum',
            href: '/pengaturan-billing',
        },
    ],
};
