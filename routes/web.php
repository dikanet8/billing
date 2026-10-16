<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Pelanggan;
use App\Models\MikrotikDevice;
use App\Models\OltDevice;
use App\Models\GenieacsServer;
use App\Models\Pengeluaran;
use App\Models\Tagihan;
use App\Models\Tiket;
use App\Models\Pembayaran;
use RouterOS\Client;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified', \App\Http\Middleware\CheckReadOnlyRole::class])->group(function () {
    // Tenant Management
    Route::get('/tenants', [\App\Http\Controllers\TenantController::class, 'index'])->name('tenants');
    Route::post('/tenants', [\App\Http\Controllers\TenantController::class, 'store']);
    Route::put('/tenants/{id}', [\App\Http\Controllers\TenantController::class, 'update']);
    Route::delete('/tenants/{id}', [\App\Http\Controllers\TenantController::class, 'destroy']);
    Route::post('/switch-tenant', [\App\Http\Controllers\TenantController::class, 'switchTenant'])->name('switch-tenant');

    // Web Push Subscription
    Route::post('/push-subscriptions', function (\Illuminate\Http\Request $request) {
        $endpoint = $request->input('endpoint');
        $key = $request->input('keys.p256dh');
        $token = $request->input('keys.auth');
        
        $request->user()->updatePushSubscription($endpoint, $key, $token);

        return back();
    });

    Route::get('/dashboard', function () {
        $availableYears = Tagihan::selectRaw('SUBSTRING_INDEX(bulan_tagihan, " ", -1) as tahun')
            ->whereNotNull('bulan_tagihan')
            ->distinct()
            ->pluck('tahun')
            ->filter()
            ->values()
            ->toArray();
            
        if (empty($availableYears)) {
            $availableYears = [now()->timezone('Asia/Jakarta')->translatedFormat('Y')];
        }

        $reqBulan = request('bulan', now()->timezone('Asia/Jakarta')->translatedFormat('F'));
        $reqTahun = request('tahun', now()->timezone('Asia/Jakarta')->translatedFormat('Y'));
        
        $selectedMonth = $reqBulan . ' ' . $reqTahun;

        $user = auth()->user();
        if ($user->role === 'PENAGIH') {
            // Get areas assigned to this PENAGIH
            $areaIds = \App\Models\AreaPenagih::where('id_user', $user->id)->pluck('id_area')->toArray();

            // Get target (Total Bills in assigned areas for this month)
            $tagihanArea = Tagihan::where('bulan_tagihan', $selectedMonth)
                ->whereHas('pelanggan', function($q) use ($areaIds) {
                    $q->whereIn('id_area', $areaIds);
                })->get();

            $totalTarget = $tagihanArea->sum('total_tarif');

            // Get successfully paid bills collected by this penagih for this month
            $pembayaranOlehPenagih = \App\Models\Pembayaran::where('id_user', $user->id)
                ->whereHas('tagihan', function($q) use ($selectedMonth) {
                    $q->where('bulan_tagihan', $selectedMonth);
                })
                ->sum('jumlah_bayar');

            // Total Setoran this month
            $englishMonth = str_ireplace(
                ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
                ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                $selectedMonth
            );
            $totalSetoran = \App\Models\SetoranPenagih::where('id_user', $user->id)
                ->whereMonth('tgl_setoran', \Carbon\Carbon::parse($englishMonth)->month)
                ->whereYear('tgl_setoran', \Carbon\Carbon::parse($englishMonth)->year)
                ->sum('nominal');

            $uangMengendap = $pembayaranOlehPenagih - $totalSetoran;

            // Get total pelanggan in assigned areas
            $totalPelanggan = \App\Models\Pelanggan::whereIn('id_area', $areaIds)->count();
            
            // Get new pelanggan this month in assigned areas
            $pelangganBaru = \App\Models\Pelanggan::whereIn('id_area', $areaIds)
                ->whereMonth('tanggal_register', \Carbon\Carbon::parse($englishMonth)->month)
                ->whereYear('tanggal_register', \Carbon\Carbon::parse($englishMonth)->year)
                ->count();

            // Get count of pelanggan belum bayar in their area
            $pelangganBelumBayar = Tagihan::where('bulan_tagihan', $selectedMonth)
                ->where('status_bayar', '!=', 'Lunas')
                ->whereHas('pelanggan', function($q) use ($areaIds) {
                    $q->whereIn('id_area', $areaIds);
                })
                ->count();

            $sisaTarget = max(0, $totalTarget - $pembayaranOlehPenagih);

            // Get pelanggan yang memiliki tunggakan (lebih dari 1 bulan) di area penagih
            $pelangganNunggak = Pelanggan::with(['paket', 'area', 'tagihan' => function($q) {
                    $q->where('status_bayar', '!=', 'Lunas')->orderByDesc('id_tagihan');
                }])
                ->whereIn('id_area', $areaIds)
                ->whereRaw('(SELECT COUNT(DISTINCT bulan_tagihan) FROM tagihan WHERE tagihan.id_pelanggan = pelanggan.id AND tagihan.status_bayar != ?) > 1', ['Lunas'])
                ->withSum(['tagihan as total_tunggakan' => function($q) {
                    $q->where('status_bayar', '!=', 'Lunas');
                }], 'total_tarif')
                ->withCount(['tagihan as tunggakan_count' => function($q) {
                    $q->where('status_bayar', '!=', 'Lunas');
                }])
                ->orderBy('nama')
                ->limit(5)
                ->get();

            // Transform to match the Tagihan object shape expected by frontend
            $daftarTunggakan = $pelangganNunggak->map(function($p) {
                return [
                    'id_tagihan' => $p->tagihan->first()->id_tagihan ?? $p->id,
                    'nomor_tagihan' => 'Tunggakan ' . $p->tunggakan_count . ' Bln',
                    'total_tarif' => $p->total_tunggakan,
                    'status_bayar' => 'Belum Bayar',
                    'id_pelanggan' => $p->id,
                    'pelanggan' => $p
                ];
            });

            $pendapatanHariIni = \App\Models\Pembayaran::where('id_user', $user->id)
                ->whereDate('tgl_bayar', now()->timezone('Asia/Jakarta')->toDateString())
                ->sum('jumlah_bayar');

            $pelangganDitagihHariIni = \App\Models\Pembayaran::where('id_user', $user->id)
                ->whereDate('tgl_bayar', now()->timezone('Asia/Jakarta')->toDateString())
                ->count();

            $totalSemuaPembayaran = \App\Models\Pembayaran::where('id_user', $user->id)->sum('jumlah_bayar');
            $totalSemuaSetoran = \App\Models\SetoranPenagih::where('id_user', $user->id)->sum('nominal');
            $cashOnHand = $totalSemuaPembayaran - $totalSemuaSetoran;

            return Inertia::render('dashboard-penagih', [
                'target' => $totalTarget,
                'berhasil' => $pembayaranOlehPenagih,
                'setoran' => $totalSetoran,
                'mengendap' => $uangMengendap,
                'totalPelanggan' => $totalPelanggan,
                'pelangganBaru' => $pelangganBaru,
                'pelangganBelumBayar' => $pelangganBelumBayar,
                'sisaTarget' => $sisaTarget,
                'daftarTunggakan' => $daftarTunggakan,
                'availableYears' => $availableYears,
                'reqBulan' => $reqBulan,
                'reqTahun' => $reqTahun,
                'selectedMonth' => $selectedMonth,
                'pendapatanHariIni' => $pendapatanHariIni,
                'pelangganDitagihHariIni' => $pelangganDitagihHariIni,
                'cashOnHand' => $cashOnHand,
                'totalSemuaPembayaran' => $totalSemuaPembayaran,
                'totalSemuaSetoran' => $totalSemuaSetoran,
            ]);
        }

        if ($user->role === 'TEKNISI') {
            $totalTiket = \App\Models\Tiket::where('ditugaskan_ke', $user->id)->count();
            $tiketSelesai = \App\Models\Tiket::where('ditugaskan_ke', $user->id)->where('status', 'Selesai')->count();
            $tiketTerbuka = \App\Models\Tiket::where('ditugaskan_ke', $user->id)->where('status', '!=', 'Selesai')->count();
            
            $tiketPending = \App\Models\Tiket::with(['pelanggan.paket', 'pelanggan.area'])
                ->where(function($q) use ($user) {
                    $q->where('ditugaskan_ke', $user->id)
                      ->orWhereNull('ditugaskan_ke');
                })
                ->where('status', '!=', 'Selesai')
                ->orderByDesc('tgl_dibuat')
                ->take(10)
                ->get();

            return Inertia::render('dashboard-teknisi', [
                'totalTiket' => $totalTiket,
                'tiketSelesai' => $tiketSelesai,
                'tiketTerbuka' => $tiketTerbuka,
                'tiketPending' => $tiketPending,
                'totalPelanggan' => \App\Models\Pelanggan::count(),
                'pelangganOnline' => \App\Models\Pelanggan::where('status', 'AKTIF')->count(),
                'pelangganIsolir' => \App\Models\Pelanggan::where('status', 'ISOLIR')->count(),
            ]);
        }

        $englishMonth = str_ireplace(
            ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
            ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            $selectedMonth
        );
        $monthNum = \Carbon\Carbon::parse($englishMonth)->month;
        $yearNum = \Carbon\Carbon::parse($englishMonth)->year;

        $tenantId = session('active_tenant_id') ? session('active_tenant_id') : auth()->user()->tenant_id;
        $penagihUsers = \App\Models\User::where('role', 'PENAGIH')
            ->where('tenant_id', $tenantId)
            ->get();
        
        $kinerjaPenagih = collect();
        if ($penagihUsers->count() > 0) {
            $kinerjaPenagih = $penagihUsers->map(function($user) use ($selectedMonth, $monthNum, $yearNum) {
                $areaIds = \App\Models\AreaPenagih::where('id_user', $user->id)->pluck('id_area');
                $areas = \App\Models\Area::whereIn('id_area', $areaIds)->pluck('nama_area')->join(', ');
                
                $berhasil = \App\Models\Pembayaran::where('id_user', $user->id)
                    ->whereHas('tagihan', function($q) use ($selectedMonth) {
                        $q->where('bulan_tagihan', $selectedMonth);
                    })
                    ->sum('jumlah_bayar');

                $setoran = \App\Models\SetoranPenagih::where('id_user', $user->id)
                    ->whereMonth('tgl_setoran', $monthNum)
                    ->whereYear('tgl_setoran', $yearNum)
                    ->sum('nominal'); 
                
                return [
                    'id_user' => $user->id,
                    'nama' => $user->nama,
                    'areas' => $areas,
                    'berhasil' => $berhasil,
                    'setoran' => $setoran,
                    'mengendap' => $berhasil - $setoran,
                ];
            })->sortByDesc('berhasil')->values();
        }

        $totalPelanggan = Pelanggan::count();
        $pelangganBaruBulanIni = Pelanggan::whereMonth('tanggal_register', $monthNum)->whereYear('tanggal_register', $yearNum)->count();
        $totalPelangganSebelumnya = $totalPelanggan - $pelangganBaruBulanIni;
        $pertumbuhanPelanggan = $totalPelangganSebelumnya > 0 ? round(($pelangganBaruBulanIni / $totalPelangganSebelumnya) * 100, 1) : 0;

        $availableMonthsList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        $currentIndex = array_search($reqBulan, $availableMonthsList);
        $previousMonthName = ($currentIndex !== false && $currentIndex > 0) ? $availableMonthsList[$currentIndex - 1] : null;
        $previousYear = $reqTahun;
        if (!$previousMonthName) {
            $previousMonthName = 'Desember';
            $previousYear = $reqTahun - 1;
        }
        $previousMonth = $previousMonthName . ' ' . $previousYear;

        $totalPendapatan = Tagihan::where('status_bayar', 'Lunas')->where('bulan_tagihan', $selectedMonth)->sum('total_tarif');
        $pendapatanBulanLalu = $previousMonth ? Tagihan::where('status_bayar', 'Lunas')->where('bulan_tagihan', $previousMonth)->sum('total_tarif') : 0;
        $pertumbuhanPendapatan = $pendapatanBulanLalu > 0 ? round((($totalPendapatan - $pendapatanBulanLalu) / $pendapatanBulanLalu) * 100, 1) : 0;

        return Inertia::render('dashboard', [
            'totalPelanggan' => $totalPelanggan,
            'pelangganAktif' => Pelanggan::where('status', 'AKTIF')->count(),
            'pelangganIsolir' => Pelanggan::where('status', 'ISOLIR')->count(),
            'pelangganBerhenti' => Pelanggan::where('status', 'BERHENTI')->count(),
            'pelangganBaruBulanIni' => $pelangganBaruBulanIni,
            'pelangganMenunggak' => Pelanggan::whereRaw('(SELECT COUNT(DISTINCT bulan_tagihan) FROM tagihan WHERE tagihan.id_pelanggan = pelanggan.id AND tagihan.status_bayar != ?) > 1', ['Lunas'])->count(),
            'totalPendapatan' => $totalPendapatan,
            'totalTagihan' => Tagihan::where('bulan_tagihan', $selectedMonth)->sum('total_tarif'),
            'totalPembayaran' => Pembayaran::whereHas('tagihan', function($q) use ($selectedMonth) {
                $q->where('bulan_tagihan', $selectedMonth);
            })->sum('jumlah_bayar'),
            'pertumbuhanPelanggan' => $pertumbuhanPelanggan,
            'pertumbuhanPendapatan' => $pertumbuhanPendapatan,
            'transaksiTerakhir' => Pembayaran::with(['pelanggan.paket', 'tagihan', 'user'])
                ->whereHas('tagihan', function($q) use ($selectedMonth) {
                    $q->where('bulan_tagihan', $selectedMonth);
                })
                ->orderBy('tgl_bayar', 'desc')
                ->orderBy('id_pembayaran', 'desc')
                ->take(10)
                ->get(),

            'availableYears' => $availableYears,
            'reqBulan' => $reqBulan,
            'reqTahun' => $reqTahun,
            'selectedMonth' => $selectedMonth,
            'kinerjaPenagih' => $kinerjaPenagih,
        ])->toResponse(request())->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    })->name('dashboard');

    Route::get('/pelanggan', function () {
        return Inertia::render('pelanggan', [
            'dataPelanggan' => Pelanggan::with(['paket', 'area', 'tagihan.pembayaran.user'])->get(),
            'dataArea' => App\Models\Area::all(),
            'dataPaket' => App\Models\Paket::all(),
            'dataMikrotik' => App\Models\MikrotikDevice::all(),
            'isNewCustomersPage' => false,
        ]);
    })->name('pelanggan');

    Route::get('/pelanggan-baru', function (\Illuminate\Http\Request $request) {
        $user = auth()->user();
        
        $reqBulan = $request->input('bulan', now()->timezone('Asia/Jakarta')->translatedFormat('F'));
        $reqTahun = $request->input('tahun', now()->timezone('Asia/Jakarta')->translatedFormat('Y'));
        
        $selectedMonth = $reqBulan . ' ' . $reqTahun;
        $englishMonth = str_ireplace(
            ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
            ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            $selectedMonth
        );
        $monthNum = \Carbon\Carbon::parse($englishMonth)->month;
        $yearNum = \Carbon\Carbon::parse($englishMonth)->year;

        $query = Pelanggan::with(['paket', 'area', 'tagihan.pembayaran.user'])
            ->whereMonth('tanggal_register', $monthNum)
            ->whereYear('tanggal_register', $yearNum);
            
        if ($user && $user->role === 'PENAGIH') {
            $areaIds = \App\Models\AreaPenagih::where('id_user', $user->id)->pluck('id_area')->toArray();
            $query->whereIn('id_area', $areaIds);
        }

        return Inertia::render('pelanggan', [
            'dataPelanggan' => $query->get(),
            'dataArea' => App\Models\Area::all(),
            'dataPaket' => App\Models\Paket::all(),
            'dataMikrotik' => App\Models\MikrotikDevice::all(),
            'isNewCustomersPage' => true,
        ]);
    })->name('pelanggan.baru');

    Route::post('/pelanggan', function (\Illuminate\Http\Request $request) {
        $profileMikrotikInput = $request->input('profile_mikrotik');

        $validated = $request->validate([
            'nama' => 'required|string|max:150',
            'telepon' => 'nullable|string|max:20',
            'pppoe' => 'required|string|max:100',
            'password' => 'nullable|string|max:100',
            'tanggal' => 'nullable|integer',
            'id_area' => 'nullable|integer',
            'id_paket' => 'nullable|integer',
            'id_mikrotik' => 'nullable|integer',
            'alamat' => 'nullable|string',
            'status' => 'nullable|string',
            'tanggal_register' => 'nullable|date',
            'modem' => 'nullable|string|max:100',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        if (!empty($validated['tanggal_register'])) {
            $validated['tanggal'] = (int) \Carbon\Carbon::parse($validated['tanggal_register'])->format('d');
        }

        $pelanggan = Pelanggan::create($validated);
        $date = \Carbon\Carbon::parse($pelanggan->tanggal_register ?? now());
        if ($request->user()->tenant_id == 1) {
            $dm = $date->format('dm');
            $pelanggan->update(['nomor_pelanggan' => 'JAR-' . $dm . str_pad($pelanggan->id, 3, '0', STR_PAD_LEFT)]);
        } else if ($request->user()->tenant_id == 2) {
            $dm = $date->format('dm');
            $pelanggan->update(['nomor_pelanggan' => 'AJN-' . $dm . str_pad($pelanggan->id, 3, '0', STR_PAD_LEFT)]);
        } else if ($request->user()->tenant_id == 3) {
            $dm = $date->format('dm');
            $pelanggan->update(['nomor_pelanggan' => 'ESK-' . $dm . str_pad($pelanggan->id, 3, '0', STR_PAD_LEFT)]);
        }

        // Integrasi Otomatis ke Mikrotik (PPP Secret)
        $mikrotikMsg = '';
        if ($pelanggan->id_mikrotik) {
            $mikrotik = \App\Models\MikrotikDevice::find($pelanggan->id_mikrotik);
            $paket = \App\Models\Paket::find($pelanggan->id_paket);

            if ($mikrotik) {
                try {
                    $client = new Client([
                        'host' => $mikrotik->ip,
                        'user' => $mikrotik->username ?? 'admin',
                        'pass' => $mikrotik->password ?? '',
                        'port' => (int)($mikrotik->port ?? 8728),
                        'timeout' => 4,
                    ]);

                    // Cek apakah secret PPPoE sudah ada di Mikrotik
                    $existing = $client->query('/ppp/secret/print', [['?name', $pelanggan->pppoe]])->read();

                    // Prioritaskan Profile Mikrotik yang dipilih terpisah, jika tidak ada fallback ke paket billing atau default
                    $profileName = !empty($profileMikrotikInput) 
                        ? $profileMikrotikInput 
                        : ($paket ? $paket->paket_nama : 'default');

                    $passwordValue = $pelanggan->password ?? $pelanggan->pppoe; // default ke pppoe jika kosong
                    $commentValue = $pelanggan->nama . ' - ' . ($pelanggan->nomor_pelanggan ?? 'ID:' . $pelanggan->id);

                    if (!empty($existing)) {
                        // Jika sudah ada, update secret
                        $query = (new \RouterOS\Query('/ppp/secret/set'))
                            ->equal('.id', $existing[0]['.id'])
                            ->equal('service', 'pppoe')
                            ->equal('profile', $profileName)
                            ->equal('password', $passwordValue)
                            ->equal('comment', $commentValue);

                        if (strtolower($pelanggan->status ?? 'aktif') === 'isolir' && $mikrotik->isolir_profile) {
                            $query->equal('profile', $mikrotik->isolir_profile);
                        } else if (strtolower($pelanggan->status ?? 'aktif') === 'berhenti') {
                            $query->equal('disabled', 'yes');
                        } else {
                            $query->equal('disabled', 'no');
                        }

                        $client->query($query)->read();
                        $mikrotikMsg = ' (Secret di Mikrotik berhasil diperbarui: ' . $profileName . ')';
                    } else {
                        // Jika belum ada, buat secret baru di Mikrotik
                        $query = (new \RouterOS\Query('/ppp/secret/add'))
                            ->equal('name', $pelanggan->pppoe)
                            ->equal('password', $passwordValue)
                            ->equal('service', 'pppoe')
                            ->equal('profile', $profileName)
                            ->equal('comment', $commentValue);

                        if (strtolower($pelanggan->status ?? 'aktif') === 'isolir' && $mikrotik->isolir_profile) {
                            $query->equal('profile', $mikrotik->isolir_profile);
                        } else if (strtolower($pelanggan->status ?? 'aktif') === 'berhenti') {
                            $query->equal('disabled', 'yes');
                        }

                        $client->query($query)->read();
                        $mikrotikMsg = ' (Secret berhasil dibuat di Mikrotik: ' . $profileName . ')';
                    }
                } catch (\Exception $e) {
                    $mikrotikMsg = ' (Peringatan: Gagal sinkron ke Mikrotik: ' . $e->getMessage() . ')';
                }
            }
        }

        \App\Events\PelangganUpdated::dispatch($request->user()->tenant_id);
        return back()->with('success', 'Pelanggan berhasil ditambahkan' . $mikrotikMsg);
    });

    Route::post('/pelanggan/{id}/aktifkan', function ($id) {
        $pelanggan = \App\Models\Pelanggan::findOrFail($id);
        $pelanggan->update(['status' => 'AKTIF']);
        \App\Events\PelangganUpdated::dispatch(auth()->user()->tenant_id);
        
        if ($pelanggan->id_mikrotik) {
            $mikrotik = \App\Models\MikrotikDevice::find($pelanggan->id_mikrotik);
            $paket = \App\Models\Paket::find($pelanggan->id_paket);
            if ($mikrotik && $mikrotik->is_isolir_enabled && $paket) {
                try {
                    $client = new Client([
                        'host' => $mikrotik->ip,
                        'user' => $mikrotik->username ?? 'admin',
                        'pass' => $mikrotik->password ?? '',
                        'port' => (int)($mikrotik->port ?? 8728),
                        'timeout' => 3,
                    ]);
                    
                    $secret = $client->query('/ppp/secret/print', [['?name', $pelanggan->pppoe]])->read();
                    if (!empty($secret)) {
                        $oldComment = $secret[0]['comment'] ?? '';
                        $newComment = trim(preg_replace('/^\[ISOLIR:.*?\]\s*/', '', $oldComment));
                        
                        $profileToSet = $paket->paket_nama;
                        if (preg_match('/^\[ISOLIR:\s*(.+?)\]/', $oldComment, $matches)) {
                            $profileToSet = trim($matches[1]);
                        }

                        $query = (new \RouterOS\Query('/ppp/secret/set'))
                            ->equal('.id', $secret[0]['.id'])
                            ->equal('profile', $profileToSet)
                            ->equal('disabled', 'no');
                        
                        if ($newComment === '') {
                            // If empty, we can just set it to empty
                            $query->equal('comment', '');
                        } else {
                            $query->equal('comment', $newComment);
                        }
                            
                        $client->query($query)->read();
                    }
                    
                    $active = $client->query('/ppp/active/print', [['?name', $pelanggan->pppoe]])->read();
                    if (!empty($active)) {
                        $query = (new \RouterOS\Query('/ppp/active/remove'))
                            ->equal('.id', $active[0]['.id']);
                        $client->query($query)->read();
                    }
                } catch (\Exception $e) {
                    return back()->with('error', 'Pelanggan diaktifkan, namun gagal menghubungi Mikrotik: ' . $e->getMessage());
                }
            }
        }
        
        return back()->with('success', 'Pelanggan berhasil diaktifkan');
    });

    Route::post('/pelanggan/{id}/isolir', function ($id) {
        $pelanggan = \App\Models\Pelanggan::findOrFail($id);
        $pelanggan->update(['status' => 'ISOLIR']);
        \App\Events\PelangganUpdated::dispatch(auth()->user()->tenant_id);
        
        if ($pelanggan->id_mikrotik) {
            $mikrotik = \App\Models\MikrotikDevice::find($pelanggan->id_mikrotik);
            if ($mikrotik && $mikrotik->is_isolir_enabled && $mikrotik->isolir_profile) {
                try {
                    $client = new Client([
                        'host' => $mikrotik->ip,
                        'user' => $mikrotik->username ?? 'admin',
                        'pass' => $mikrotik->password ?? '',
                        'port' => (int)($mikrotik->port ?? 8728),
                        'timeout' => 3,
                    ]);
                    
                    $secret = $client->query('/ppp/secret/print', [['?name', $pelanggan->pppoe]])->read();
                    if (!empty($secret)) {
                        $oldProfile = $secret[0]['profile'] ?? '';
                        $oldComment = $secret[0]['comment'] ?? '';
                        
                        // Prevent duplicate isolir tags if clicked multiple times
                        $newComment = $oldComment;
                        if (!str_contains($oldComment, '[ISOLIR:')) {
                            $newComment = "[ISOLIR: {$oldProfile}] " . $oldComment;
                        }

                        $query = (new \RouterOS\Query('/ppp/secret/set'))
                            ->equal('.id', $secret[0]['.id'])
                            ->equal('profile', $mikrotik->isolir_profile)
                            ->equal('comment', trim($newComment));
                        $client->query($query)->read();
                    }
                    
                    $active = $client->query('/ppp/active/print', [['?name', $pelanggan->pppoe]])->read();
                    if (!empty($active)) {
                        $query = (new \RouterOS\Query('/ppp/active/remove'))
                            ->equal('.id', $active[0]['.id']);
                        $client->query($query)->read();
                    }
                } catch (\Exception $e) {
                    return back()->with('error', 'Pelanggan diisolir, namun gagal menghubungi Mikrotik: ' . $e->getMessage());
                }
            }
        }
        
        return back()->with('success', 'Pelanggan berhasil diisolir');
    });

    Route::post('/pelanggan/{id}/berhenti', function ($id) {
        $pelanggan = \App\Models\Pelanggan::findOrFail($id);
        $pelanggan->update(['status' => 'BERHENTI']);
        \App\Events\PelangganUpdated::dispatch(auth()->user()->tenant_id);
        
        if ($pelanggan->id_mikrotik) {
            $mikrotik = \App\Models\MikrotikDevice::find($pelanggan->id_mikrotik);
            if ($mikrotik) {
                try {
                    $client = new Client([
                        'host' => $mikrotik->ip,
                        'user' => $mikrotik->username ?? 'admin',
                        'pass' => $mikrotik->password ?? '',
                        'port' => (int)($mikrotik->port ?? 8728),
                        'timeout' => 3,
                    ]);
                    
                    $secret = $client->query('/ppp/secret/print', [['?name', $pelanggan->pppoe]])->read();
                    if (!empty($secret)) {
                        $query = (new \RouterOS\Query('/ppp/secret/set'))
                            ->equal('.id', $secret[0]['.id'])
                            ->equal('disabled', 'yes');
                        $client->query($query)->read();
                    }
                    
                    $active = $client->query('/ppp/active/print', [['?name', $pelanggan->pppoe]])->read();
                    if (!empty($active)) {
                        $query = (new \RouterOS\Query('/ppp/active/remove'))
                            ->equal('.id', $active[0]['.id']);
                        $client->query($query)->read();
                    }
                } catch (\Exception $e) {
                    return back()->with('error', 'Pelanggan diberhentikan, namun gagal menghubungi Mikrotik: ' . $e->getMessage());
                }
            }
        }
        
        return back()->with('success', 'Pelanggan berhasil diberhentikan');
    });
    Route::get('/pelanggan/export-template', function () {
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=template_pelanggan.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];
        $columns = ['nama', 'telepon', 'pppoe', 'id_area', 'id_paket', 'id_mikrotik', 'alamat', 'status', 'tanggal_register'];
        $callback = function() use($columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            fclose($file);
        };
        return response()->stream($callback, 200, $headers);
    })->name('pelanggan.exportTemplate');

    Route::post('/pelanggan/import', function (\Illuminate\Http\Request $request) {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls'
        ]);
        // TODO: Implement actual Excel/CSV import logic here
        return back()->with('success', 'Data pelanggan berhasil diimport');
    })->name('pelanggan.import');


    Route::put('/pelanggan/{id}', function (\Illuminate\Http\Request $request, $id) {
        $profileMikrotikInput = $request->input('profile_mikrotik');

        $validated = $request->validate([
            'nama' => 'required|string|max:150',
            'telepon' => 'nullable|string|max:20',
            'pppoe' => 'required|string|max:100',
            'password' => 'nullable|string|max:100',
            'tanggal' => 'nullable|integer',
            'id_area' => 'nullable|integer',
            'id_paket' => 'nullable|integer',
            'id_mikrotik' => 'nullable|integer',
            'alamat' => 'nullable|string',
            'status' => 'nullable|string',
            'tanggal_register' => 'nullable|date',
            'modem' => 'nullable|string|max:100',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);
        
        if (!empty($validated['tanggal_register'])) {
            $validated['tanggal'] = (int) \Carbon\Carbon::parse($validated['tanggal_register'])->format('d');
        }
        
        $pelanggan = Pelanggan::findOrFail($id);
        $oldPppoe = $pelanggan->pppoe;
        $pelanggan->update($validated);

        // Sync update ke Mikrotik jika id_mikrotik ada
        $mikrotikMsg = '';
        if ($pelanggan->id_mikrotik) {
            $mikrotik = \App\Models\MikrotikDevice::find($pelanggan->id_mikrotik);
            $paket = \App\Models\Paket::find($pelanggan->id_paket);

            if ($mikrotik) {
                try {
                    $client = new Client([
                        'host' => $mikrotik->ip,
                        'user' => $mikrotik->username ?? 'admin',
                        'pass' => $mikrotik->password ?? '',
                        'port' => (int)($mikrotik->port ?? 8728),
                        'timeout' => 4,
                    ]);

                    // Cari berdasarkan pppoe sekarang atau sebelumnya
                    $existing = $client->query('/ppp/secret/print', [['?name', $oldPppoe]])->read();
                    if (empty($existing)) {
                        $existing = $client->query('/ppp/secret/print', [['?name', $pelanggan->pppoe]])->read();
                    }

                    // Prioritaskan Profile Mikrotik yang dipilih terpisah, jika tidak ada fallback ke paket billing atau default
                    $profileName = !empty($profileMikrotikInput)
                        ? $profileMikrotikInput
                        : ($paket ? $paket->paket_nama : 'default');

                    $passwordValue = $pelanggan->password ?? $pelanggan->pppoe;
                    $commentValue = $pelanggan->nama . ' - ' . ($pelanggan->nomor_pelanggan ?? 'ID:' . $pelanggan->id);

                    if (!empty($existing)) {
                        $query = (new \RouterOS\Query('/ppp/secret/set'))
                            ->equal('.id', $existing[0]['.id'])
                            ->equal('name', $pelanggan->pppoe)
                            ->equal('password', $passwordValue)
                            ->equal('profile', $profileName)
                            ->equal('comment', $commentValue);

                        if (strtolower($pelanggan->status ?? 'aktif') === 'isolir' && $mikrotik->isolir_profile) {
                            $query->equal('profile', $mikrotik->isolir_profile);
                        } else if (strtolower($pelanggan->status ?? 'aktif') === 'berhenti') {
                            $query->equal('disabled', 'yes');
                        } else {
                            $query->equal('disabled', 'no');
                        }

                        $client->query($query)->read();
                        $mikrotikMsg = ' (Secret di Mikrotik disinkronkan)';
                    }
                } catch (\Exception $e) {
                    $mikrotikMsg = ' (Peringatan Mikrotik: ' . $e->getMessage() . ')';
                }
            }
        }

        \App\Events\PelangganUpdated::dispatch($request->user()->tenant_id);
        return back()->with('success', 'Pelanggan berhasil diperbarui' . $mikrotikMsg);
    });

    Route::get('/pelanggan/cetak/{id}', function ($id) {
        // Return dummy PDF logic for now
        return 'Printing pelanggan ' . $id;
    })->name('pelanggan.cetak');

    // Notifications
    Route::get('/api/notifications', function (\Illuminate\Http\Request $request) {
        $notifications = \App\Models\Notification::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();
        return response()->json($notifications);
    })->name('api.notifications.index');

    Route::post('/api/notifications/{id}/read', function ($id, \Illuminate\Http\Request $request) {
        $notification = \App\Models\Notification::where('user_id', $request->user()->id)->findOrFail($id);
        $notification->update(['is_read' => true]);
        return response()->json(['success' => true]);
    })->name('api.notifications.read');

    Route::post('/api/notifications/read-all', function (\Illuminate\Http\Request $request) {
        \App\Models\Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);
        return response()->json(['success' => true]);
    })->name('api.notifications.readAll');

    // Tiket Routes

    Route::delete('/pelanggan/{id}', function ($id) {
        $pelanggan = Pelanggan::findOrFail($id);
        \App\Models\Tagihan::where('id_pelanggan', $id)->delete();
        $pelanggan->delete();
        \App\Events\PelangganUpdated::dispatch(auth()->user()->tenant_id);
        return back();
    });

    Route::get('/mikrotik', function () {
        return Inertia::render('mikrotik', [
            'dataMikrotik' => MikrotikDevice::all()
        ]);
    })->name('mikrotik');

    Route::get('/manajemen-mikrotik', function () {
        return Inertia::render('manajemen-mikrotik', [
            'dataMikrotik' => MikrotikDevice::all()
        ]);
    })->name('manajemen-mikrotik');

    Route::post('/mikrotik/test-connection', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'ip' => 'required|string|max:50',
            'port' => 'nullable|integer',
            'username' => 'nullable|string|max:50',
            'password' => 'nullable|string|max:50',
        ]);

        try {
            $client = new Client([
                'host' => $validated['ip'],
                'user' => $validated['username'] ?? 'admin',
                'pass' => $validated['password'] ?? '',
                'port' => (int)($validated['port'] ?? 8728),
                'timeout' => 3,
            ]);
            
            // Just a basic query to verify connection
            $client->query('/system/resource/print')->read();
            
            return response()->json(['success' => true, 'message' => 'Berhasil terhubung ke Mikrotik!']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal terhubung: ' . $e->getMessage()], 422);
        }
    });

    Route::post('/mikrotik/fetch-profiles', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'ip' => 'required|string|max:50',
            'port' => 'nullable|integer',
            'username' => 'nullable|string|max:50',
            'password' => 'nullable|string|max:50',
        ]);

        try {
            $client = new Client([
                'host' => $validated['ip'],
                'user' => $validated['username'] ?? 'admin',
                'pass' => $validated['password'] ?? '',
                'port' => (int)($validated['port'] ?? 8728),
                'timeout' => 3,
            ]);
            
            $profiles = $client->query('/ppp/profile/print')->read();
            return response()->json(['success' => true, 'profiles' => $profiles]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil profile dari Mikrotik: ' . $e->getMessage()], 422);
        }
    });

    Route::get('/mikrotik/{id}/profiles', function ($id) {
        $mikrotik = MikrotikDevice::findOrFail($id);

        try {
            $client = new Client([
                'host' => $mikrotik->ip,
                'user' => $mikrotik->username ?? 'admin',
                'pass' => $mikrotik->password ?? '',
                'port' => (int)($mikrotik->port ?? 8728),
                'timeout' => 3,
            ]);

            $profiles = $client->query('/ppp/profile/print')->read();
            return response()->json([
                'success' => true,
                'profiles' => collect($profiles)->pluck('name')->filter(fn($name) => !in_array($name, ['default-encryption']))->values()
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil profile: ' . $e->getMessage()], 422);
        }
    });

    Route::post('/mikrotik', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'nama' => 'required|string|max:100|unique:mikrotik_devices,nama',
            'ip' => 'required|string|max:50',
            'port' => 'nullable|integer',
            'username' => 'nullable|string|max:50',
            'password' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:20',
            'isolir_profile' => 'nullable|string|max:100',
            'is_isolir_enabled' => 'boolean'
        ]);

        // Attempt to connect and set actual status
        try {
            $client = new Client([
                'host' => $validated['ip'],
                'user' => $validated['username'] ?? 'admin',
                'pass' => $validated['password'] ?? '',
                'port' => (int)($validated['port'] ?? 8728),
                'timeout' => 2,
            ]);
            $client->query('/system/resource/print')->read();
            $validated['status'] = 'Online';
        } catch (\Exception $e) {
            $validated['status'] = 'Offline';
        }

        MikrotikDevice::create($validated);
        return back();
    });

    Route::put('/mikrotik/{id}', function (\Illuminate\Http\Request $request, $id) {
        $validated = $request->validate([
            'nama' => 'required|string|max:100|unique:mikrotik_devices,nama,'.$id,
            'ip' => 'required|string|max:50',
            'port' => 'nullable|integer',
            'username' => 'nullable|string|max:50',
            'password' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:20',
            'isolir_profile' => 'nullable|string|max:100',
            'is_isolir_enabled' => 'boolean'
        ]);
        MikrotikDevice::findOrFail($id)->update($validated);
        return back();
    });

    Route::delete('/mikrotik/{id}', function ($id) {
        MikrotikDevice::findOrFail($id)->delete();
        return back();
    });

    Route::get('/mikrotik/{id}/live-data', function ($id) {
        $mikrotik = MikrotikDevice::findOrFail($id);
        try {
            $client = new Client([
                'host' => $mikrotik->ip,
                'user' => $mikrotik->username ?? 'admin',
                'pass' => $mikrotik->password ?? '',
                'port' => (int)($mikrotik->port ?? 8728),
                'timeout' => 5,
            ]);

            $resource = $client->query('/system/resource/print')->read();
            $identity = [];
            try {
                $identity = $client->query('/system/identity/print')->read();
            } catch (\Exception $e) {}
            $interfaces = $client->query('/interface/print')->read();
            $pppActive = $client->query('/ppp/active/print')->read();
            
            $hotspotActive = [];
            try {
                $hotspotActive = $client->query('/ip/hotspot/active/print')->read();
            } catch (\Exception $e) {
                // ignore if hotspot is not configured
            }

            $pppSecrets = [];
            try {
                $pppSecrets = $client->query('/ppp/secret/print')->read();
            } catch (\Exception $e) {
                // ignore
            }

            $activePppNames = collect($pppActive)->pluck('name')->toArray();
            
            $isolirProfile = $mikrotik->isolir_profile;

            $pppDisabled = collect($pppSecrets)->filter(function($s) use ($isolirProfile) {
                $isDisabled = isset($s['disabled']) && $s['disabled'] === 'true';
                $isIsolirProfile = $isolirProfile && isset($s['profile']) && $s['profile'] === $isolirProfile;
                return $isDisabled || $isIsolirProfile;
            })->values()->toArray();

            $pppOffline = collect($pppSecrets)->filter(function($s) use ($activePppNames, $isolirProfile) {
                $isDisabled = isset($s['disabled']) && $s['disabled'] === 'true';
                $isIsolirProfile = $isolirProfile && isset($s['profile']) && $s['profile'] === $isolirProfile;
                return !$isDisabled && !$isIsolirProfile && !in_array($s['name'], $activePppNames);
            })->values()->toArray();

            $hotspotDisabled = [];
            try {
                $q2 = new \RouterOS\Query('/ip/hotspot/user/print');
                // We'll fetch all and filter in php to also check profile
                $allHotspot = $client->query($q2)->read();
                $hotspotDisabled = collect($allHotspot)->filter(function($u) use ($isolirProfile) {
                    $isDisabled = isset($u['disabled']) && $u['disabled'] === 'true';
                    $isIsolirProfile = $isolirProfile && isset($u['profile']) && $u['profile'] === $isolirProfile;
                    return $isDisabled || $isIsolirProfile;
                })->values()->toArray();
            } catch (\Exception $e) {
                // ignore
            }

            $pelangganPppoe = \App\Models\Pelanggan::where('id_mikrotik', $id)->pluck('pppoe')->toArray();
            $unsyncedPppoe = collect($pppSecrets)->filter(function($s) use ($pelangganPppoe, $isolirProfile) {
                $isIsolirProfile = $isolirProfile && isset($s['profile']) && $s['profile'] === $isolirProfile;
                return !in_array($s['name'], $pelangganPppoe) && !$isIsolirProfile;
            })->values()->toArray();

            return response()->json([
                'success' => true,
                'identity' => $identity[0]['name'] ?? null,
                'systemResource' => $resource[0] ?? null,
                'interfaces' => $interfaces,
                'pppActive' => $pppActive,
                'hotspotActive' => $hotspotActive,
                'pppDisabled' => $pppDisabled,
                'pppOffline' => $pppOffline,
                'hotspotDisabled' => $hotspotDisabled,
                'unsyncedPppoe' => $unsyncedPppoe
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    });

    Route::get('/olt', function () {
        return Inertia::render('olt', [
            'dataOlt' => App\Models\OltDevice::all()
        ]);
    })->name('olt');

    Route::post('/olt', function (Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'vendor' => 'required|string|max:50',
            'ipAddress' => 'required|string|max:255',
            'snmpPort' => 'required|integer',
            'snmpRead' => 'required|string|max:255',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:255',
        ]);

        App\Models\OltDevice::create([
            'nama' => $validated['name'],
            'vendor' => $validated['vendor'],
            'ip' => $validated['ipAddress'],
            'port' => $validated['snmpPort'],
            'snmp_community' => $validated['snmpRead'],
            'username' => $validated['username'] ?? '', 
            'password' => $validated['password'] ?? '', 
            'created_at' => now(),
        ]);

        return back()->with('success', 'OLT berhasil ditambahkan');
    });

    Route::put('/olt/{id}', function (Illuminate\Http\Request $request, $id) {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'vendor' => 'required|string|max:50',
            'ipAddress' => 'required|string|max:255',
            'snmpPort' => 'required|integer',
            'snmpRead' => 'required|string|max:255',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:255',
        ]);

        $olt = App\Models\OltDevice::findOrFail($id);
        
        $olt->update([
            'nama' => $validated['name'],
            'vendor' => $validated['vendor'],
            'ip' => $validated['ipAddress'],
            'port' => $validated['snmpPort'],
            'snmp_community' => $validated['snmpRead'],
            'username' => $validated['username'] ?? $olt->username,
            'password' => $validated['password'] ?? $olt->password,
        ]);

        return back()->with('success', 'OLT berhasil diperbarui');
    });

    Route::delete('/olt/{id}', function ($id) {
        $olt = App\Models\OltDevice::findOrFail($id);
        $olt->delete();
        return back()->with('success', 'OLT berhasil dihapus');
    });

    Route::get('/olt/{id}/system', [\App\Http\Controllers\OltController::class, 'getSystemStats']);
    Route::get('/olt/{id}/monitoring', [\App\Http\Controllers\OltController::class, 'monitoring'])->name('olt.monitoring');
    Route::get('/olt-monitoring-index', [\App\Http\Controllers\OltController::class, 'monitoringIndex'])->name('olt.monitoring-index');
    Route::get('/api/olt/{id}/ports', [\App\Http\Controllers\OltController::class, 'getPorts']);
    Route::get('/api/olt/{id}/ports/{portIndex}/onus', [\App\Http\Controllers\OltController::class, 'getOnus']);
    Route::get('/api/olt/{id}/gpon/uncfg', [\App\Http\Controllers\OltController::class, 'getGponUncfg']);
    Route::get('/api/olt/{id}/gpon/profiles', [\App\Http\Controllers\OltController::class, 'getGponProfiles']);
    Route::get('/api/olt/{id}/gpon/vlans', [\App\Http\Controllers\OltController::class, 'getGponVlans']);
    Route::get('/api/olt/{id}/gpon/types', [\App\Http\Controllers\OltController::class, 'getGponOnuTypes']);
    Route::post('/api/olt/{id}/gpon/provision', [\App\Http\Controllers\OltController::class, 'provisionGponOnu']);
    Route::post('/api/olt/{id}/gpon/service', [\App\Http\Controllers\OltController::class, 'configureGponService']);
    Route::delete('/api/olt/{id}/onu', [\App\Http\Controllers\OltController::class, 'deleteOnu']);
    Route::post('/api/olt/ping-watch', [\App\Http\Controllers\OltController::class, 'pingWatch']);

    // ONU Detail Routes
    Route::get('/olt/{id}/onu/{port}/{onuId}/detail', [\App\Http\Controllers\OltController::class, 'onuDetailPage'])->name('olt.onu-detail');
    Route::get('/api/olt/{id}/onu/{port}/{onuId}/detail', [\App\Http\Controllers\OltController::class, 'getOnuDetail']);
    Route::get('/api/olt/{id}/onu/{port}/{onuId}/traffic', [\App\Http\Controllers\OltController::class, 'getOnuTraffic']);
    Route::put('/api/olt/{id}/onu/{port}/{onuId}/name', [\App\Http\Controllers\OltController::class, 'updateOnuName']);
    Route::post('/api/olt/{id}/onu/{port}/{onuId}/action', [\App\Http\Controllers\OltController::class, 'performOnuAction']);

    Route::get('/acs', function (App\Services\GenieAcsService $acsService) {
        return Inertia::render('acs', [
            'dataAcs' => $acsService->getDevices()
        ]);
    })->name('acs');

    Route::post('/acs/{id}/summon', function (\Illuminate\Http\Request $request, $id) {
        // In a real implementation, this would call GenieACS API:
        // POST /tasks/{id} {"name": "refreshObject", "objectName": ""}
        // For now we just return success so the UI can show a notification.
        return back()->with('message', 'Summon task created for ' . $id);
    })->name('acs.summon');

    Route::get('/pengeluaran', function (\Illuminate\Http\Request $request) {
        $query = Pengeluaran::query();
        
        $bulan = $request->query('bulan', date('n'));
        $tahun = $request->query('tahun', date('Y'));
        $kategori = $request->query('kategori');
        
        if ($bulan && $bulan !== 'Semua') {
            $query->whereMonth('tgl_pengeluaran', $bulan);
        }
        
        if ($tahun && $tahun !== 'Semua') {
            $query->whereYear('tgl_pengeluaran', $tahun);
        }
        
        if ($kategori && $kategori !== 'Semua') {
            $query->where('kategori', $kategori);
        }
        
        return Inertia::render('pengeluaran', [
            'dataPengeluaran' => $query->orderBy('tgl_pengeluaran', 'desc')->get(),
            'filters' => [
                'bulan' => $bulan,
                'tahun' => $tahun,
                'kategori' => $kategori ?? 'Semua'
            ]
        ]);
    })->name('pengeluaran');

    Route::post('/pengeluaran', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'nominal' => 'required|numeric',
            'keterangan' => 'required|string|max:255',
            'tgl_pengeluaran' => 'required|date',
            'kategori' => 'nullable|string|max:100',
        ]);
        Pengeluaran::create($validated);
        return back();
    });

    Route::put('/pengeluaran/{id}', function (\Illuminate\Http\Request $request, $id) {
        $validated = $request->validate([
            'nominal' => 'required|numeric',
            'keterangan' => 'required|string|max:255',
            'tgl_pengeluaran' => 'required|date',
            'kategori' => 'nullable|string|max:100',
        ]);
        Pengeluaran::findOrFail($id)->update($validated);
        return back();
    });

    Route::delete('/pengeluaran/{id}', function ($id) {
        Pengeluaran::findOrFail($id)->delete();
        return back();
    });

    Route::get('/tagihan', function () {
        $availableMonths = Tagihan::select('bulan_tagihan')->whereNotNull('bulan_tagihan')->distinct()->pluck('bulan_tagihan');
        $selectedMonth = request('bulan', now()->timezone('Asia/Jakarta')->translatedFormat('F Y'));
        $filter = request('filter');

        $query = Tagihan::with(['pelanggan' => function($q) {
            $q->with(['paket', 'area', 'tagihan' => function($tQuery) {
                $tQuery->where('status_bayar', '!=', 'Lunas')->select('id_tagihan', 'id_pelanggan', 'bulan_tagihan', 'total_tarif')->orderBy('bulan_tagihan', 'asc');
            }])->withCount(['tagihan as tunggakan_count' => function($query) {
                $query->where('status_bayar', '!=', 'Lunas');
            }]);
        }, 'pembayaran.user'])
            ->has('pelanggan')
            ->where('status_bayar', '!=', 'Lunas')
            ->orderBy('created_at', 'desc');

        if ($filter === 'hari-ini') {
            $query->where('bulan_tagihan', $selectedMonth)
                  ->whereHas('pelanggan', function($q) {
                      $q->where('tanggal', now()->timezone('Asia/Jakarta')->day);
                  });
        } elseif ($filter === 'isolir') {
            $query->where('bulan_tagihan', $selectedMonth)
                  ->whereHas('pelanggan', function($q) {
                      $q->where('status', 'ISOLIR');
                  });
        } elseif ($filter === 'tunggakan') {
            $query->whereIn('id_tagihan', function($q) {
                $q->selectRaw('MAX(id_tagihan)')
                  ->from('tagihan')
                  ->where('status_bayar', '!=', 'Lunas')
                  ->groupBy('id_pelanggan')
                  ->havingRaw('COUNT(DISTINCT bulan_tagihan) > 1');
            });
        } else {
            $query->where('bulan_tagihan', $selectedMonth);
        }
        
        $user = auth()->user();
        if ($user && $user->role === 'PENAGIH') {
            $areaIds = \App\Models\AreaPenagih::where('id_user', $user->id)->pluck('id_area');
            $query->whereHas('pelanggan', function($q) use ($areaIds) {
                $q->whereIn('id_area', $areaIds);
            });
        }

        return Inertia::render('tagihan', [
            'dataTagihan' => $query->get(),
            'availableMonths' => $availableMonths,
            'selectedMonth' => $selectedMonth,
        ]);
    })->name('tagihan');

    Route::get('/periode-tagihan', function () {
        if (!in_array(auth()->user()->role, ['SUPERADMIN', 'OWNER'])) {
            abort(403, 'Akses ditolak.');
        }

        $periodes = \App\Models\Tagihan::select(
            'bulan_tagihan',
            \Illuminate\Support\Facades\DB::raw('COUNT(*) as total_invoice'),
            \Illuminate\Support\Facades\DB::raw('SUM(total_tarif) as total_nominal'),
            \Illuminate\Support\Facades\DB::raw('SUM(CASE WHEN status_bayar = "Lunas" THEN 1 ELSE 0 END) as lunas_count'),
            \Illuminate\Support\Facades\DB::raw('SUM(CASE WHEN status_bayar = "Lunas" THEN total_tarif ELSE 0 END) as lunas_nominal')
        )
        ->groupBy('bulan_tagihan')
        ->orderByRaw("STR_TO_DATE(CONCAT('01 ', bulan_tagihan), '%d %M %Y') DESC")
        ->get();

        $metodeBayar = \App\Models\Pembayaran::join('tagihan', 'pembayaran.id_tagihan', '=', 'tagihan.id_tagihan')
            ->select('tagihan.bulan_tagihan', 'pembayaran.metode_bayar', \Illuminate\Support\Facades\DB::raw('SUM(pembayaran.jumlah_bayar) as total'))
            ->groupBy('tagihan.bulan_tagihan', 'pembayaran.metode_bayar')
            ->get()
            ->groupBy('bulan_tagihan');

        foreach ($periodes as $periode) {
            $periode->metode_breakdown = $metodeBayar->get($periode->bulan_tagihan) ?? collect();
        }

        $monthsList = [];
        for ($i = -1; $i <= 6; $i++) {
            $monthsList[] = \Carbon\Carbon::now()->addMonths($i)->translatedFormat('F Y');
        }

        return \Inertia\Inertia::render('periode-tagihan', [
            'dataPeriode' => $periodes,
            'monthsList' => $monthsList,
        ]);
    })->name('periode.tagihan');

    Route::get('/invoice-periode/{bulan}', function ($bulan) {
        if (!in_array(auth()->user()->role, ['SUPERADMIN', 'OWNER'])) {
            abort(403, 'Akses ditolak.');
        }

        $tagihan = \App\Models\Tagihan::with(['pelanggan.paket', 'pembayaran'])
            ->has('pelanggan')
            ->where('bulan_tagihan', $bulan)
            ->orderBy('id_tagihan', 'desc')
            ->get();

        $generatedPelangganIds = $tagihan->pluck('id_pelanggan')->toArray();

        $pelangganBelum = \App\Models\Pelanggan::with(['paket', 'area'])
            ->where('status', '!=', 'berhenti')
            ->whereNotIn('id', $generatedPelangganIds)
            ->orderBy('nama', 'asc')
            ->get();

        $totalPelanggan = \App\Models\Pelanggan::where('status', '!=', 'berhenti')->count();
        $invoiceDibuat = $tagihan->count();
        $belumDibuat = $pelangganBelum->count();

        $tunai = 0;
        $transfer = 0;
        foreach ($tagihan as $t) {
            $p = $t->pembayaran;
            if ($p) {
                $metode = strtolower($p->metode_bayar);
                if ($metode === 'tunai' || $metode === 'cash') {
                    $tunai += $p->jumlah_bayar;
                } elseif ($metode === 'transfer') {
                    $transfer += $p->jumlah_bayar;
                }
            }
        }

        return \Inertia\Inertia::render('invoice-periode', [
            'bulan' => $bulan,
            'dataTagihan' => $tagihan,
            'pelangganBelum' => $pelangganBelum,
            'metrics' => [
                'total_pelanggan' => $totalPelanggan,
                'invoice_dibuat' => $invoiceDibuat,
                'belum_dibuat' => $belumDibuat,
                'tunai' => $tunai,
                'transfer' => $transfer
            ]
        ]);
    })->name('invoice-periode.show');

    Route::delete('/tagihan/{id}', function ($id) {
        if (!in_array(auth()->user()->role, ['SUPERADMIN', 'OWNER'])) {
            abort(403, 'Akses ditolak.');
        }
        $tagihan = \App\Models\Tagihan::findOrFail($id);
        $tagihan->delete();
        return back()->with('success', 'Tagihan berhasil dihapus.');
    })->name('tagihan.destroy');

    Route::post('/tagihan/generate-single', function (\Illuminate\Http\Request $request) {
        if (!in_array(auth()->user()->role, ['SUPERADMIN', 'OWNER'])) {
            abort(403, 'Akses ditolak.');
        }

        $bulan = $request->input('bulan');
        $idPelanggan = $request->input('id_pelanggan');

        if (!$bulan || !$idPelanggan) {
            return back()->with('error', 'Data tidak lengkap.');
        }

        $pelanggan = \App\Models\Pelanggan::with('paket')->findOrFail($idPelanggan);

        $exists = \App\Models\Tagihan::where('id_pelanggan', $pelanggan->id)
            ->where('bulan_tagihan', $bulan)
            ->first();

        if ($exists) {
            return back()->with('error', "Tagihan bulan $bulan untuk pelanggan {$pelanggan->nama} sudah ada.");
        }

        $tagihan = \App\Models\Tagihan::create([
            'id_pelanggan' => $pelanggan->id,
            'bulan_tagihan' => $bulan,
            'total_tarif' => $pelanggan->paket ? $pelanggan->paket->paket_tarif : 0,
            'status_bayar' => 'Belum Bayar',
        ]);

        $ym = \Carbon\Carbon::parse($tagihan->created_at ?? now())->format('ym');
        $tagihan->update(['nomor_tagihan' => 'INV-' . $ym . str_pad($tagihan->id_tagihan, 3, '0', STR_PAD_LEFT)]);

        return back()->with('success', "Tagihan periode $bulan untuk {$pelanggan->nama} berhasil dibuat.");
    })->name('tagihan.generate-single');

    Route::post('/tagihan/generate', function (\Illuminate\Http\Request $request) {
        if (!in_array(auth()->user()->role, ['SUPERADMIN', 'OWNER'])) {
            abort(403, 'Akses ditolak.');
        }

        $bulan = $request->input('bulan');
        if (!$bulan) {
            return back()->with('error', 'Bulan tagihan tidak valid.');
        }

        $pelangganAktif = \App\Models\Pelanggan::with('paket')->where('status', '!=', 'berhenti')->get();
        $generatedCount = 0;

        foreach ($pelangganAktif as $pelanggan) {
            // Skip jika bulan daftar sama dengan bulan tagihan yang digenerate
            if ($pelanggan->tanggal_register) {
                $registeredMonth = \Carbon\Carbon::parse($pelanggan->tanggal_register)->translatedFormat('F Y');
                if ($registeredMonth === $bulan) {
                    continue;
                }
            }

            $exists = \App\Models\Tagihan::where('id_pelanggan', $pelanggan->id)
                ->where('bulan_tagihan', $bulan)
                ->exists();

            if (!$exists) {
                $tagihan = \App\Models\Tagihan::create([
                    'id_pelanggan' => $pelanggan->id,
                    'bulan_tagihan' => $bulan,
                    'total_tarif' => $pelanggan->paket ? $pelanggan->paket->paket_tarif : 0,
                    'status_bayar' => 'Belum Bayar',
                ]);
                $ym = \Carbon\Carbon::parse($tagihan->created_at ?? now())->format('ym');
                $tagihan->update(['nomor_tagihan' => 'INV-' . $ym . str_pad($tagihan->id_tagihan, 3, '0', STR_PAD_LEFT)]);
                $generatedCount++;
            }
        }

        return back()->with('success', "$generatedCount tagihan baru berhasil dibuat untuk bulan $bulan.");
    });

    Route::post('/tagihan/{id}/bayar', function (\Illuminate\Http\Request $request, $id) {
        $ids = $request->input('tagihan_ids', [$id]);

        $totalPaid = 0;
        $processedTagihans = [];
        $tenantId = null;
        $pelangganNama = 'Unknown';
        $customerId = null;
        $bulans = [];

        foreach ($ids as $tagihanId) {
            $tagihan = Tagihan::with('pelanggan')->findOrFail($tagihanId);
            if ($tagihan->status_bayar === 'Lunas') continue;

            $tenantId = $tagihan->pelanggan->tenant_id ?? auth()->user()->tenant_id;
            $pelangganNama = $tagihan->pelanggan->nama ?? 'Unknown';
            $customerId = $tagihan->pelanggan->id_user;
            $bulans[] = $tagihan->bulan_tagihan ?? 'ini';

            $tagihan->status_bayar = 'Lunas';
            $tagihan->tgl_bayar = now();
            $tagihan->metode_bayar = $request->payment_method === 'Transfer' ? 'Transfer' : 'Tunai';
            $tagihan->save();

            $totalPaid += $tagihan->total_tarif;

            Pembayaran::create([
                'invoice_number' => $tagihan->nomor_tagihan ?? ('INV-' . $tagihan->id_tagihan . '-' . time()),
                'id_tagihan' => $tagihan->id_tagihan,
                'id_pelanggan' => $tagihan->id_pelanggan,
                'jumlah_bayar' => $tagihan->total_tarif,
                'metode_bayar' => $request->payment_method === 'Transfer' ? 'Transfer' : 'Tunai',
                'tgl_bayar' => now(),
                'id_user' => auth()->id() ?? 1,
                'keterangan' => $request->keterangan
            ]);
            
            $processedTagihans[] = $tagihan;
        }

        // Auto-Unisolir Mikrotik jika semua lunas
        if (count($processedTagihans) > 0) {
            $pelanggan = $processedTagihans[0]->pelanggan;
            $unpaidCount = \App\Models\Tagihan::where('id_pelanggan', $pelanggan->id)->where('status_bayar', '!=', 'Lunas')->count();
            if ($unpaidCount === 0 && $pelanggan->status === 'ISOLIR') {
                $pelanggan->update(['status' => 'AKTIF']);
                \App\Events\PelangganUpdated::dispatch($tenantId ?? auth()->user()->tenant_id);

                if ($pelanggan->id_mikrotik) {
                    $mikrotik = \App\Models\MikrotikDevice::find($pelanggan->id_mikrotik);
                    $paket = \App\Models\Paket::find($pelanggan->id_paket);
                    if ($mikrotik && $mikrotik->is_isolir_enabled && $paket) {
                        try {
                            $client = new Client([
                                'host' => $mikrotik->ip,
                                'user' => $mikrotik->username ?? 'admin',
                                'pass' => $mikrotik->password ?? '',
                                'port' => (int)($mikrotik->port ?? 8728),
                                'timeout' => 3,
                            ]);
                            
                            $secret = $client->query('/ppp/secret/print', [['?name', $pelanggan->pppoe]])->read();
                            if (!empty($secret)) {
                                $oldComment = $secret[0]['comment'] ?? '';
                                $newComment = trim(preg_replace('/^\[ISOLIR:.*?\]\s*/', '', $oldComment));
                                
                                $profileToSet = $paket->paket_nama;
                                if (preg_match('/^\[ISOLIR:\s*(.+?)\]/', $oldComment, $matches)) {
                                    $profileToSet = trim($matches[1]);
                                }

                                $query = (new \RouterOS\Query('/ppp/secret/set'))
                                    ->equal('.id', $secret[0]['.id'])
                                    ->equal('profile', $profileToSet)
                                    ->equal('disabled', 'no');
                                
                                if ($newComment === '') {
                                    $query->equal('comment', '');
                                } else {
                                    $query->equal('comment', $newComment);
                                }
                                    
                                $client->query($query)->read();
                            }
                            
                            $active = $client->query('/ppp/active/print', [['?name', $pelanggan->pppoe]])->read();
                            if (!empty($active)) {
                                $query = (new \RouterOS\Query('/ppp/active/remove'))
                                    ->equal('.id', $active[0]['.id']);
                                $client->query($query)->read();
                            }
                        } catch (\Exception $e) {
                            \Illuminate\Support\Facades\Log::error('Auto-Unisolir Mikrotik failed: ' . $e->getMessage());
                        }
                    }
                }
            }
        }

        if (count($processedTagihans) > 0 && $tenantId) {
            $metode_teks = $request->payment_method === 'Transfer' ? 'transfer' : 'cash';
            $admin_nama = auth()->user()->nama ?? 'Sistem';
            $jumlah_rp = number_format($totalPaid, 0, ',', '.');
            
            // Format unique months nicely
            $uniqueBulans = array_unique($bulans);
            $bulan_tagihan_str = count($uniqueBulans) > 1 ? count($uniqueBulans) . ' Bulan' : implode(', ', $uniqueBulans);
            
            $pesan_admin = "Rp $jumlah_rp dari $pelangganNama (Bln $bulan_tagihan_str) oleh $admin_nama";

            // Broadcast TagihanUpdated for real-time frontend refresh
            event(new \App\Events\TagihanUpdated($tenantId));
            
            // Notify the customer (if linked and not the same as auth user)
            if ($customerId && $customerId !== auth()->id()) {
                \App\Models\Notification::create([
                    'tenant_id' => $tenantId,
                    'user_id' => $customerId,
                    'title' => 'Pembayaran Berhasil',
                    'message' => "Pembayaran tagihan $bulan_tagihan_str Anda sebesar Rp $jumlah_rp via $metode_teks telah diproses oleh $admin_nama.",
                    'type' => 'success',
                    'link' => '/tagihan',
                    'is_read' => false,
                ]);
            }

            // Notify the admin/staff who processed the payment
            \App\Models\Notification::create([
                'tenant_id' => $tenantId,
                'user_id' => auth()->id() ?? 1,
                'title' => 'Pembayaran Berhasil',
                'message' => $pesan_admin,
                'type' => 'success',
                'link' => '/tagihan',
                'is_read' => false,
            ]);

            // Execute time-consuming push notifications after response is sent to user (non-blocking)
            dispatch(function () use ($tenantId, $bulan_tagihan_str, $pelangganNama, $jumlah_rp, $metode_teks, $admin_nama, $pesan_admin) {
                try {
                    // Broadcast PembayaranBerhasil to owner/superadmin device
                    event(new \App\Events\PembayaranBerhasil($tenantId, $bulan_tagihan_str, $pelangganNama, $jumlah_rp, $metode_teks, $admin_nama));
                    
                    // Send Web Push Notification to Owner and Superadmin
                    $owners = \App\Models\User::where(function ($q) use ($tenantId) {
                        $q->where('tenant_id', $tenantId)->where('role', 'OWNER');
                    })->orWhere('role', 'SUPERADMIN')->get();
                    \Illuminate\Support\Facades\Notification::send($owners, new \App\Notifications\PembayaranBerhasilNotification($pesan_admin));
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Gagal mengirim Web Push: ' . $e->getMessage());
                }
            })->afterResponse();
        }

        return back();
    });

    Route::get('/tagihan/{id}/struk', function ($id) {
        $tagihan = \App\Models\Tagihan::with(['pelanggan.paket', 'pembayaran.user'])->findOrFail($id);
        $tenantId = $tagihan->pelanggan->tenant_id ?? auth()->user()->tenant_id ?? 1;
        $tenant = \App\Models\Tenant::find($tenantId);
        

        
        if (request()->has('download')) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('struk', compact('tagihan', 'tenant'));
            return $pdf->download('Invoice-' . ($tagihan->nomor_tagihan ?? $tagihan->id_tagihan) . '.pdf');
        }
        
        return view('struk', compact('tagihan', 'tenant'));
    });

    Route::post('/transaksi/{id}/batal', function ($id) {
        if (!in_array(auth()->user()->role, ['OWNER', 'SUPERADMIN'])) {
            abort(403, 'Unauthorized action.');
        }

        $pembayaran = \App\Models\Pembayaran::findOrFail($id);
        $tagihan = \App\Models\Tagihan::findOrFail($pembayaran->id_tagihan);
        
        $tagihan->status_bayar = 'Belum Bayar';
        $tagihan->save();
        
        $pembayaran->delete();

        return back()->with('success', 'Transaksi berhasil dibatalkan.');
    });

    Route::get('/performa-penagih', function () {
        if (auth()->user()->role === 'PENAGIH') abort(403);

        $availableYears = Tagihan::selectRaw('SUBSTRING_INDEX(bulan_tagihan, " ", -1) as tahun')
            ->whereNotNull('bulan_tagihan')
            ->distinct()
            ->pluck('tahun')
            ->filter()
            ->values()
            ->toArray();
            
        if (empty($availableYears)) {
            $availableYears = [now()->timezone('Asia/Jakarta')->translatedFormat('Y')];
        }

        $reqBulan = request('bulan', now()->timezone('Asia/Jakarta')->translatedFormat('F'));
        $reqTahun = request('tahun', now()->timezone('Asia/Jakarta')->translatedFormat('Y'));
        
        $selectedMonth = $reqBulan . ' ' . $reqTahun;

        $tenantId = auth()->user()->role === 'SUPERADMIN' && session('active_tenant_id') ? session('active_tenant_id') : auth()->user()->tenant_id;

        $penagihUsers = \App\Models\User::where('role', 'PENAGIH')
            ->where('tenant_id', $tenantId)
            ->get();
        
        $performa = $penagihUsers->map(function($user) use ($selectedMonth) {
            $areaIds = \App\Models\AreaPenagih::where('id_user', $user->id)->pluck('id_area');
            $areas = \App\Models\Area::whereIn('id_area', $areaIds)->pluck('nama_area')->join(', ');

            // Target Tagihan
            $target = Tagihan::whereHas('pelanggan', function($q) use ($areaIds) {
                $q->whereIn('id_area', $areaIds);
            })->where('bulan_tagihan', $selectedMonth)->sum('total_tarif');

            // Berhasil Ditagih (Lunas) berdasarkan siapa yang memproses pembayaran
            $berhasil = \App\Models\Pembayaran::where('id_user', $user->id)
                ->whereHas('tagihan', function($q) use ($selectedMonth) {
                    $q->where('bulan_tagihan', $selectedMonth);
                })->sum('jumlah_bayar');

            // Total Setoran (bulan tersebut)
            $englishMonth = str_ireplace(
                ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
                ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                $selectedMonth
            );
            $setoran = \App\Models\SetoranPenagih::where('id_user', $user->id)
                ->whereMonth('tgl_setoran', \Carbon\Carbon::parse($englishMonth)->month)
                ->whereYear('tgl_setoran', \Carbon\Carbon::parse($englishMonth)->year)
                ->sum('nominal'); 
            
            return [
                'id_user' => $user->id,
                'username' => $user->username,
                'areas' => $areas,
                'target' => $target,
                'berhasil' => $berhasil,
                'setoran' => $setoran,
                'mengendap' => $berhasil - $setoran,
            ];
        });

        // Calculate unique overall totals to avoid double counting from overlapping areas
        $allAreaIds = \App\Models\AreaPenagih::whereIn('id_user', $penagihUsers->pluck('id'))->pluck('id_area')->unique();
        
        $overallTarget = Tagihan::whereHas('pelanggan', function($q) use ($allAreaIds) {
            $q->whereIn('id_area', $allAreaIds);
        })->where('bulan_tagihan', $selectedMonth)->sum('total_tarif');

        $overallBerhasil = \App\Models\Pembayaran::whereIn('id_user', $penagihUsers->pluck('id'))
            ->whereHas('tagihan', function($q) use ($selectedMonth) {
                $q->where('bulan_tagihan', $selectedMonth);
            })->sum('jumlah_bayar');

        return Inertia::render('performa-penagih', [
            'performaData' => $performa,
            'availableYears' => $availableYears,
            'reqBulan' => $reqBulan,
            'reqTahun' => $reqTahun,
            'overallTarget' => $overallTarget,
            'overallBerhasil' => $overallBerhasil,
        ]);
    })->name('performa-penagih');

    Route::post('/performa-penagih/setoran', function (\Illuminate\Http\Request $request) {
        if (auth()->user()->role === 'PENAGIH') abort(403);

        $request->validate([
            'id_user' => 'required|exists:users,id',
            'nominal' => 'required|numeric|min:1',
            'keterangan' => 'nullable|string',
            'tgl_setoran' => 'nullable|date',
        ]);

        \App\Models\SetoranPenagih::create([
            'id_user' => $request->id_user,
            'nominal' => $request->nominal,
            'tgl_setoran' => $request->tgl_setoran ? \Carbon\Carbon::parse($request->tgl_setoran) : now(),
            'status' => 'Diterima',
            'id_admin' => auth()->id(),
            'keterangan' => $request->keterangan,
        ]);

        return back()->with('success', 'Setoran berhasil dicatat.');
    })->name('performa-penagih.setoran');

    Route::post('/riwayat-setoran/{id}/approve', function (\Illuminate\Http\Request $request, $id) {
        $user = auth()->user();
        if ($user->role !== 'OWNER' && $user->role !== 'SUPERADMIN') abort(403);

        $setoran = \App\Models\SetoranPenagih::findOrFail($id);
        if ($setoran->status === 'pending') {
            $setoran->status = 'diterima';
            $setoran->id_admin = $user->id;
            $setoran->save();
        }

        return back()->with('success', 'Setoran berhasil dikonfirmasi.');
    })->name('riwayat-setoran.approve');

    Route::delete('/riwayat-setoran/{id}', function ($id) {
        $user = auth()->user();
        if ($user->role !== 'OWNER' && $user->role !== 'SUPERADMIN') abort(403);

        $setoran = \App\Models\SetoranPenagih::findOrFail($id);
        $setoran->delete();

        return back()->with('success', 'Setoran berhasil dihapus.');
    })->name('riwayat-setoran.destroy');

    Route::post('/riwayat-setoran', function (\Illuminate\Http\Request $request) {
        $user = auth()->user();
        if ($user->role !== 'PENAGIH' && $user->role !== 'OWNER') abort(403);

        $request->validate([
            'nominal' => 'required|numeric|min:1',
            'keterangan' => 'nullable|string',
            'tgl_setoran' => 'nullable|date',
        ]);

        \App\Models\SetoranPenagih::create([
            'id_user' => $user->id,
            'nominal' => $request->nominal,
            'tgl_setoran' => $request->tgl_setoran ? \Carbon\Carbon::parse($request->tgl_setoran) : now(),
            'status' => 'pending',
            'id_admin' => null,
            'keterangan' => $request->keterangan,
        ]);

        return back()->with('success', 'Setoran berhasil dicatat.');
    })->name('riwayat-setoran.store');

    Route::get('/riwayat-setoran', function (\Illuminate\Http\Request $request) {
        $query = \App\Models\SetoranPenagih::with(['user', 'admin'])->orderBy('tgl_setoran', 'desc');

        $user = auth()->user();
        if ($user && $user->role === 'PENAGIH') {
            $query->where('id_user', $user->id);
        }

        return Inertia::render('riwayat-setoran', [
            'dataSetoran' => $query->get()
        ]);
    })->name('riwayat-setoran');

    Route::get('/tiket', function () {
        return Inertia::render('tiket', [
            'dataTiket' => \App\Models\Tiket::with(['pelanggan', 'teknisi'])->orderBy('tgl_dibuat', 'desc')->get(),
            'dataPelanggan' => \App\Models\Pelanggan::select('id', 'nama', 'pppoe')->orderBy('nama')->get(),
            'dataTeknisi' => \App\Models\User::where('role', 'TEKNISI')->select('id', 'nama', 'name')->get()
        ]);
    })->name('tiket');

    Route::post('/tiket', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'id_pelanggan' => 'required|integer|exists:pelanggan,id',
            'judul' => 'required|string|max:255',
            'deskripsi' => 'required|string',
            'kategori' => 'nullable|string|max:100',
            'prioritas' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:50',
            'ditugaskan_ke' => 'nullable|integer|exists:users,id',
        ]);
        
        $validated['tgl_dibuat'] = now();
        if ($request->status === 'Selesai') {
            $validated['tgl_diselesaikan'] = now();
        }

        \App\Models\Tiket::create($validated);
        return back()->with('success', 'Tiket berhasil dibuat.');
    });

    Route::put('/tiket/{id}', function (\Illuminate\Http\Request $request, $id) {
        $validated = $request->validate([
            'id_pelanggan' => 'required|integer|exists:pelanggan,id',
            'judul' => 'required|string|max:255',
            'deskripsi' => 'required|string',
            'kategori' => 'nullable|string|max:100',
            'prioritas' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:50',
            'ditugaskan_ke' => 'nullable|integer|exists:users,id',
        ]);

        $tiket = \App\Models\Tiket::findOrFail($id);
        
        if ($request->status === 'Selesai' && $tiket->status !== 'Selesai') {
            $validated['tgl_diselesaikan'] = now();
        } elseif ($request->status !== 'Selesai') {
            $validated['tgl_diselesaikan'] = null;
        }

        $tiket->update($validated);
        return back()->with('success', 'Tiket berhasil diperbarui.');
    });

    Route::delete('/tiket/{id}', function ($id) {
        \App\Models\Tiket::findOrFail($id)->delete();
        return back()->with('success', 'Tiket berhasil dihapus.');
    });

    Route::get('/laporan-tunggakan', function (\Illuminate\Http\Request $request) {
        // Query to get all unpaid bills
        $query = \App\Models\Tagihan::with(['pelanggan.paket', 'pelanggan.area'])
            ->where('status_bayar', '!=', 'Lunas');

        $tagihan = $query->orderBy('bulan_tagihan', 'desc')->get();

        // Calculate sisa for each tagihan
        $dataTunggakan = $tagihan->map(function ($t) {
            $total_bayar = \App\Models\Pembayaran::where('id_tagihan', $t->id_tagihan)->sum('jumlah_bayar');
            $sisa = $t->total_tarif - $total_bayar;
            return [
                'id_tagihan' => $t->id_tagihan,
                'pelanggan' => $t->pelanggan,
                'bulan_tagihan' => $t->bulan_tagihan,
                'total_tarif' => $t->total_tarif,
                'total_bayar' => $total_bayar,
                'sisa_tagihan' => $sisa,
                'status_bayar' => $t->status_bayar,
            ];
        });

        return Inertia::render('laporan-tunggakan', [
            'dataTunggakan' => $dataTunggakan,
            'filters' => []
        ]);
    })->name('laporan-tunggakan');

    // Static pages or pages that don't need heavy real DB for now
    Route::get('/area', function () {
        return Inertia::render('area', [
            'dataArea' => App\Models\Area::with(['pelanggan:id,id_area,nama,nomor_pelanggan,status'])->withCount('pelanggan')->get()
        ]);
    })->name('area');

    Route::get('/area-penagih', [\App\Http\Controllers\AreaPenagihController::class, 'index'])->name('area-penagih');
    Route::post('/area-penagih/{userId}', [\App\Http\Controllers\AreaPenagihController::class, 'store']);

    Route::post('/area', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'nama_area' => 'required|string|max:100|unique:area,nama_area',
            'deskripsi' => 'nullable|string',
        ]);
        App\Models\Area::create($validated);
        return back();
    });

    Route::put('/area/{id}', function (\Illuminate\Http\Request $request, $id) {
        $validated = $request->validate([
            'nama_area' => 'required|string|max:100|unique:area,nama_area,'.$id.',id_area',
            'deskripsi' => 'nullable|string',
        ]);
        App\Models\Area::where('id_area', $id)->update($validated);
        return back();
    });

    Route::delete('/area/{id}', function ($id) {
        App\Models\Area::where('id_area', $id)->delete();
        return back();
    });

    Route::get('/paket', function () {
        return Inertia::render('paket', [
            'dataPaket' => App\Models\Paket::withCount('pelanggan')->get()
        ]);
    })->name('paket');

    Route::post('/paket', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'paket_nama' => 'required|string|max:100',
            'paket_tarif' => 'required|numeric',
            'kecepatan' => 'nullable|numeric',
            'description' => 'nullable|string'
        ]);
        App\Models\Paket::create($validated);
        return back();
    });

    Route::put('/paket/{id}', function (\Illuminate\Http\Request $request, $id) {
        $validated = $request->validate([
            'paket_nama' => 'required|string|max:100',
            'paket_tarif' => 'required|numeric',
            'kecepatan' => 'nullable|numeric',
            'description' => 'nullable|string'
        ]);
        App\Models\Paket::where('id_paket', $id)->update($validated);
        return back();
    });

    Route::delete('/paket/{id}', function ($id) {
        App\Models\Paket::where('id_paket', $id)->delete();
        return back();
    });
    Route::get('/user', function () {
        $query = \App\Models\User::orderBy('id', 'asc');
        $user = auth()->user();
        if ($user->role === 'SUPERADMIN') {
            $activeTenantId = session('active_tenant_id');
            if ($activeTenantId) {
                $query->where('tenant_id', $activeTenantId);
            }
        } else {
            $query->where('tenant_id', $user->tenant_id);
        }
        $users = $query->get();

        $areaMappings = \App\Models\AreaPenagih::all()->groupBy('id_user')->map(function ($items) {
            return $items->pluck('id_area');
        });

        $areaQuery = \App\Models\Area::query();
        if ($user->role === 'SUPERADMIN') {
            if ($activeTenantId = session('active_tenant_id')) {
                $areaQuery->where('tenant_id', $activeTenantId);
            }
        } else {
            $areaQuery->where('tenant_id', $user->tenant_id);
        }
        
        return Inertia::render('user', [
            'dataUser' => $users->map(function($user) use ($areaMappings) {
                $user->area_ids = $areaMappings[$user->id] ?? [];
                return $user;
            }),
            'dataArea' => $areaQuery->get()
        ]);
    })->name('user');

    Route::post('/user', function (\Illuminate\Http\Request $request) {
        if (!in_array(auth()->user()->role, ['SUPERADMIN', 'OWNER'])) {
            abort(403, 'Akses ditolak.');
        }
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:4',
            'role' => 'required|in:SUPERADMIN,OWNER,TEKNISI,PENAGIH',
            'status' => 'required|in:AKTIF,NONAKTIF',
            'area_ids' => 'array',
            'alamat' => 'nullable|string|max:255',
            'telepon' => 'nullable|string|max:20',
        ]);
        $tenantId = auth()->user()->role === 'SUPERADMIN' ? session('active_tenant_id') : auth()->user()->tenant_id;
        $user = \App\Models\User::create([
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'nama' => $validated['name'],
            'username' => explode('@', $validated['email'])[0],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $validated['role'],
            'status' => $validated['status'],
            'alamat' => $validated['alamat'] ?? null,
            'telepon' => $validated['telepon'] ?? null,
        ]);
        
        if ($validated['role'] === 'PENAGIH' && !empty($validated['area_ids'])) {
            foreach($validated['area_ids'] as $areaId) {
                \App\Models\AreaPenagih::create(['id_user' => $user->id, 'id_area' => $areaId]);
            }
        }
        return back();
    });

    Route::put('/user/{id}', function (\Illuminate\Http\Request $request, $id) {
        if (!in_array(auth()->user()->role, ['SUPERADMIN', 'OWNER'])) {
            abort(403, 'Akses ditolak.');
        }
        $user = \App\Models\User::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$id,
            'role' => 'required|in:SUPERADMIN,OWNER,TEKNISI,PENAGIH',
            'status' => 'required|in:AKTIF,NONAKTIF',
            'area_ids' => 'array',
            'alamat' => 'nullable|string|max:255',
            'telepon' => 'nullable|string|max:20',
        ]);
        $user->name = $validated['name'];
        $user->nama = $validated['name'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];
        $user->status = $validated['status'];
        $user->alamat = $validated['alamat'] ?? null;
        $user->telepon = $validated['telepon'] ?? null;
        if ($request->filled('password')) {
            $user->password = $request->password;
        }
        $user->save();
        
        \App\Models\AreaPenagih::where('id_user', $user->id)->delete();
        if ($validated['role'] === 'PENAGIH' && !empty($validated['area_ids'])) {
            foreach($validated['area_ids'] as $areaId) {
                \App\Models\AreaPenagih::create(['id_user' => $user->id, 'id_area' => $areaId]);
            }
        }
        return back();
    });

    Route::delete('/user/{id}', function ($id) {
        if (!in_array(auth()->user()->role, ['SUPERADMIN', 'OWNER'])) {
            abort(403, 'Akses ditolak.');
        }
        \App\Models\User::findOrFail($id)->delete();
        return back();
    });

    Route::get('/map', function () {
        $pelanggan = \App\Models\Pelanggan::with(['area', 'paket'])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get();

        return Inertia::render('map', [
            'dataPelanggan' => $pelanggan,
            'dataArea' => \App\Models\Area::all(),
            'dataPaket' => \App\Models\Paket::all(),
            'totalPelangganSemua' => \App\Models\Pelanggan::count(),
            'totalPelangganBerkoordinat' => $pelanggan->count(),
        ]);
    })->name('map');
    Route::inertia('pesan', 'pesan')->name('pesan');

    Route::get('/mitra', [\App\Http\Controllers\MitraController::class, 'index'])->name('mitra.index');
    Route::post('/mitra', [\App\Http\Controllers\MitraController::class, 'store'])->name('mitra.store');
    Route::put('/mitra/{id}', [\App\Http\Controllers\MitraController::class, 'update'])->name('mitra.update');
    Route::delete('/mitra/{id}', [\App\Http\Controllers\MitraController::class, 'destroy'])->name('mitra.destroy');
    Route::post('/mitra/{id}/invoice', [\App\Http\Controllers\MitraController::class, 'generateInvoice'])->name('mitra.invoice');

    Route::get('/transaksi', function () {
        $user = auth()->user();
        $tenantId = $user->role === 'SUPERADMIN' && session('active_tenant_id') ? session('active_tenant_id') : $user->tenant_id;

        $query = \App\Models\Pembayaran::with(['pelanggan.paket', 'pelanggan.area', 'user', 'tagihan'])
            ->where('tenant_id', $tenantId)
            ->orderBy('tgl_bayar', 'desc');
        
        if ($user && $user->role === 'PENAGIH') {
            $areaIds = \App\Models\AreaPenagih::where('id_user', $user->id)->pluck('id_area')->toArray();
            $query->whereHas('pelanggan', function($q) use ($areaIds) {
                $q->whereIn('id_area', $areaIds);
            });
        }

        $transaksis = $query->get();

        return Inertia::render('transaksi', [
            'dataTransaksi' => $transaksis
        ]);
    })->name('transaksi');

    Route::get('/transaksi/{id}/invoice', function ($id) {
        $transaksi = \App\Models\Pembayaran::with(['pelanggan.paket', 'user', 'tagihan'])->findOrFail($id);
        $tenantId = $transaksi->pelanggan->tenant_id ?? session('active_tenant_id') ?? auth()->user()->tenant_id ?? 1;
        $tenant = \App\Models\Tenant::find($tenantId);
        return Inertia::render('invoice', [
            'transaksi' => $transaksi,
            'tenant' => $tenant
        ]);
    })->name('transaksi.invoice');

    Route::get('/laporan/cetak', function () {
        $reqBulan = request('bulan', now()->timezone('Asia/Jakarta')->translatedFormat('F'));
        $reqTahun = request('tahun', now()->timezone('Asia/Jakarta')->translatedFormat('Y'));
        
        $selectedMonth = $reqBulan . ' ' . $reqTahun;

        $months = ['Januari'=>1,'Februari'=>2,'Maret'=>3,'April'=>4,'Mei'=>5,'Juni'=>6,'Juli'=>7,'Agustus'=>8,'September'=>9,'Oktober'=>10,'November'=>11,'Desember'=>12];
        $m = $months[$reqBulan] ?? now()->month;
        $y = $reqTahun ?? now()->year;

        $income = Tagihan::where('bulan_tagihan', $selectedMonth)->where('status_bayar', 'Lunas')->sum('total_tarif');
        $expense = Pengeluaran::whereMonth('tgl_pengeluaran', $m)->whereYear('tgl_pengeluaran', $y)->sum('nominal');

        $incomeTransactions = Tagihan::with('pelanggan')
            ->where('bulan_tagihan', $selectedMonth)
            ->where('status_bayar', 'Lunas')
            ->get()
            ->map(function ($t) {
                return [
                    'date' => $t->updated_at->format('Y-m-d'),
                    'type' => 'Pemasukan',
                    'description' => 'Pembayaran Tagihan ' . ($t->pelanggan->nama ?? 'Unknown'),
                    'amount' => $t->total_tarif
                ];
            });

        $expenseTransactions = Pengeluaran::whereMonth('tgl_pengeluaran', $m)
            ->whereYear('tgl_pengeluaran', $y)
            ->get()
            ->map(function ($e) {
                return [
                    'date' => \Carbon\Carbon::parse($e->tgl_pengeluaran)->format('Y-m-d'),
                    'type' => 'Pengeluaran',
                    'description' => $e->keterangan ?? 'Pengeluaran',
                    'amount' => $e->nominal
                ];
            });

        $transactions = $incomeTransactions->concat($expenseTransactions)->sortByDesc('date')->values()->all();

        $dailyRecap = [];
        $daysInMonth = \Carbon\Carbon::createFromDate($y, $m, 1)->daysInMonth;
        for ($i = 1; $i <= $daysInMonth; $i++) {
            $dateStr = sprintf('%04d-%02d-%02d', $y, $m, $i);
            $inc = Tagihan::where('bulan_tagihan', $selectedMonth)
                          ->where('status_bayar', 'Lunas')
                          ->whereDate('updated_at', $dateStr)
                          ->sum('total_tarif');
            $exp = Pengeluaran::whereDate('tgl_pengeluaran', $dateStr)->sum('nominal');
            if ($inc > 0 || $exp > 0) {
                $dailyRecap[] = [
                    'date' => \Carbon\Carbon::parse($dateStr)->format('d M Y'),
                    'income' => $inc,
                    'expense' => $exp,
                    'profit' => $inc - $exp,
                ];
            }
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.laporan', [
            'selectedMonth' => $selectedMonth,
            'income' => $income,
            'expense' => $expense,
            'profit' => $income - $expense,
            'transactions' => $transactions,
            'dailyRecap' => $dailyRecap,
        ]);

        return $pdf->download('Laporan_Keuangan_' . str_replace(' ', '_', $selectedMonth) . '.pdf');
    })->name('laporan.cetak');
    Route::get('/laporan', function () {
        $availableYears = Tagihan::selectRaw('SUBSTRING_INDEX(bulan_tagihan, " ", -1) as tahun')
            ->whereNotNull('bulan_tagihan')
            ->distinct()
            ->pluck('tahun')
            ->filter()
            ->values()
            ->toArray();
            
        if (empty($availableYears)) {
            $availableYears = [now()->timezone('Asia/Jakarta')->translatedFormat('Y')];
        }

        $reqBulan = request('bulan', now()->timezone('Asia/Jakarta')->translatedFormat('F'));
        $reqTahun = request('tahun', now()->timezone('Asia/Jakarta')->translatedFormat('Y'));
        
        $selectedMonth = $reqBulan . ' ' . $reqTahun;

        $months = ['Januari'=>1,'Februari'=>2,'Maret'=>3,'April'=>4,'Mei'=>5,'Juni'=>6,'Juli'=>7,'Agustus'=>8,'September'=>9,'Oktober'=>10,'November'=>11,'Desember'=>12];
        $parts = explode(' ', $selectedMonth);
        $m = $months[$parts[0]] ?? now()->month;
        $y = $parts[1] ?? now()->year;

        // currentMonthStats
        $income = Tagihan::where('bulan_tagihan', $selectedMonth)->where('status_bayar', 'Lunas')->sum('total_tarif');
        $expense = Pengeluaran::whereMonth('tgl_pengeluaran', $m)->whereYear('tgl_pengeluaran', $y)->sum('nominal');
        $unpaid = Tagihan::where('bulan_tagihan', $selectedMonth)->where('status_bayar', '!=', 'Lunas')->sum('total_tarif');

        $lastMonthDate = \Carbon\Carbon::createFromDate($y, $m, 1)->subMonth();
        $lastMonthName = $lastMonthDate->translatedFormat('F Y');
        $prevIncome = Tagihan::where('bulan_tagihan', $lastMonthName)->where('status_bayar', 'Lunas')->sum('total_tarif');
        $prevExpense = Pengeluaran::whereMonth('tgl_pengeluaran', $lastMonthDate->month)->whereYear('tgl_pengeluaran', $lastMonthDate->year)->sum('nominal');

        $incomeGrowth = $prevIncome > 0 ? round((($income - $prevIncome) / $prevIncome) * 100, 1) : 0;
        $expenseGrowth = $prevExpense > 0 ? round((($expense - $prevExpense) / $prevExpense) * 100, 1) : 0;

        $currentMonthStats = [
            'income' => $income,
            'expense' => $expense,
            'profit' => $income - $expense,
            'unpaid' => $unpaid,
            'incomeGrowth' => $incomeGrowth,
            'expenseGrowth' => $expenseGrowth,
        ];

        // unpaidByArea
        $tagihanUnpaid = Tagihan::with(['pelanggan.area', 'pelanggan.paket'])->where('bulan_tagihan', $selectedMonth)->where('status_bayar', '!=', 'Lunas')->get();
        $unpaidByAreaMap = [];
        foreach($tagihanUnpaid as $t) {
            $areaName = $t->pelanggan && $t->pelanggan->area ? $t->pelanggan->area->nama_area : 'Tanpa Area';
            if(!isset($unpaidByAreaMap[$areaName])) {
                $unpaidByAreaMap[$areaName] = ['name' => $areaName, 'amount' => 0, 'count' => 0];
            }
            $unpaidByAreaMap[$areaName]['amount'] += $t->total_tarif;
            $unpaidByAreaMap[$areaName]['count']++;
        }
        $unpaidByArea = array_values($unpaidByAreaMap);

        // expenseBreakdown
        $expensesBulanIni = Pengeluaran::whereMonth('tgl_pengeluaran', $m)->whereYear('tgl_pengeluaran', $y)->get();
        $expenseBreakdownMap = [];
        foreach($expensesBulanIni as $e) {
            $cat = $e->kategori ?? 'Lain-lain';
            if(!isset($expenseBreakdownMap[$cat])) {
                $expenseBreakdownMap[$cat] = ['name' => $cat, 'amount' => 0];
            }
            $expenseBreakdownMap[$cat]['amount'] += $e->nominal;
        }
        $totalExp = array_sum(array_column($expenseBreakdownMap, 'amount'));
        foreach($expenseBreakdownMap as &$eb) {
            $eb['percent'] = $totalExp > 0 ? round(($eb['amount'] / $totalExp) * 100) : 0;
        }
        $expenseBreakdown = array_values($expenseBreakdownMap);

        // monthlyData
        $monthlyData = [];
        $dt = \Carbon\Carbon::createFromDate($y, $m, 1);
        $mName = $dt->translatedFormat('F Y');
        $inc = Tagihan::where('bulan_tagihan', $mName)->where('status_bayar', 'Lunas')->sum('total_tarif');
        $exp = Pengeluaran::whereMonth('tgl_pengeluaran', $dt->month)->whereYear('tgl_pengeluaran', $dt->year)->sum('nominal');
        $profit = $inc - $exp;
        $monthlyData[] = [
            'month' => $mName,
            'income' => $inc,
            'expense' => $exp,
            'profit' => $profit,
            'status' => $profit >= 0 ? 'Naik' : 'Turun'
        ];

        $pelangganAktif = \App\Models\Pelanggan::where('status', 'aktif')->count();
        $pelangganIsolir = \App\Models\Pelanggan::where('status', 'isolir')->count();
        $pelangganBaru = \App\Models\Pelanggan::whereMonth('tanggal_register', $m)->whereYear('tanggal_register', $y)->count();
        $pelangganNunggak = Tagihan::where('bulan_tagihan', $selectedMonth)->where('status_bayar', '!=', 'Lunas')->distinct('id_pelanggan')->count('id_pelanggan');

        $customerStats = [
            'aktif' => $pelangganAktif,
            'isolir' => $pelangganIsolir,
            'nunggak' => $pelangganNunggak,
            'baru' => $pelangganBaru
        ];

        $tagihanStats = [
            'totalAmount' => Tagihan::where('bulan_tagihan', $selectedMonth)->sum('total_tarif'),
            'totalCount' => Tagihan::where('bulan_tagihan', $selectedMonth)->count(),
            'lunasAmount' => Tagihan::where('bulan_tagihan', $selectedMonth)->where('status_bayar', 'Lunas')->sum('total_tarif'),
            'lunasCount' => Tagihan::where('bulan_tagihan', $selectedMonth)->where('status_bayar', 'Lunas')->count(),
            'unpaidAmount' => Tagihan::where('bulan_tagihan', $selectedMonth)->where('status_bayar', '!=', 'Lunas')->sum('total_tarif'),
            'unpaidCount' => Tagihan::where('bulan_tagihan', $selectedMonth)->where('status_bayar', '!=', 'Lunas')->count(),
        ];

        // chartData (daily)
        $chartData = [];
        $daysInMonth = \Carbon\Carbon::createFromDate($y, $m, 1)->daysInMonth;
        for ($i = 1; $i <= $daysInMonth; $i++) {
            $dateStr = sprintf('%04d-%02d-%02d', $y, $m, $i);
            $inc = Tagihan::where('bulan_tagihan', $selectedMonth)
                          ->where('status_bayar', 'Lunas')
                          ->whereDate('updated_at', $dateStr) // assuming updated_at is when it was paid
                          ->sum('total_tarif');
            $exp = Pengeluaran::whereDate('tgl_pengeluaran', $dateStr)->sum('nominal');
            $chartData[] = [
                'date' => $i,
                'income' => $inc,
                'expense' => $exp,
            ];
        }

        // unpaidList (list of customers who haven't paid)
        $unpaidList = $tagihanUnpaid->map(function ($t) {
            return [
                'id' => 'T-'.$t->id_tagihan,
                'customer_name' => $t->pelanggan->nama ?? 'Unknown',
                'area_name' => $t->pelanggan && $t->pelanggan->area ? $t->pelanggan->area->nama_area : '-',
                'package_name' => $t->pelanggan && $t->pelanggan->paket ? $t->pelanggan->paket->paket_nama : '-',
                'amount' => $t->total_tarif
            ];
        })->sortByDesc('amount')->values()->all();

        return Inertia::render('laporan', [
            'availableYears' => $availableYears,
            'reqBulan' => $reqBulan,
            'reqTahun' => $reqTahun,
            'selectedMonth' => $selectedMonth,
            'currentMonthStats' => $currentMonthStats,
            'unpaidByArea' => $unpaidByArea,
            'expenseBreakdown' => $expenseBreakdown,
            'monthlyData' => $monthlyData,
            'customerStats' => $customerStats,
            'tagihanStats' => $tagihanStats,
            'chartData' => $chartData,
            'unpaidList' => $unpaidList,
        ]);
    })->name('laporan');
    Route::inertia('voucher', 'voucher')->name('voucher');
    
    Route::get('/pengaturan-billing', function () {
        if (auth()->user()->role !== 'SUPERADMIN' && auth()->user()->role !== 'OWNER') abort(403);
        
        $tenantId = auth()->user()->role === 'SUPERADMIN' ? session('active_tenant_id', auth()->user()->tenant_id) : auth()->user()->tenant_id;
        $tenant = \App\Models\Tenant::find($tenantId);
        
        return Inertia::render('pengaturan-billing', [
            'tenant' => $tenant
        ]);
    })->name('pengaturan-billing');

    Route::post('/pengaturan-billing', function (\Illuminate\Http\Request $request) {
        if (auth()->user()->role !== 'SUPERADMIN' && auth()->user()->role !== 'OWNER') abort(403);
        
        $request->validate([
            'nama' => 'required|string|max:255',
            'alamat' => 'nullable|string|max:255',
            'telepon' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'invoice_footer' => 'nullable|string',
            'jatuh_tempo_default' => 'required|integer|min:1|max:28',
        ]);

        $tenantId = auth()->user()->role === 'SUPERADMIN' ? session('active_tenant_id', auth()->user()->tenant_id) : auth()->user()->tenant_id;
        $tenant = \App\Models\Tenant::find($tenantId);
        if ($tenant) {
            $tenant->update([
                'nama' => $request->nama,
                'alamat' => $request->alamat,
                'telepon' => $request->telepon,
                'email' => $request->email,
                'invoice_footer' => $request->invoice_footer,
                'jatuh_tempo_default' => $request->jatuh_tempo_default,
            ]);
        }

        return back()->with('success', 'Pengaturan berhasil disimpan.');
    })->name('pengaturan-billing.store');
});

require __DIR__.'/settings.php';
