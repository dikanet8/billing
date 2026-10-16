# Sistem Informasi Penagihan (Billing System)

Sistem Informasi Penagihan berbasis web yang dibangun menggunakan **Laravel**, **React.js**, dan **Inertia.js**. Aplikasi ini dirancang untuk mempermudah proses manajemen penagihan (billing), pengelolaan data pelanggan, serta pemantauan performa penagih (debt collector) secara realtime.

## 🚀 Fitur Utama

- **Dashboard Penagih**: Menampilkan ringkasan tugas dan status penagihan untuk masing-masing penagih.
- **Manajemen Pelanggan**: Mendata dan mengelola informasi pelanggan (termasuk fitur *import* dari Excel).
- **Manajemen Tagihan**: Pembuatan, pelacakan, dan pembaruan status tagihan secara berkala.
- **Laporan & Analitik**: Laporan komprehensif mengenai status tagihan dan pembayaran.
- **Performa Penagih**: Pelacakan dan evaluasi kinerja *debt collector* berdasarkan persentase keberhasilan penagihan.
- **Pemetaan Lokasi**: Integrasi Peta (menggunakan Leaflet) untuk memantau lokasi penagihan atau pelanggan.

## 🛠️ Teknologi yang Digunakan

Aplikasi ini dibangun di atas arsitektur *modern web development* dengan tumpukan teknologi berikut:

- **Backend**: [Laravel 11.x](https://laravel.com) (PHP 8.3)
- **Frontend**: [React 19](https://react.dev) dengan [TypeScript](https://www.typescriptlang.org/)
- **State/Routing**: [Inertia.js v3](https://inertiajs.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & Lucide Icons
- **Bundler**: [Vite](https://vitejs.dev/)
- **Maps**: [Leaflet](https://leafletjs.com/)

## 📦 Kebutuhan Sistem

Pastikan lingkungan server Anda telah memenuhi persyaratan berikut sebelum melakukan instalasi:
- PHP >= 8.3
- Composer
- Node.js >= 20 & NPM / pnpm
- Database (MySQL / PostgreSQL / SQLite)

## ⚙️ Cara Instalasi (Development)

1. **Clone repositori ini** (Pastikan URL repositori sudah benar dan dapat diakses):
   ```bash
   git clone https://github.com/TRPL-JBI/TA2026-362155401070-Aidika-Akbar-Assufa.git
   cd TA2026-362155401070-Aidika-Akbar-Assufa
   ```

2. **Install dependensi PHP dan Node.js**:
   ```bash
   composer install
   npm install
   ```

3. **Konfigurasi Environment**:
   Salin file `.env.example` menjadi `.env` dan atur koneksi database Anda.
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Jalankan Migrasi Database**:
   ```bash
   php artisan migrate
   ```

5. **Jalankan Server Development**:
   Untuk menjalankan backend dan frontend (Vite) secara bersamaan:
   ```bash
   npm run dev
   ```
   *Aplikasi dapat diakses melalui `http://localhost:8000`*

## 🧑‍💻 Struktur Direktori Utama

- `app/` - Berisi logika backend (Controller, Model, Middleware).
- `routes/` - Pengaturan rute aplikasi (web.php, api.php).
- `resources/js/` - Semua kode Frontend (React + Inertia):
  - `pages/` - Halaman utama seperti Tagihan, Pelanggan, Dashboard Penagih, Laporan, dll.
  - `components/` - Komponen antarmuka yang dapat digunakan kembali (UI components).
  - `layouts/` - Struktur layout aplikasi (Sidebar, Bottom Nav, dll).

## 📄 Lisensi

Proyek ini bersifat *Open Source* dan berlisensi di bawah [MIT License](https://opensource.org/licenses/MIT).
