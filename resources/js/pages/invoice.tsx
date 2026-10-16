import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Printer, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Invoice({ transaksi, tenant }: { transaksi: any, tenant: any }) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    const formatPeriode = (periodeStr: string) => {
        if (!periodeStr) return '-';
        return periodeStr;
    };

    const tenantName = tenant?.nama || 'ISP BILLING';
    const tenantAddress = tenant?.alamat || '-';
    const tenantPhone = tenant?.telepon || '-';
    const tenantEmail = tenant?.email || '-';

    return (
        <div className="min-h-screen bg-[#f4f6f9] flex justify-center py-4 md:py-[40px] print:py-0 print:bg-white font-sans text-[#333]">
            <Head title={`Invoice - ${transaksi.invoice_number}`} />

            <div className="w-full max-w-[800px] bg-white shadow-[0_4px_15px_rgba(0,0,0,0.05)] print:shadow-none p-5 md:p-[50px] print:p-[20px] rounded-[8px] mx-3 md:mx-0 relative">
                {/* Print Controls (Hidden when printing) */}
                <div className="flex flex-col md:flex-row justify-end gap-3 mb-6 md:mb-[30px] print:hidden">
                    <Button 
                        onClick={() => {
                            let phone = transaksi.pelanggan?.telepon || '';
                            if (phone.startsWith('0')) {
                                phone = '62' + phone.substring(1);
                            }
                            const cleanPhone = phone.replace(/\D/g, '');
                            const msg = encodeURIComponent(`Halo ${transaksi.pelanggan?.nama},\n\nBerikut adalah tagihan/invoice layanan internet Anda:\n\n*Invoice:* ${transaksi.invoice_number}\n*Periode:* ${formatPeriode(transaksi.tagihan?.bulan_tagihan)}\n*Total Tagihan:* Rp ${new Intl.NumberFormat('id-ID').format(transaksi.jumlah_bayar || transaksi.nominal)}\n*Status:* LUNAS\n\nTerima kasih atas kepercayaannya menggunakan layanan kami.\n- ${tenantName}`);
                            window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
                        }} 
                        className="bg-[#25d366] hover:bg-[#1aa251] text-white w-full md:w-auto"
                    >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Kirim ke WA
                    </Button>
                    <Button onClick={() => window.print()} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white w-full md:w-auto">
                        <Printer className="w-4 h-4 mr-2" />
                        Simpan PDF / Cetak
                    </Button>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-[#eee] pb-5 md:pb-[20px] mb-6 md:mb-[30px] gap-4 md:gap-0">
                    <div>
                        <h1 className="m-0 text-[#2563eb] text-[24px] md:text-[28px] font-bold leading-tight">{tenantName}</h1>
                        <p className="mt-[5px] mb-0 text-[#666] text-[13px] md:text-[14px] max-w-[300px]">{tenantAddress}</p>
                        {tenantEmail !== '-' && <p className="mt-[5px] mb-0 text-[#666] text-[13px] md:text-[14px]">Email: {tenantEmail}</p>}
                        {tenantPhone !== '-' && <p className="mt-[5px] mb-0 text-[#666] text-[13px] md:text-[14px]">Telp: {tenantPhone}</p>}
                    </div>
                    <div className="text-left md:text-right w-full md:w-auto bg-[#f8fafc] md:bg-transparent p-4 md:p-0 rounded-lg md:rounded-none border md:border-none border-[#eee]">
                        <h2 className="m-0 text-[24px] md:text-[32px] text-[#333] uppercase tracking-[2px] font-bold leading-tight">INVOICE</h2>
                        <p className="mt-[5px] mb-0 text-[14px] md:text-[16px] text-[#666] font-medium"># {transaksi.invoice_number}</p>
                        <div className="inline-block mt-[10px] px-[12px] py-[6px] rounded-[4px] text-[13px] md:text-[14px] font-bold bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]">
                            LUNAS
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-0 mb-8 md:mb-[40px]">
                    <div className="w-full md:w-[48%]">
                        <h3 className="mt-0 mb-[10px] pb-[5px] text-[#444] text-[15px] md:text-[16px] border-b border-[#eee] font-bold">Ditagihkan Kepada:</h3>
                        <p className="m-0 mb-[5px] text-[13px] md:text-[14px] text-[#555] leading-[1.5]"><strong>{transaksi.pelanggan?.nama || '-'}</strong></p>
                        <p className="m-0 mb-[5px] text-[13px] md:text-[14px] text-[#555] leading-[1.5]">ID Pelanggan: {transaksi.pelanggan?.nomor_pelanggan || transaksi.pelanggan?.id || '-'}</p>
                        <p className="m-0 mb-[5px] text-[13px] md:text-[14px] text-[#555] leading-[1.5]">{transaksi.pelanggan?.alamat || '-'}</p>
                        <p className="m-0 mb-[5px] text-[13px] md:text-[14px] text-[#555] leading-[1.5]">Telp: {transaksi.pelanggan?.telepon || '-'}</p>
                    </div>
                    <div className="w-full md:w-[48%] text-left md:text-right">
                        <h3 className="mt-0 mb-[10px] pb-[5px] text-[#444] text-[15px] md:text-[16px] border-b border-[#eee] font-bold">Detail Pembayaran:</h3>
                        <p suppressHydrationWarning className="m-0 mb-[5px] text-[13px] md:text-[14px] text-[#555] leading-[1.5]"><strong>Tanggal Invoice:</strong> <br className="hidden md:block" /> <span className="md:hidden"> </span> {new Date(transaksi.tagihan?.created_at || transaksi.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="m-0 mb-[5px] text-[13px] md:text-[14px] text-[#555] leading-[1.5]" suppressHydrationWarning><strong>Tanggal Dibayar:</strong> <br className="hidden md:block" /> <span className="md:hidden"> </span> {formatDate(transaksi.tgl_bayar)}</p>
                        <p className="m-0 mb-[5px] text-[13px] md:text-[14px] text-[#555] leading-[1.5]"><strong>Metode Pembayaran:</strong> <br className="hidden md:block" /> <span className="md:hidden"> </span> {transaksi.metode_bayar || '-'}</p>
                        <p className="m-0 mb-[5px] text-[13px] md:text-[14px] text-[#555] leading-[1.5]"><strong>Diterima Oleh:</strong> <br className="hidden md:block" /> <span className="md:hidden"> </span> {transaksi.user?.name || '-'}</p>
                    </div>
                </div>

                {/* Items Table & Mobile Cards */}
                <div className="w-full mb-8 md:mb-[30px]">
                    <table className="hidden md:table w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="p-[12px_15px] text-left border-b border-[#eee] bg-[#f8fafc] text-[#333] font-semibold text-[14px]">Deskripsi Layanan</th>
                                <th className="p-[12px_15px] text-left border-b border-[#eee] bg-[#f8fafc] text-[#333] font-semibold text-[14px]">Periode</th>
                                <th className="p-[12px_15px] text-right border-b border-[#eee] bg-[#f8fafc] text-[#333] font-semibold text-[14px]">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-[12px_15px] text-left border-b border-[#eee] text-[14px] text-[#555]">
                                    <strong>{transaksi.pelanggan?.paket?.paket_nama || 'Paket Internet'}</strong><br />
                                    <span style={{ fontSize: '12px', color: '#777' }}>Kecepatan: {transaksi.pelanggan?.paket?.kecepatan || '-'} Mbps | Akun PPPoE: {transaksi.pelanggan?.pppoe || '-'}</span>
                                </td>
                                <td className="p-[12px_15px] text-left border-b border-[#eee] text-[14px] text-[#555]" suppressHydrationWarning>{formatPeriode(transaksi.tagihan?.bulan_tagihan)}</td>
                                <td className="p-[12px_15px] text-right border-b border-[#eee] text-[14px] text-[#555]" suppressHydrationWarning>
                                    Rp {new Intl.NumberFormat('id-ID').format(transaksi.jumlah_bayar || transaksi.nominal)}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Mobile Card Layout */}
                    <div className="md:hidden flex flex-col gap-3">
                        <div className="p-4 border border-[#eee] rounded-[8px] bg-[#f8fafc]">
                            <div className="font-bold text-[14px] text-[#333] mb-1">
                                {transaksi.pelanggan?.paket?.paket_nama || 'Paket Internet'}
                            </div>
                            <div className="text-[12px] text-[#777] mb-3 leading-snug">
                                Kecepatan: {transaksi.pelanggan?.paket?.kecepatan || '-'} Mbps<br/>
                                Akun PPPoE: {transaksi.pelanggan?.pppoe || '-'}
                            </div>
                            <div className="flex justify-between items-center border-t border-[#eee] pt-3 mt-3">
                                <span className="text-[12px] text-[#555] font-medium">Periode: {formatPeriode(transaksi.tagihan?.bulan_tagihan)}</span>
                                <span className="text-[14px] font-bold text-[#2563eb]" suppressHydrationWarning>Rp {new Intl.NumberFormat('id-ID').format(transaksi.jumlah_bayar || transaksi.nominal)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mb-[40px]">
                    <div className="w-full md:w-[300px] bg-[#f8fafc] md:bg-transparent p-4 md:p-0 rounded-lg md:rounded-none border border-[#eee] md:border-none">
                        <div className="flex justify-between py-[10px] text-[14px] border-b border-[#eee]">
                            <span className="font-medium">Subtotal</span>
                            <span suppressHydrationWarning>Rp {new Intl.NumberFormat('id-ID').format(transaksi.jumlah_bayar || transaksi.nominal)}</span>
                        </div>
                        <div className="flex justify-between py-[15px] text-[16px] md:text-[18px] font-bold text-[#111]">
                            <span>Total Tagihan</span>
                            <span className="text-[#2563eb] md:text-[#111]" suppressHydrationWarning>Rp {new Intl.NumberFormat('id-ID').format(transaksi.jumlah_bayar || transaksi.nominal)}</span>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-[20px] md:mt-[40px] pt-[20px] border-t border-dashed border-[#ddd] text-[12px] md:text-[13px] text-[#777]">
                    {tenant?.invoice_footer || 'Terima kasih atas pembayaran Anda. Harap simpan struk ini sebagai bukti pembayaran yang sah.'}
                </div>
            </div>
        </div>
    );
}

Invoice.layout = (page: any) => page;

