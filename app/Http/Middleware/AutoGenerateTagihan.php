<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AutoGenerateTagihan
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $bulanIni = now()->timezone('Asia/Jakarta')->translatedFormat('F Y');
        
        // Sesuai permintaan, jangan generate tagihan untuk Agustus 2026, mulai bulan September
        if (strpos($bulanIni, 'August 2026') !== false || strpos($bulanIni, 'Agustus 2026') !== false) {
            return $next($request);
        }
        
        // Cek apakah tagihan bulan ini sudah di-generate
        $isGenerated = \App\Models\Tagihan::where('bulan_tagihan', $bulanIni)->exists();
        
        if (!$isGenerated) {
            $pelangganAktif = \App\Models\Pelanggan::with('paket')->where('status', '!=', 'berhenti')->get();

            foreach ($pelangganAktif as $pelanggan) {
                if ($pelanggan->tanggal_register) {
                    $registeredMonth = \Carbon\Carbon::parse($pelanggan->tanggal_register)->translatedFormat('F Y');
                    if ($registeredMonth === $bulanIni) continue;
                }
                
                $exists = \App\Models\Tagihan::where('id_pelanggan', $pelanggan->id)
                    ->where('bulan_tagihan', $bulanIni)
                    ->exists();

                if (!$exists) {
                    $tagihan = \App\Models\Tagihan::create([
                        'id_pelanggan' => $pelanggan->id,
                        'bulan_tagihan' => $bulanIni,
                        'total_tarif' => $pelanggan->paket ? $pelanggan->paket->paket_tarif : 0,
                        'status_bayar' => 'Belum Bayar',
                    ]);
                    $ym = \Carbon\Carbon::parse($tagihan->created_at ?? now())->format('ym');
                    $tagihan->update(['nomor_tagihan' => 'INV-' . $ym . str_pad($tagihan->id_tagihan, 3, '0', STR_PAD_LEFT)]);
                }
            }
        }

        return $next($request);
    }
}
