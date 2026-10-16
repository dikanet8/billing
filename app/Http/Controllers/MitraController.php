<?php

namespace App\Http\Controllers;

use App\Models\Mitra;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MitraController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $query = Mitra::query();

        if ($search) {
            $query->where('nama', 'like', "%{$search}%")
                  ->orWhere('telepon', 'like', "%{$search}%");
        }

        $mitras = $query->latest()->get();

        return Inertia::render('mitra', [
            'mitras' => $mitras
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'telepon' => 'nullable|string|max:50',
            'alamat' => 'nullable|string',
            'keterangan' => 'nullable|string',
            'bandwidth' => 'nullable|integer|min:0',
            'harga' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        $data = $request->all();
        if (!isset($data['status'])) $data['status'] = 'aktif';
        if (!isset($data['bandwidth'])) $data['bandwidth'] = 0;
        if (!isset($data['harga'])) $data['harga'] = 0;

        Mitra::create($data);

        return redirect()->back()->with('message', 'Mitra berhasil ditambahkan');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'telepon' => 'nullable|string|max:50',
            'alamat' => 'nullable|string',
            'keterangan' => 'nullable|string',
            'bandwidth' => 'nullable|integer|min:0',
            'harga' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        $mitra = Mitra::findOrFail($id);
        
        $data = $request->all();
        if (!isset($data['status'])) $data['status'] = 'aktif';
        if (!isset($data['bandwidth'])) $data['bandwidth'] = 0;
        if (!isset($data['harga'])) $data['harga'] = 0;

        $mitra->update($data);

        return redirect()->back()->with('message', 'Mitra berhasil diubah');
    }

    public function destroy($id)
    {
        $mitra = Mitra::findOrFail($id);
        $mitra->delete();

        return redirect()->back()->with('message', 'Mitra berhasil dihapus');
    }

    public function generateInvoice($id)
    {
        $mitra = Mitra::findOrFail($id);
        
        if ($mitra->harga <= 0) {
            return redirect()->back()->withErrors(['message' => 'Tarif mitra masih 0, tidak dapat menerbitkan invoice.']);
        }

        $periode = date('m-Y');
        $nomor_invoice = 'INV-M-' . date('ymdHis') . '-' . $mitra->id_mitra;

        // Check if invoice for this period already exists
        $exists = \App\Models\TagihanMitra::where('id_mitra', $mitra->id_mitra)
                    ->where('periode', $periode)
                    ->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['message' => 'Invoice bulan ini sudah diterbitkan untuk Mitra ini.']);
        }

        \App\Models\TagihanMitra::create([
            'id_mitra' => $mitra->id_mitra,
            'nomor_invoice' => $nomor_invoice,
            'periode' => $periode,
            'nominal' => $mitra->harga,
            'status_bayar' => 'Belum Bayar',
        ]);

        return redirect()->back()->with('message', 'Invoice berhasil diterbitkan untuk bulan ini');
    }
}

