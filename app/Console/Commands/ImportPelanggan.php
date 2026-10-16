<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:import-pelanggan')]
#[Description('Command description')]
class ImportPelanggan extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $inputFileName = base_path('pelanggan baru.xlsx');
        if (!file_exists($inputFileName)) {
            $this->error('File pelanggan baru.xlsx not found.');
            return;
        }

        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($inputFileName);
        $worksheet = $spreadsheet->getActiveSheet();
        
        // 1. Rename headers in the Excel file
        $headers = [
            'A1' => 'nama',
            'B1' => 'alamat',
            'C1' => 'telepon',
            'D1' => 'pppoe',
            'E1' => 'tanggal_register',
            'F1' => 'id_area',
            'G1' => 'id_paket',
            'H1' => 'paket_tarif',
            'I1' => 'modem',
            'J1' => 'id_mikrotik',
        ];

        foreach ($headers as $cell => $value) {
            $worksheet->setCellValue($cell, $value);
        }

        // Save the renamed Excel file
        $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save($inputFileName);
        $this->info('Headers in Excel file updated.');

        // 2. Read rows and import to database
        $rows = $worksheet->toArray();
        // Remove header row
        array_shift($rows);

        $count = 0;
        foreach ($rows as $row) {
            // Check if row is empty (skip if nama is empty)
            if (empty(trim($row[0]))) continue;

            $nama = $row[0];
            $alamat = $row[1];
            $telepon = $row[2];
            $pppoe = $row[3];
            
            // Handle Excel date (might be formatted or raw)
            $tanggal_register = null;
            if (!empty($row[4])) {
                if (is_numeric($row[4])) {
                    $tanggal_register = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($row[4])->format('Y-m-d');
                } else {
                    $tanggal_register = date('Y-m-d', strtotime($row[4]));
                }
            }

            // Find or create area
            $areaName = trim($row[5]);
            $areaId = null;
            if (!empty($areaName)) {
                $area = \Illuminate\Support\Facades\DB::table('area')->where('nama_area', $areaName)->first();
                if ($area) {
                    $areaId = $area->id_area;
                } else {
                    $areaId = \Illuminate\Support\Facades\DB::table('area')->insertGetId(['nama_area' => $areaName, 'tenant_id' => 1]);
                }
            }

            // Find or create paket
            $paketName = trim($row[6]);
            $paketTarif = empty($row[7]) ? 0 : intval(preg_replace('/[^0-9]/', '', $row[7]));
            $paketId = null;
            if (!empty($paketName)) {
                $paket = \Illuminate\Support\Facades\DB::table('paket')->where('paket_nama', $paketName)->first();
                if ($paket) {
                    $paketId = $paket->id_paket;
                } else {
                    $paketId = \Illuminate\Support\Facades\DB::table('paket')->insertGetId([
                        'paket_nama' => $paketName,
                        'paket_tarif' => $paketTarif,
                        'tenant_id' => 1
                    ]);
                }
            }

            $modem = trim($row[8]);

            // Find or create mikrotik
            $mikrotikName = trim($row[9]);
            $mikrotikId = null;
            if (!empty($mikrotikName)) {
                $mikrotik = \Illuminate\Support\Facades\DB::table('mikrotik_devices')->where('nama', $mikrotikName)->first();
                if ($mikrotik) {
                    $mikrotikId = $mikrotik->id;
                } else {
                    $mikrotikId = \Illuminate\Support\Facades\DB::table('mikrotik_devices')->insertGetId([
                        'nama' => $mikrotikName,
                        'ip' => '127.0.0.1', // Placeholder IP since we don't have it
                        'port' => 8728,
                        'username' => 'admin',
                        'password' => '',
                        'tenant_id' => 1
                    ]);
                }
            }

            \Illuminate\Support\Facades\DB::table('pelanggan')->insert([
                'nama' => $nama,
                'alamat' => $alamat,
                'telepon' => $telepon,
                'pppoe' => $pppoe,
                'tanggal_register' => $tanggal_register,
                'id_area' => $areaId,
                'id_paket' => $paketId,
                'modem' => $modem,
                'id_mikrotik' => $mikrotikId,
                'status' => 'aktif',
                'tenant_id' => 1
            ]);

            $count++;
        }

        $this->info("Successfully imported $count pelanggan.");
    }
}
