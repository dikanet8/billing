<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice Pembayaran - {{ $tagihan->nomor_tagihan ?? ('INV-' . $tagihan->id_tagihan) }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 40px;
            background-color: #f4f6f9;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background-color: #fff;
            padding: 50px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            border-radius: 8px;
        }
        .layout-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            border: none;
        }
        .layout-table td {
            vertical-align: top;
            border: none;
            padding: 0;
        }
        .company-name {
            margin: 0;
            color: #2563eb;
            font-size: 28px;
        }
        .company-desc {
            margin: 5px 0 0;
            color: #666;
            font-size: 14px;
            line-height: 1.5;
        }
        .invoice-title {
            margin: 0;
            font-size: 32px;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .invoice-num {
            margin: 5px 0 0;
            font-size: 16px;
            color: #666;
        }
        .section-title {
            margin-top: 0;
            color: #444;
            font-size: 16px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        .info-text {
            margin: 0 0 5px;
            font-size: 14px;
            color: #555;
            line-height: 1.5;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th, .items-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        .items-table th {
            background-color: #f8fafc;
            color: #333;
            font-weight: 600;
            font-size: 14px;
        }
        .items-table td {
            font-size: 14px;
            color: #555;
        }
        .text-right {
            text-align: right !important;
        }
        .text-center {
            text-align: center !important;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
            margin-top: 10px;
        }
        .status-paid {
            background-color: #dcfce7;
            color: #166534;
            border: 1px solid #bbf7d0;
        }
        .status-unpaid {
            background-color: #fee2e2;
            color: #991b1b;
            border: 1px solid #fecaca;
        }
        .totals-table {
            width: 350px;
            border-collapse: collapse;
            float: right;
        }
        .totals-table td {
            padding: 10px 15px;
            font-size: 14px;
            border-bottom: 1px solid #eee;
        }
        .totals-table tr.grand-total td {
            font-size: 18px;
            font-weight: bold;
            color: #111;
            border-bottom: none;
            padding-top: 15px;
        }
        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
        
        /* Action buttons */
        .actions {
            text-align: center;
            margin-top: 30px;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            margin: 0 5px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: bold;
            text-decoration: none;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
        }
        .btn-print {
            background-color: #2563eb;
            color: #fff;
        }
        .btn-print:hover {
            background-color: #1d4ed8;
        }
        .btn-wa {
            background-color: #25d366;
            color: #fff;
        }
        .btn-wa:hover {
            background-color: #1aa251;
        }

        @media print {
            body {
                background-color: #fff;
                padding: 0;
            }
            .invoice-container {
                box-shadow: none;
                padding: 20px;
            }
            .no-print {
                display: none !important;
            }
        }
    </style>
</head>
<body>

@php
    $tenantName = $tenant->nama ?? 'ISP BILLING';
    $tenantAddress = $tenant->alamat ?? '-';
    $tenantPhone = $tenant->telepon ?? '-';
    $tenantEmail = $tenant->email ?? '-'; // Using fallback if column doesn't exist
    $invoiceNumber = $tagihan->nomor_tagihan ?? ('INV-' . $tagihan->id_tagihan);
    $waNumber = preg_replace('/[^0-9]/', '', $tagihan->pelanggan->telepon ?? '');
    
    // Auto convert local 08 to +62 for whatsapp
    if (substr($waNumber, 0, 1) === '0') {
        $waNumber = '62' . substr($waNumber, 1);
    }
    
    $waText = urlencode("Halo {$tagihan->pelanggan->nama},\n\nBerikut adalah tagihan/invoice layanan internet Anda:\n\n*Invoice:* {$invoiceNumber}\n*Periode:* {$tagihan->bulan_tagihan}\n*Total Tagihan:* Rp " . number_format($tagihan->total_tarif, 0, ',', '.') . "\n*Status:* " . strtoupper($tagihan->status_bayar) . "\n\nTerima kasih atas kepercayaannya menggunakan layanan kami.\n- {$tenantName}");
    $waLink = "https://wa.me/{$waNumber}?text={$waText}";
@endphp

<div class="invoice-container clearfix">
    <table class="layout-table" style="border-bottom: 2px solid #eee; padding-bottom: 20px;">
        <tr>
            <td style="width: 50%;">
                <h1 class="company-name">{{ $tenantName }}</h1>
                <p class="company-desc">{{ $tenantAddress }}</p>
                @if($tenantEmail !== '-')
                    <p class="company-desc">Email: {{ $tenantEmail }}</p>
                @endif
                @if($tenantPhone !== '-')
                    <p class="company-desc">Telp: {{ $tenantPhone }}</p>
                @endif
            </td>
            <td style="width: 50%; text-align: right;">
                <h2 class="invoice-title">INVOICE</h2>
                <p class="invoice-num"># {{ $invoiceNumber }}</p>
                <div class="status-badge {{ strtoupper($tagihan->status_bayar) === 'LUNAS' ? 'status-paid' : 'status-unpaid' }}">
                    {{ strtoupper($tagihan->status_bayar) }}
                </div>
            </td>
        </tr>
    </table>

    <table class="layout-table" style="margin-bottom: 40px;">
        <tr>
            <td style="width: 50%; padding-right: 20px;">
                <h3 class="section-title">Ditagihkan Kepada:</h3>
                <p class="info-text"><strong>{{ $tagihan->pelanggan->nama ?? '-' }}</strong></p>
                <p class="info-text">ID Pelanggan: {{ $tagihan->pelanggan->nomor_pelanggan ?? ($tagihan->pelanggan->id ?? '-') }}</p>
                <p class="info-text">{{ $tagihan->pelanggan->alamat ?? '-' }}</p>
                <p class="info-text">Telp: {{ $tagihan->pelanggan->telepon ?? '-' }}</p>
            </td>
            <td style="width: 50%; padding-left: 20px;">
                <h3 class="section-title">Detail Pembayaran:</h3>
                <table style="width: 100%; border: none;">
                    <tr>
                        <td style="padding: 0 0 5px 0; border: none; font-size: 14px; color: #555;"><strong>Tanggal Invoice</strong></td>
                        <td style="padding: 0 0 5px 0; border: none; font-size: 14px; color: #555; text-align: right;">{{ \Carbon\Carbon::parse($tagihan->created_at)->translatedFormat('d F Y') }}</td>
                    </tr>
                    @if($tagihan->pembayaran)
                    <tr>
                        <td style="padding: 0 0 5px 0; border: none; font-size: 14px; color: #555;"><strong>Tanggal Dibayar</strong></td>
                        <td style="padding: 0 0 5px 0; border: none; font-size: 14px; color: #555; text-align: right;">{{ \Carbon\Carbon::parse($tagihan->pembayaran->tgl_bayar)->translatedFormat('d F Y H:i') }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 0 0 5px 0; border: none; font-size: 14px; color: #555;"><strong>Metode</strong></td>
                        <td style="padding: 0 0 5px 0; border: none; font-size: 14px; color: #555; text-align: right;">{{ $tagihan->pembayaran->metode_bayar }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 0 0 5px 0; border: none; font-size: 14px; color: #555;"><strong>Penerima</strong></td>
                        <td style="padding: 0 0 5px 0; border: none; font-size: 14px; color: #555; text-align: right;">{{ $tagihan->pembayaran->user->name ?? '-' }}</td>
                    </tr>
                    @endif
                </table>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 50%;">Deskripsi Layanan</th>
                <th style="width: 25%;">Periode</th>
                <th style="width: 25%;" class="text-right">Jumlah</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <strong>{{ $tagihan->pelanggan->paket->paket_nama ?? 'Paket Internet' }}</strong><br>
                    <span style="font-size: 12px; color: #777;">Kecepatan: {{ $tagihan->pelanggan->paket->kecepatan ?? '-' }} Mbps | Akun PPPoE: {{ $tagihan->pelanggan->pppoe ?? '-' }}</span>
                </td>
                <td>{{ $tagihan->bulan_tagihan }}</td>
                <td class="text-right">Rp {{ number_format($tagihan->total_tarif, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td>Subtotal</td>
            <td class="text-right">Rp {{ number_format($tagihan->total_tarif, 0, ',', '.') }}</td>
        </tr>
        <tr class="grand-total">
            <td>Total Tagihan</td>
            <td class="text-right">Rp {{ number_format($tagihan->total_tarif, 0, ',', '.') }}</td>
        </tr>
    </table>
    <div style="clear: both;"></div>
    
    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #ddd; font-size: 13px; color: #777;">
        {{ $tenant->invoice_footer ?? 'Terima kasih atas pembayaran Anda. Harap simpan struk ini sebagai bukti pembayaran yang sah.' }}
    </div>
    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>
