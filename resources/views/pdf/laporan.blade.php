<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Keuangan</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0 0; color: #666; }
        .summary-box { display: flex; width: 100%; margin-bottom: 20px; }
        .summary-item { width: 33%; float: left; text-align: center; border: 1px solid #ddd; padding: 10px; background-color: #f9f9f9; box-sizing: border-box; }
        .summary-item h3 { margin: 0 0 5px 0; font-size: 14px; color: #555; }
        .summary-item p { margin: 0; font-size: 18px; font-weight: bold; }
        .text-green { color: #16a34a; }
        .text-red { color: #dc2626; }
        .text-blue { color: #2563eb; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f3f4f6; color: #374151; font-weight: bold; }
        tr:nth-child(even) { background-color: #fafafa; }
        .text-right { text-align: right; }
        .clearfix::after { content: ""; clear: both; display: table; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Laporan Keuangan</h1>
        <p>Periode: {{ $selectedMonth }}</p>
    </div>

    <div class="summary-box clearfix">
        <div class="summary-item">
            <h3>Total Pemasukan</h3>
            <p class="text-green">Rp {{ number_format($income, 0, ',', '.') }}</p>
        </div>
        <div class="summary-item" style="margin: 0 0.5%;">
            <h3>Total Pengeluaran</h3>
            <p class="text-red">Rp {{ number_format($expense, 0, ',', '.') }}</p>
        </div>
        <div class="summary-item">
            <h3>Laba Bersih</h3>
            <p class="text-blue">Rp {{ number_format($profit, 0, ',', '.') }}</p>
        </div>
    </div>

    <h2 style="font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 30px;">Rekap Harian</h2>
    
    @if(isset($dailyRecap) && count($dailyRecap) > 0)
    <table>
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="25%">Tanggal</th>
                <th width="23%" class="text-right">Pemasukan (Rp)</th>
                <th width="23%" class="text-right">Pengeluaran (Rp)</th>
                <th width="24%" class="text-right">Laba/Rugi (Rp)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($dailyRecap as $index => $r)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $r['date'] }}</td>
                <td class="text-right text-green">{{ number_format($r['income'], 0, ',', '.') }}</td>
                <td class="text-right text-red">{{ number_format($r['expense'], 0, ',', '.') }}</td>
                <td class="text-right" style="font-weight:bold; color: {{ $r['profit'] >= 0 ? '#2563eb' : '#dc2626' }}">{{ number_format($r['profit'], 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @else
    <p style="text-align: center; color: #666; margin-top: 20px;">Tidak ada rekap harian pada periode ini.</p>
    @endif

    <div style="page-break-after: always;"></div>

    <h2 style="font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 30px;">Rincian Transaksi</h2>
    
    @if(count($transactions) > 0)
    <table>
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="20%">Tanggal</th>
                <th width="15%">Jenis</th>
                <th width="40%">Keterangan</th>
                <th width="20%" class="text-right">Nominal (Rp)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($transactions as $index => $t)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ \Carbon\Carbon::parse($t['date'])->format('d M Y') }}</td>
                <td style="font-weight:bold; color: {{ $t['type'] == 'Pemasukan' ? '#16a34a' : '#dc2626' }}">{{ $t['type'] }}</td>
                <td>{{ $t['description'] }}</td>
                <td class="text-right">{{ number_format($t['amount'], 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @else
    <p style="text-align: center; color: #666; margin-top: 20px;">Tidak ada transaksi pada periode ini.</p>
    @endif
</body>
</html>
