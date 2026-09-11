# Frontend Safety Always Watch

Frontend ini adalah paket demonstrasi Safety Always Watch (SAW). Paket ini dapat dijalankan sendiri untuk meninjau alur operasional dan batas antarmuka sebelum backend SAW tersedia.

## Batas demonstrasi

Seluruh hal berikut adalah simulasi yang deterministik dan tidak terhubung ke sistem eksternal:

- Sumber Kamera dan frame Live Monitoring; tidak ada RTSP, URL kamera, atau video nyata.
- Episode Pelanggaran, Peristiwa Pelanggaran, dan data Karyawan; tidak ada snapshot Pelanggaran maupun data orang nyata.
- Autentikasi; pemilihan peran pada layar masuk adalah persona demo, bukan akun atau kredensial.
- Notifikasi Telegram; tidak ada bot, token, Chat ID mentah, atau pesan yang dikirim.
- Data disimpan secara lokal oleh browser untuk demo dan dapat dikembalikan ke seed awal.

## Prasyarat dan instalasi

Gunakan Node.js `^20.19.0` atau `>=22.12.0` dan npm yang menyertai versi Node tersebut. Dari direktori ini:

```bash
npm ci
```

`npm ci` memakai lockfile dan merupakan cara yang dianjurkan untuk checkout bersih.

## Menjalankan aplikasi

Untuk pengembangan:

```bash
npm run dev
```

Buka URL yang ditampilkan Vite, biasanya `http://localhost:5173`.

Untuk meninjau hasil production build:

```bash
npm run smoke
```

Perintah tersebut membangun `dist/` lalu menjalankan preview pada `http://127.0.0.1:4173`. Biarkan proses ini berjalan selama browser smoke journey di bawah dilakukan; hentikan setelahnya dengan `Ctrl+C`.

Pemeriksaan non-interaktif dapat dijalankan dengan:

```bash
npm run verify
```

Perintah tersebut menjalankan typecheck, lint, seluruh test, dan production build.

## Persona demo

Layar masuk tidak memerlukan akun atau kata sandi. Pilih satu persona lalu tekan **Masuk ke SAW**.

- **Admin/Safety Officer** — mendarat di Overview; mengelola Zona Berbahaya, Kelas APD Kanonis, parameter, Reset Skor, dan konfigurasi simulasi.
- **Supervisor Area** — mendarat di Live Monitoring dengan cakupan area Produksi; memantau dan menjalankan Simulator Episode Pelanggaran.
- **HRD** — mendarat di Laporan Kepatuhan APD; meninjau tren dan memfilter laporan tanpa akses Live Monitoring.

Gunakan tombol keluar di header untuk kembali ke pemilih persona.

## Simulator dan Reset data demo

Pada Live Monitoring, **Simulator Episode Pelanggaran** menyediakan skenario operasi normal, APD hilang, identitas gagal, kamera terputus, dan skor melewati Ambang Eskalasi. Kontrol ini hanya mengubah data demo dan tidak mengirim alarm.

**Reset data demo** pada Overview mengembalikan semua perubahan lokal—termasuk konfigurasi Zona Berbahaya, hasil simulator, dan Reset Skor—ke seed awal. Tindakan ini terbatas pada penyimpanan browser saat ini.

## Kontrak layanan dan jalan menuju backend

Komponen frontend bergantung pada antarmuka `SawService` di `src/services/saw-service.ts`. `createMockSawService()` adalah implementasi demo yang dipakai secara default dan menyediakan data serta transisi deterministik untuk seluruh layar.

Ketika kontrak backend tersedia, buat `ApiSawService` yang mengimplementasikan `SawService`, terjemahkan respons API ke tipe domain frontend, lalu injeksikan implementasi tersebut ke `App` sebagai prop `service`. Pertahankan `MockSawService` untuk demo dan test. Tidak ada endpoint backend SAW yang tersedia atau diasumsikan oleh paket ini saat ini.

## Browser smoke journey untuk production build

Mulai dengan `npm run smoke`, lalu buka `http://127.0.0.1:4173` dalam browser baru agar penyimpanan demo bersih. Periksa langkah berikut dalam satu sesi:

1. Masuk sebagai **Admin/Safety Officer** dan pastikan Overview terbuka. Keluar, lalu masuk sebagai **Supervisor Area** dan pastikan Live Monitoring terbuka. Keluar, lalu masuk sebagai **HRD** dan pastikan Laporan Kepatuhan APD terbuka.
2. Masuk kembali sebagai Supervisor Area. Pada Simulator Episode Pelanggaran, pilih **Skenario APD hilang**, lalu **Proses kondisi melanggar**. Pastikan status berubah dari **Dalam Verifikasi** menjadi **Pelanggaran** dan satu Peristiwa Pelanggaran ditampilkan. Ini adalah data demo, bukan bukti atau snapshot.
3. Keluar lalu masuk sebagai Admin/Safety Officer. Buka **Zona Berbahaya**, pilih **Tambah Zona Berbahaya**, isi nama, pilih minimal satu Kelas APD Kanonis dan Supervisor Area, lalu simpan. Pastikan konfirmasi penyimpanan tampil.
4. Buka **Reset Skor**, pilih Karyawan dan alasan reset, lalu selesaikan tahap tinjau dan konfirmasi. Pastikan pesan keberhasilan serta artefak audit Reset Skor tampil.
5. Keluar lalu masuk sebagai HRD. Buka **Laporan Kepatuhan APD**, terapkan filter Zona Berbahaya, departemen, Karyawan, serta tanggal; pastikan ringkasan dan grafik berubah bersama-sama. Bersihkan filter dan pastikan data demo kembali terlihat.
6. Masuk sebagai Admin/Safety Officer dan jalankan **Reset data demo** untuk mengembalikan seed awal.

Journey ini sengaja tidak mencantumkan kredensial, alamat kamera, token, snapshot Pelanggaran, ataupun data orang nyata.
