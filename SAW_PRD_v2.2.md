**SAW (Safety Always Watch!) — Sistem Pemantauan Zona Berbahaya & Kepatuhan APD**

|                          |                                                                                                                           |
|--------------------------|---------------------------------------------------------------------------------------------------------------------------|
| **Field**                | **Nilai**                                                                                                                 |
| Status                   | Draft untuk Review                                                                                                        |
| Versi Dokumen            | 2.2.0-draft                                                                                                               |
| Tanggal Penyusunan       | 5 September 2026 (revisi 7 September 2026)                                                                                |
| Disusun untuk            | Tim Produk & Engineering NETFace                                                                                          |
| Basis Kode Acuan         | NETFace.Attendance (.NET 8, Clean Architecture — Api / Application / Domain / Infrastructure)                             |
| Perubahan pada versi ini | Rebranding proyek dari NETGuard menjadi SAW (Safety Always Watch!); menambahkan Bab 23 — Panduan Pengembangan .NET (Development Guidelines) sebagai SOP & standar teknis wajib tim engineering |

# Daftar Isi

[Daftar Isi [1](#daftar-isi)](#daftar-isi)

[1. Latar Belakang [1](#latar-belakang)](#latar-belakang)

[1.1 Kondisi Eksisting (V1 — NETFace Attendance) [1](#kondisi-eksisting-v1-netface-attendance)](#kondisi-eksisting-v1-netface-attendance)

[1.2 Latar Belakang Perubahan [1](#latar-belakang-perubahan)](#latar-belakang-perubahan)

[1.3 Pernyataan Masalah [1](#pernyataan-masalah)](#pernyataan-masalah)

[1.4 Visi Produk V2 [1](#visi-produk-v2)](#visi-produk-v2)

[2. Tujuan Produk [1](#tujuan-produk)](#tujuan-produk)

[2.1 Tujuan Bisnis [1](#tujuan-bisnis)](#tujuan-bisnis)

[2.2 Tujuan Produk (Objectives) [1](#tujuan-produk-objectives)](#tujuan-produk-objectives)

[3. Glosarium [1](#glosarium)](#glosarium)

[4. Ruang Lingkup [1](#ruang-lingkup)](#ruang-lingkup)

[4.1 Dalam Lingkup (In-Scope) V2 [1](#dalam-lingkup-in-scope-v2)](#dalam-lingkup-in-scope-v2)

[4.2 Di Luar Lingkup (Out of Scope / Non-Goals) V2 [1](#di-luar-lingkup-out-of-scope-non-goals-v2)](#di-luar-lingkup-out-of-scope-non-goals-v2)

[4.3 Asumsi [1](#asumsi)](#asumsi)

[5. Peran Pengguna (User Roles) [1](#peran-pengguna-user-roles)](#peran-pengguna-user-roles)

[6. Alur Pengguna Utama (User Flows) [1](#alur-pengguna-utama-user-flows)](#alur-pengguna-utama-user-flows)

[Alur 1 — Admin Membuat Zona Berbahaya [1](#alur-1-admin-membuat-zona-berbahaya)](#alur-1-admin-membuat-zona-berbahaya)

[Alur 2 — Admin Menetapkan APD Wajib per Zona [1](#alur-2-admin-menetapkan-apd-wajib-per-zona)](#alur-2-admin-menetapkan-apd-wajib-per-zona)

[Alur 2b — Admin Mengonfigurasi Kelas APD dari Model YOLO [1](#alur-2b-admin-mengonfigurasi-kelas-apd-dari-model-yolo)](#alur-2b-admin-mengonfigurasi-kelas-apd-dari-model-yolo)

[Alur 3 — Deteksi Real-Time & Penilaian Kepatuhan [1](#alur-3-deteksi-real-time-penilaian-kepatuhan)](#alur-3-deteksi-real-time-penilaian-kepatuhan)

[Alur 4 — Pencatatan Pelanggaran & Pengurangan Skor (Direvisi — v2.1) [1](#alur-4-pencatatan-pelanggaran-pengurangan-skor-direvisi-v2.1)](#alur-4-pencatatan-pelanggaran-pengurangan-skor-direvisi-v2.1)

[Alur 5 — Notifikasi Eskalasi via Telegram [1](#alur-5-notifikasi-eskalasi-via-telegram)](#alur-5-notifikasi-eskalasi-via-telegram)

[Alur 6 — Dashboard & Pelaporan [1](#alur-6-dashboard-pelaporan)](#alur-6-dashboard-pelaporan)

[Alur 7 — Reset Skor Kredit Keamanan, Terjadwal dan Manual (Baru — v2.1) [1](#alur-7-reset-skor-kredit-keamanan-terjadwal-dan-manual-baru-v2.1)](#alur-7-reset-skor-kredit-keamanan-terjadwal-dan-manual-baru-v2.1)

[7. Kebutuhan Fungsional (Functional Requirements) [1](#kebutuhan-fungsional-functional-requirements)](#kebutuhan-fungsional-functional-requirements)

[7.1 Manajemen Zona Berbahaya [1](#manajemen-zona-berbahaya)](#manajemen-zona-berbahaya)

[7.2 Konfigurasi Kelas APD & Aturan Kepatuhan [1](#konfigurasi-kelas-apd-aturan-kepatuhan)](#konfigurasi-kelas-apd-aturan-kepatuhan)

[7.3 Pipeline Deteksi & Identifikasi Real-Time [1](#pipeline-deteksi-identifikasi-real-time)](#pipeline-deteksi-identifikasi-real-time)

[7.4 Overlay Visual (Bounding Box & Skor) [1](#overlay-visual-bounding-box-skor)](#overlay-visual-bounding-box-skor)

[7.5 Mesin Skor Kredit Keamanan [1](#mesin-skor-kredit-keamanan)](#mesin-skor-kredit-keamanan)

[7.6 Manajemen Pelanggaran & Riwayat [1](#manajemen-pelanggaran-riwayat)](#manajemen-pelanggaran-riwayat)

[7.7 Notifikasi Telegram [1](#notifikasi-telegram)](#notifikasi-telegram)

[7.8 Dashboard & Pelaporan [1](#dashboard-pelaporan)](#dashboard-pelaporan)

[7.9 Manajemen Pengguna & Karyawan (Reuse dari V1) [1](#manajemen-pengguna-karyawan-reuse-dari-v1)](#manajemen-pengguna-karyawan-reuse-dari-v1)

[7.10 Pengaturan Sistem [1](#pengaturan-sistem)](#pengaturan-sistem)

[7.11 Stabilisasi Status Pelanggaran — Confirm/Clear State Machine (Baru — v2.1) [1](#stabilisasi-status-pelanggaran-confirmclear-state-machine-baru-v2.1)](#stabilisasi-status-pelanggaran-confirmclear-state-machine-baru-v2.1)

[7.12 Mesin Reset Skor — Terjadwal & Manual (Baru — v2.1) [1](#mesin-reset-skor-terjadwal-manual-baru-v2.1)](#mesin-reset-skor-terjadwal-manual-baru-v2.1)

[8. Kebutuhan Non-Fungsional [1](#kebutuhan-non-fungsional)](#kebutuhan-non-fungsional)

[9. Arsitektur Sistem Tingkat Tinggi [1](#arsitektur-sistem-tingkat-tinggi)](#arsitektur-sistem-tingkat-tinggi)

[9.1 Perubahan Arsitektural Utama dari V1 [1](#perubahan-arsitektural-utama-dari-v1)](#perubahan-arsitektural-utama-dari-v1)

[9.2 Peta Komponen (Deskriptif) [1](#peta-komponen-deskriptif)](#peta-komponen-deskriptif)

[9.3 Pertimbangan Implementasi [1](#pertimbangan-implementasi)](#pertimbangan-implementasi)

[9.4 Detail Desain — Violation Stabilization Service (Confirm/Clear State Machine) (Baru — v2.1) [1](#detail-desain-violation-stabilization-service-confirmclear-state-machine-baru-v2.1)](#detail-desain-violation-stabilization-service-confirmclear-state-machine-baru-v2.1)

[Kunci Episode [1](#kunci-episode)](#kunci-episode)

[Diagram Status [1](#diagram-status)](#diagram-status)

[Aturan Transisi [1](#aturan-transisi)](#aturan-transisi)

[Kriteria Penerimaan Fitur 1 [1](#kriteria-penerimaan-fitur-1)](#kriteria-penerimaan-fitur-1)

[9.5 Detail Desain — Score Reset Engine (Terjadwal & Manual) (Baru — v2.1) [1](#detail-desain-score-reset-engine-terjadwal-manual-baru-v2.1)](#detail-desain-score-reset-engine-terjadwal-manual-baru-v2.1)

[Reset Terjadwal [1](#reset-terjadwal)](#reset-terjadwal)

[Reset Manual [1](#reset-manual)](#reset-manual)

[Sebelum Eksekusi Reset (Scheduled maupun Manual) [1](#sebelum-eksekusi-reset-scheduled-maupun-manual)](#sebelum-eksekusi-reset-scheduled-maupun-manual)

[10. Model Data (Entitas Baru & Perubahan) [1](#model-data-entitas-baru-perubahan)](#model-data-entitas-baru-perubahan)

[10.1 DangerZone (Baru) [1](#dangerzone-baru)](#dangerzone-baru)

[10.2 PpeClassDefinition (Baru) [1](#ppeclassdefinition-baru)](#ppeclassdefinition-baru)

[10.3 ZoneRequiredPpe (Baru — relasi banyak-ke-banyak) [1](#zonerequiredppe-baru-relasi-banyak-ke-banyak)](#zonerequiredppe-baru-relasi-banyak-ke-banyak)

[10.4 Employee (Perluasan dari V1) [1](#employee-perluasan-dari-v1)](#employee-perluasan-dari-v1)

[10.5 ViolationEvent (Baru) [1](#violationevent-baru)](#violationevent-baru)

[10.6 SafetyScoreLedger (Baru — riwayat/audit skor) [1](#safetyscoreledger-baru-riwayataudit-skor)](#safetyscoreledger-baru-riwayataudit-skor)

[10.7 NotificationRecipient (Baru) [1](#notificationrecipient-baru)](#notificationrecipient-baru)

[10.8 NotificationLog (Baru) [1](#notificationlog-baru)](#notificationlog-baru)

[10.9 ViolationCandidateState (Baru — v2.1) [1](#violationcandidatestate-baru-v2.1)](#violationcandidatestate-baru-v2.1)

[10.10 SafetyScorePeriodSummary (Baru — v2.1) [1](#safetyscoreperiodsummary-baru-v2.1)](#safetyscoreperiodsummary-baru-v2.1)

[10.11 ScoreResetLog (Baru — v2.1) [1](#scoreresetlog-baru-v2.1)](#scoreresetlog-baru-v2.1)

[11. Ringkasan Perubahan API [1](#ringkasan-perubahan-api)](#ringkasan-perubahan-api)

[12. Model Machine Learning [1](#model-machine-learning)](#model-machine-learning)

[12.1 Dataset Sumber untuk Model YOLO APD dari Roboflow Universe (Baru — v2.1) [1](#dataset-sumber-untuk-model-yolo-apd-dari-roboflow-universe-baru-v2.1)](#dataset-sumber-untuk-model-yolo-apd-dari-roboflow-universe-baru-v2.1)

[13. Aturan Bisnis — Skor Kredit Keamanan (Ilustratif) [1](#aturan-bisnis-skor-kredit-keamanan-ilustratif)](#aturan-bisnis-skor-kredit-keamanan-ilustratif)

[13.2 Parameter Reset Skor (Baru — v2.1) [1](#parameter-reset-skor-baru-v2.1)](#parameter-reset-skor-baru-v2.1)

[14. Integrasi Notifikasi Telegram [1](#integrasi-notifikasi-telegram)](#integrasi-notifikasi-telegram)

[15. Deskripsi Antarmuka Pengguna (Konseptual) [1](#deskripsi-antarmuka-pengguna-konseptual)](#deskripsi-antarmuka-pengguna-konseptual)

[16. Migrasi dari V1 ke V2 [1](#migrasi-dari-v1-ke-v2)](#migrasi-dari-v1-ke-v2)

[17. Risiko & Mitigasi [1](#risiko-mitigasi)](#risiko-mitigasi)

[18. Metrik Keberhasilan (Ilustratif — Perlu Validasi Stakeholder) [1](#metrik-keberhasilan-ilustratif-perlu-validasi-stakeholder)](#metrik-keberhasilan-ilustratif-perlu-validasi-stakeholder)

[19. Roadmap Implementasi (Usulan Fase) [1](#roadmap-implementasi-usulan-fase)](#roadmap-implementasi-usulan-fase)

[20. Kriteria Penerimaan (Acceptance Criteria) — Ringkasan Fitur Inti [1](#kriteria-penerimaan-acceptance-criteria-ringkasan-fitur-inti)](#kriteria-penerimaan-acceptance-criteria-ringkasan-fitur-inti)

[21. Pertanyaan Terbuka untuk Stakeholder [1](#pertanyaan-terbuka-untuk-stakeholder)](#pertanyaan-terbuka-untuk-stakeholder)

[22. Lampiran — Ringkasan Stack Teknis yang Direuse dari V1 [1](#daftar-final-kelas-apd-pemetaan-indeks-model-q56)](#daftar-final-kelas-apd-pemetaan-indeks-model-q56)

[23. Panduan Pengembangan .NET (Development Guidelines) [1](#panduan-pengembangan-net-development-guidelines)](#panduan-pengembangan-net-development-guidelines)

[24. Riwayat Revisi Dokumen [1](#riwayat-revisi-dokumen)](#riwayat-revisi-dokumen)

# 1. Latar Belakang

## 1.1 Kondisi Eksisting (V1 — NETFace Attendance)

NETFace Attendance adalah sistem absensi berbasis pengenalan wajah yang dibangun dengan arsitektur .NET 8 Clean Architecture (lapisan Api, Application, Domain, Infrastructure), basis data PostgreSQL (EF Core), dan dua model ONNX untuk pipeline wajah:

- YuNet (yunet.onnx) — deteksi wajah pada gambar yang dikirim perangkat/terminal.

- SFace (sface.onnx) — ekstraksi embedding wajah dan pencocokan (matching) terhadap wajah karyawan yang terdaftar (maksimum 5 embedding per karyawan).

Karakteristik teknis penting dari V1 yang relevan sebagai fondasi V2:

- Alur kerja bersifat transaksional per-gambar: perangkat mengirim satu foto ke endpoint POST /api/recognition/attempt, sistem mendeteksi satu wajah, mencocokkan ke satu karyawan, lalu mencatat kehadiran (clock-in/clock-out) pada AttendanceSession yang aktif.

- Autentikasi ganda: JWT untuk pengguna admin (dashboard), dan API Key/Device Token untuk perangkat/terminal absensi (skema Combined yang otomatis memilih berdasarkan header).

- Ada mekanisme deteksi kecurigaan spoofing sederhana (ISpoofingDetectionService) berbasis penghitung kegagalan pengenalan berturut-turut per perangkat, dengan fallback ke mode PIN.

- Ada audit trail: RecognitionLog (tiap upaya pengenalan) dan EnrollmentLog (tiap pendaftaran/penghapusan wajah).

- Pengaturan sistem bersifat key-value melalui entitas SystemSetting (mis. ClockOutStartTime, FaceMatching:MatchThreshold).

- Tidak ada komponen deteksi objek (YOLO), tidak ada konsep zona/area, tidak ada sistem skor, dan tidak ada integrasi Telegram di V1.

## 1.2 Latar Belakang Perubahan

Kebutuhan bisnis bergeser: kamera yang semula dipakai untuk memindai wajah saat check-in/check-out akan dialihfungsikan menjadi kamera pengawas Keselamatan dan Kesehatan Kerja (K3) yang berjalan terus-menerus (continuous monitoring) di area-area berisiko tinggi (mis. area produksi, gudang bahan kimia, area konstruksi, ruang mesin/panel listrik). Fokus produk berubah dari “siapa yang hadir dan kapan” menjadi “siapa yang berada di area berbahaya, dan apakah mereka mematuhi ketentuan Alat Pelindung Diri (APD) di area tersebut”.

## 1.3 Pernyataan Masalah

1.  Tidak ada mekanisme otomatis untuk mendeteksi ketika seseorang memasuki area berbahaya tanpa APD yang dipersyaratkan.

2.  Pelanggaran APD saat ini bergantung pada pengawasan manual oleh supervisor, yang tidak selalu berada di lokasi.

3.  Tidak ada akuntabilitas individu yang terukur dan berkelanjutan atas perilaku kepatuhan K3 pekerja.

4.  Eskalasi ke HRD/atasan saat terjadi pelanggaran berulang bersifat manual dan lambat.

5.  (Baru — v2.1) Deteksi berbasis frame tunggal rentan menghasilkan pelanggaran & pengurangan skor yang berulang/tidak stabil untuk satu momen pelanggaran yang sama, serta rentan terhadap jeda identifikasi wajah yang telat/gagal sementara tracking tetap berjalan.

## 1.4 Visi Produk V2

> *“Setiap orang yang memasuki area berbahaya terpantau secara otomatis, kepatuhan APD-nya dinilai secara real-time dan stabil (bukan sekadar per-frame), dan pelanggaran berulang dieskalasi secara otomatis kepada pihak yang berwenang — tanpa lagi berfungsi sebagai sistem absensi.”*

# 2. Tujuan Produk

## 2.1 Tujuan Bisnis

- Menurunkan jumlah insiden/pelanggaran K3 terkait ketidakpatuhan APD di area berbahaya.

- Memberikan visibilitas real-time kepada Supervisor dan HRD atas kondisi kepatuhan APD di lapangan.

- Membangun akuntabilitas individu melalui skor kredit keamanan yang berkelanjutan per pekerja, dengan mekanisme reset periodik yang transparan dan dapat diaudit.

- Mempercepat eskalasi pelanggaran kritis melalui notifikasi otomatis (Telegram) sehingga tindak lanjut lebih cepat.

- (Baru — v2.1) Menjamin bahwa setiap pelanggaran yang tercatat dan setiap pengurangan skor merepresentasikan kejadian nyata yang stabil, bukan artefak deteksi per-frame yang berkedip (flicker).

## 2.2 Tujuan Produk (Objectives)

- O1: Mendeteksi kehadiran orang di zona berbahaya yang dikustomisasi secara real-time dari umpan kamera.

- O2: Mengidentifikasi APD yang dikenakan (atau tidak dikenakan) menggunakan model deteksi objek (YOLO, format ONNX).

- O3: Menampilkan skor kredit keamanan tiap individu langsung pada bounding box di tampilan pemantauan.

- O4: Menurunkan skor kredit keamanan individu secara otomatis dan tepat satu kali per episode pelanggaran (masuk zona berbahaya tanpa APD wajib), melalui mekanisme stabilisasi Confirm/Clear.

- O5: Mengirim notifikasi otomatis ke HRD dan Supervisor terkait via Telegram saat skor seseorang berada di bawah ambang batas (threshold) yang ditentukan.

- O6 (Baru — v2.1): Menyediakan mekanisme reset skor kredit keamanan yang terjadwal (harian) maupun manual (dengan alasan tercatat), lengkap dengan ringkasan periode dan log audit.

> ***Catatan:** metrik target numerik pada bagian KPI (Bab 18) bersifat ilustratif/placeholder dan perlu divalidasi bersama stakeholder K3/HRD sebelum dijadikan komitmen resmi.*

# 3. Glosarium

|                                                       |                                                                                                                                                                                                                                   |
|-------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Istilah**                                           | **Definisi**                                                                                                                                                                                                                      |
| APD (PPE)                                             | Alat Pelindung Diri — mis. helm, rompi keselamatan, sarung tangan, masker, sepatu safety, kacamata pelindung. Daftar final kelas ditentukan kemudian oleh tim (lihat Bab 4.3 & 12).                                               |
| Zona Berbahaya (Danger Zone)                          | Area persegi panjang yang dikustomisasi pada bidang pandang kamera, ditandai sebagai area yang mewajibkan APD tertentu.                                                                                                           |
| Skor Kredit Keamanan                                  | Nilai numerik per individu yang merepresentasikan rekam jejak kepatuhan K3; berkurang saat terjadi pelanggaran, dan dapat direset kembali ke nilai awal secara terjadwal/manual.                                                  |
| Threshold Skor                                        | Ambang batas skor; bila skor seseorang jatuh di bawah nilai ini, sistem memicu notifikasi eskalasi.                                                                                                                               |
| Bounding Box                                          | Kotak pembatas hasil deteksi objek (orang/APD) yang digambar pada tampilan video, dilengkapi label skor individu.                                                                                                                 |
| Peristiwa Pelanggaran (Violation Event)               | Catatan setiap kali sebuah episode pelanggaran dinyatakan Confirmed — seseorang terdeteksi secara stabil berada dalam zona berbahaya tanpa mengenakan APD wajib untuk zona tersebut.                                              |
| Episode Pelanggaran                                   | (Baru — v2.1) Rentang waktu satu kejadian pelanggaran yang dilacak sebagai satu kesatuan, diidentifikasi oleh kombinasi TrackId + DangerZoneId + MissingPpeClassId, sejak pertama terdeteksi hingga dinyatakan selesai (Cleared). |
| Status Episode (Candidate/Confirmed/Clearing/Cleared) | (Baru — v2.1) Tahapan siklus hidup sebuah episode pelanggaran pada mesin stabilisasi. Lihat Bab 9.4 untuk definisi lengkap.                                                                                                       |
| Confirm Threshold / Clear Threshold                   | (Baru — v2.1) Parameter durasi (detik) yang menentukan kapan sebuah kandidat pelanggaran dianggap valid (Confirmed) dan kapan sebuah episode yang sudah kembali patuh dianggap selesai (Cleared).                                 |
| Periode Skor / Reset Skor                             | (Baru — v2.1) Rentang waktu antara dua reset skor kredit keamanan. Reset mengembalikan skor ke nilai awal dan mengarsipkan ringkasan periode sebelumnya.                                                                          |
| Model YOLO (.onnx)                                    | Model deteksi objek yang dipakai untuk mendeteksi kelas-kelas APD pada frame video.                                                                                                                                               |
| Re-identifikasi (Re-ID)                               | Proses mengaitkan sebuah bounding box orang pada frame video dengan identitas karyawan terdaftar (memanfaatkan pipeline wajah YuNet + SFace dari V1).                                                                             |
| Edge/Inference Worker                                 | Komponen yang menjalankan inferensi model (YOLO + wajah) terhadap umpan video secara berkelanjutan.                                                                                                                               |

# 4. Ruang Lingkup

## 4.1 Dalam Lingkup (In-Scope) V2

- Manajemen zona berbahaya berbentuk persegi panjang yang dapat dikustomisasi (dibuat, diedit, dinonaktifkan) per kamera/sumber video.

- Konfigurasi kelas APD wajib per zona (mapping fleksibel, bukan hardcode).

- Pipeline deteksi real-time: deteksi & pelacakan orang, deteksi APD (YOLO ONNX), pengecekan apakah orang berada di dalam zona berbahaya.

- Overlay visual bounding box beserta skor kredit keamanan individu pada tampilan pemantauan langsung.

- Mesin skor kredit keamanan (pengurangan otomatis saat pelanggaran, riwayat perubahan skor).

- (Baru — v2.1) Mesin stabilisasi status pelanggaran (Confirm/Clear state machine) untuk memastikan satu episode pelanggaran hanya menghasilkan tepat satu Violation Event dan satu pengurangan skor.

- (Baru — v2.1) Mesin reset skor kredit keamanan, terjadwal harian dan manual dengan alasan tercatat, beserta ringkasan periode dan log audit reset.

- Pencatatan dan riwayat peristiwa pelanggaran (dengan bukti/snapshot).

- Notifikasi otomatis ke HRD dan Supervisor pengawas via Telegram saat skor di bawah threshold.

- Dashboard pemantauan dan pelaporan kepatuhan.

- Reuse modul identitas karyawan dan pipeline wajah (YuNet + SFace) dari V1 untuk keperluan identifikasi individu.

## 4.2 Di Luar Lingkup (Out of Scope / Non-Goals) V2

- Fungsi pencatatan kehadiran (clock-in/clock-out) tidak lagi menjadi fungsi utama produk. Entitas AttendanceSession/AttendanceEntry tidak dikembangkan lebih lanjut pada V2 (lihat opsi migrasi di Bab 16).

- Penggajian, perhitungan lembur, atau modul HR lain di luar kepatuhan K3.

- Deteksi jenis pelanggaran K3 non-APD (mis. kecepatan kendaraan, kebisingan, gas berbahaya) — dapat menjadi roadmap V3.

- Pelatihan ulang (retraining) model YOLO — V2 mengasumsikan model deteksi APD sudah tersedia (lihat asumsi di bawah).

- Aplikasi mobile native (V2 difokuskan pada dashboard web dan notifikasi Telegram).

- (Baru — v2.1) Pemulihan skor secara bertahap/parsial — reset skor bersifat total ke nilai awal, bukan pemulihan berangsur.

## 4.3 Asumsi

- Model deteksi APD berbasis YOLO dalam format .onnx sudah tersedia (“dataset APD sudah ada banyak”). Daftar kelas (nama & jumlah) belum final dan akan diisi kemudian oleh tim produk — karena itu, sistem wajib memperlakukan daftar kelas APD sebagai data konfigurasi (bukan nilai hardcode di kode).

- Kamera/sumber video V2 bekerja dalam mode streaming/kontinu (mis. RTSP, webcam terhubung ke edge device), berbeda dari V1 yang bersifat satu foto per transaksi.

- Setiap zona berbahaya terhubung ke satu sumber kamera tertentu; satu kamera dapat memiliki lebih dari satu zona.

- Setiap pekerja yang perlu diidentifikasi sudah terdaftar wajahnya melalui modul enrollment yang sudah ada di V1 (EmployeesFacesController), sehingga skor dapat diatribusikan ke individu yang benar.

- Bot Telegram dan grup/nomor chat HRD serta masing-masing Supervisor akan disediakan/dikonfigurasi oleh tim operasional.

- Definisi angka pasti (skor awal, besaran pengurangan per pelanggaran, nilai threshold, ConfirmThresholdSeconds, ClearThresholdSeconds, jadwal reset) merupakan parameter yang dapat dikonfigurasi, dengan nilai contoh sebagai ilustrasi awal, bukan keputusan final.

- (Baru — v2.1, perlu validasi stakeholder) Jika sebuah track hilang sebelum sebuah kandidat pelanggaran sempat Confirmed, episode tersebut dianggap tidak pernah terjadi (digugurkan) dan tidak menghasilkan insiden apa pun. Lihat TODO pada Bab 9.4 dan Bab 21.

# 5. Peran Pengguna (User Roles)

|                      |                                                                                                                |                                                                                                                  |
|----------------------|----------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| **Peran**            | **Deskripsi**                                                                                                  | **Kebutuhan Utama terhadap Sistem**                                                                              |
| Admin/Safety Officer | Mengelola konfigurasi sistem: zona berbahaya, kelas APD wajib, threshold skor, pengguna, parameter reset skor. | CRUD zona & aturan, kontrol penuh atas pengaturan, akses eksklusif ke endpoint reset skor manual.                |
| Supervisor Area      | Bertanggung jawab mengawasi satu/lebih zona atau departemen tertentu.                                          | Dashboard live monitoring, menerima notifikasi Telegram saat anak buahnya melanggar.                             |
| HRD                  | Menerima eskalasi pelanggaran kritis, memantau tren kepatuhan K3 secara agregat.                               | Notifikasi Telegram, laporan/riwayat skor per karyawan, ringkasan periode skor.                                  |
| Pekerja/Karyawan     | Subjek yang dipantau; wajahnya terdaftar di sistem sehingga dapat diidentifikasi.                              | (Tidak langsung berinteraksi dengan sistem; dapat menjadi pengguna pasif laporan skor pribadi di fase lanjutan). |
| Kamera/Edge Device   | Aktor teknis yang mengirim umpan video ke sistem untuk diproses.                                               | Autentikasi perangkat (reuse skema API Key/Device Token V1).                                                     |

# 6. Alur Pengguna Utama (User Flows)

## Alur 1 — Admin Membuat Zona Berbahaya

6.  Admin memilih sumber kamera pada halaman Zone Editor.

7.  Admin menggambar area persegi panjang di atas pratinjau video (drag-select) atau memasukkan koordinat secara manual.

8.  Admin memberi nama zona (mis. “Ruang Panel Listrik Lantai 2”) dan menyimpannya.

9.  Sistem menyimpan definisi zona (koordinat relatif terhadap frame, agar tetap valid pada berbagai resolusi video).

## Alur 2 — Admin Menetapkan APD Wajib per Zona

10. Admin membuka detail zona yang sudah dibuat.

11. Admin memilih satu atau lebih kelas APD wajib dari daftar kelas yang telah dikonfigurasi (lihat Alur 2b).

12. Sistem menyimpan aturan kepatuhan: “Zona X mewajibkan [Helm, Rompi Keselamatan]”.

## Alur 2b — Admin Mengonfigurasi Kelas APD dari Model YOLO

13. Admin mengunggah/menunjuk model .onnx yang akan dipakai.

14. Admin memetakan tiap indeks kelas keluaran model ke nama APD yang dipahami manusia, menandai kategori (APD dipakai vs. indikator pelanggaran) dan status wajib/opsional default.

15. Pemetaan ini menjadi rujukan yang dipakai seluruh zona.

## Alur 3 — Deteksi Real-Time & Penilaian Kepatuhan

16. Edge/Inference Worker menerima frame dari kamera secara berkelanjutan.

17. Sistem mendeteksi dan melacak (tracking) setiap orang dalam frame.

18. Untuk tiap orang terlacak, sistem menjalankan deteksi APD (YOLO) pada area sekitar orang tersebut.

19. Sistem mencocokkan wajah (reuse YuNet + SFace) untuk mengaitkan track dengan identitas karyawan terdaftar (atau menandai sebagai “Tidak Dikenali” bila tidak berhasil).

20. Sistem memeriksa apakah bounding box orang tersebut berpotongan/berada di dalam salah satu zona berbahaya.

21. Jika ya, sistem membandingkan APD yang terdeteksi terhadap APD wajib zona tersebut.

22. Tampilan live monitoring menggambar bounding box dengan label nama (jika dikenali) dan skor kredit keamanan individu saat ini.

## Alur 4 — Pencatatan Pelanggaran & Pengurangan Skor (Direvisi — v2.1)

23. Bila kondisi non-compliant terpenuhi (di dalam zona berbahaya + APD wajib tidak lengkap) untuk suatu kombinasi TrackId + DangerZoneId + MissingPpeClassId, sistem membuat/melanjutkan state kandidat pelanggaran pada mesin stabilisasi (lihat Bab 9.4), bukan langsung membuat Violation Event.

24. Selama durasi non-compliant berlangsung terus-menerus, sistem menahan pembuatan insiden hingga durasi mencapai ConfirmThresholdSeconds; barulah episode dinyatakan Confirmed.

25. Tepat pada saat Confirmed, sistem membuat satu Violation Event (snapshot dari frame terbaru), menjalankan Identity Resolver, dan mengurangi skor kredit keamanan individu sekali untuk episode tersebut.

26. Perubahan skor dicatat pada riwayat skor (ledger) untuk keperluan audit.

27. Episode tetap Confirmed selama kondisi kembali melanggar sebelum ClearThresholdSeconds terlampaui pasca kondisi sempat patuh; episode baru menutup (Cleared) tanpa insiden baru ketika kepatuhan bertahan hingga ClearThresholdSeconds.

## Alur 5 — Notifikasi Eskalasi via Telegram

28. Setiap kali skor individu diperbarui, sistem memeriksa apakah skor terbaru berada di bawah threshold yang dikonfigurasi.

29. Jika ya, sistem menyusun pesan notifikasi (nama, zona, APD yang dilanggar, waktu, skor terkini, opsional snapshot).

30. Sistem mengirim pesan tersebut ke HRD dan ke Supervisor yang mengawasi zona/departemen terkait melalui Telegram Bot API.

31. Status pengiriman dicatat pada log notifikasi.

## Alur 6 — Dashboard & Pelaporan

32. Admin/HRD/Supervisor membuka dashboard untuk melihat status kepatuhan agregat, daftar skor tiap pekerja, dan riwayat pelanggaran.

33. Pengguna dapat memfilter berdasarkan zona, departemen, individu, atau rentang tanggal.

34. Pengguna dapat membuka detail sebuah pelanggaran untuk melihat snapshot bukti.

## Alur 7 — Reset Skor Kredit Keamanan, Terjadwal dan Manual (Baru — v2.1)

35. Setiap hari pada jam SafetyScore:ResetTimeOfDay, background job berjalan otomatis untuk seluruh karyawan.

36. (Opsional, perlu konfirmasi) SafetyScore:RecapLeadMinutes menit sebelum eksekusi, sistem dapat mengirim rekap kepada HRD/Supervisor berisi ringkasan pelanggaran hari itu sebelum skor direset — cakupan pasti isi & penerima rekap ini perlu dikonfirmasi bersama stakeholder (lihat Bab 21).

37. Sebelum eksekusi reset (baik terjadwal maupun manual), sistem mengarsipkan SafetyScorePeriodSummary per karyawan (skor akhir sebelum reset, total pelanggaran, breakdown per kelas APD).

38. Sistem mengeksekusi reset: skor karyawan kembali penuh ke SafetyScore:InitialValue (reset total, bukan pemulihan bertahap), dan mencatat ScoreResetLog yang tertaut ke ringkasan periode terkait.

39. Untuk reset manual, Admin memanggil endpoint POST /api/employees/{id}/safety-score/reset dengan alasan (ResetReason) wajib diisi; permintaan tanpa alasan ditolak (400).

# 7. Kebutuhan Fungsional (Functional Requirements)

Prioritas: M = Must have, S = Should have, C = Could have.

## 7.1 Manajemen Zona Berbahaya

|        |                                                                                                                                                                                         |               |
|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| **ID** | **Kebutuhan**                                                                                                                                                                           | **Prioritas** |
| FR-01  | Sistem harus memungkinkan Admin membuat zona berbentuk persegi panjang di atas pratinjau video sebuah kamera, dengan koordinat yang dapat dikustomisasi (digambar atau diinput manual). | M             |
| FR-02  | Sistem harus memungkinkan Admin mengedit, menonaktifkan, dan menghapus zona berbahaya yang sudah ada.                                                                                   | M             |
| FR-03  | Sistem harus menyimpan koordinat zona secara relatif/ternormalisasi terhadap dimensi frame agar tetap akurat pada resolusi video berbeda.                                               | M             |
| FR-04  | Satu kamera harus dapat memiliki lebih dari satu zona berbahaya sekaligus.                                                                                                              | S             |
| FR-05  | Setiap zona dapat dikaitkan dengan satu atau lebih Supervisor penanggung jawab.                                                                                                         | M             |

## 7.2 Konfigurasi Kelas APD & Aturan Kepatuhan

|        |                                                                                                                                                                            |               |
|--------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| **ID** | **Kebutuhan**                                                                                                                                                              | **Prioritas** |
| FR-06  | Sistem harus menyediakan mekanisme untuk memetakan indeks kelas keluaran model YOLO ke nama APD yang dipahami manusia, disimpan sebagai data konfigurasi (bukan hardcode). | M             |
| FR-07  | Admin harus dapat menandai tiap kelas APD sebagai “indikator kepatuhan” atau “indikator pelanggaran”, sesuai desain dataset yang dipakai.                                  | M             |
| FR-08  | Admin harus dapat menetapkan satu atau lebih kelas APD sebagai wajib untuk suatu zona berbahaya tertentu.                                                                  | M             |
| FR-09  | Sistem harus mendukung beberapa zona dengan aturan APD wajib yang berbeda satu sama lain.                                                                                  | M             |

## 7.3 Pipeline Deteksi & Identifikasi Real-Time

|        |                                                                                                                                                                                                                         |               |
|--------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| **ID** | **Kebutuhan**                                                                                                                                                                                                           | **Prioritas** |
| FR-10  | Sistem harus memproses umpan video secara berkelanjutan (bukan hanya satu gambar per transaksi seperti pada V1).                                                                                                        | M             |
| FR-11  | Sistem harus mendeteksi dan melacak (tracking) setiap individu yang muncul dalam frame agar identitas track (TrackId) tetap konsisten antar-frame — TrackId ini menjadi bagian kunci episode pelanggaran (lihat FR-39). | M             |
| FR-12  | Sistem harus menjalankan model YOLO (.onnx) untuk mendeteksi kelas-kelas APD pada tiap individu terlacak.                                                                                                               | M             |
| FR-13  | Sistem harus memanfaatkan kembali pipeline wajah V1 (YuNet untuk deteksi wajah, SFace untuk pencocokan) guna mengaitkan sebuah track dengan identitas karyawan terdaftar.                                               | M             |
| FR-14  | Jika wajah tidak dapat dikenali/dicocokkan, sistem tetap mencatat kejadian sebagai “Tidak Dikenali” beserta snapshot, agar tidak ada celah pengawasan yang hilang begitu saja.                                          | S             |
| FR-15  | Sistem harus menentukan apakah bounding box seseorang berada di dalam salah satu zona berbahaya yang terdefinisi.                                                                                                       | M             |

## 7.4 Overlay Visual (Bounding Box & Skor)

|        |                                                                                                                  |               |
|--------|------------------------------------------------------------------------------------------------------------------|---------------|
| **ID** | **Kebutuhan**                                                                                                    | **Prioritas** |
| FR-16  | Tampilan live monitoring harus menggambar bounding box pada setiap individu terdeteksi.                          | M             |
| FR-17  | Tiap bounding box harus menampilkan label skor kredit keamanan individu saat ini.                                | M             |
| FR-18  | Bounding box individu yang sedang melanggar harus ditandai secara visual berbeda dibanding individu yang patuh.  | S             |
| FR-19  | Area zona berbahaya harus digambarkan secara visual (garis batas persegi panjang) pada tampilan live monitoring. | M             |

## 7.5 Mesin Skor Kredit Keamanan

|        |                                                                                                                                                                                                                                                            |               |
|--------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| **ID** | **Kebutuhan**                                                                                                                                                                                                                                              | **Prioritas** |
| FR-20  | Setiap individu terdaftar harus memiliki skor kredit keamanan dengan nilai awal yang dapat dikonfigurasi (SafetyScore:InitialValue).                                                                                                                       | M             |
| FR-21  | Sistem harus mengurangi skor individu secara otomatis saat sebuah Violation Event tercatat untuknya.                                                                                                                                                       | M             |
| FR-22  | Besaran pengurangan skor harus dapat dikonfigurasi, dan dapat berbeda-beda per kelas APD yang dilanggar (lihat Bab 13).                                                                                                                                    | S             |
| FR-23  | Direvisi (v2.1): sistem harus menerapkan mesin stabilisasi Confirm/Clear (Bab 9.4) agar satu episode pelanggaran yang sama tidak berulang kali mengurangi skor akibat deteksi per-frame. Ini menggantikan pendekatan “cooldown sederhana” pada draft v2.0. | M             |
| FR-24  | Seluruh perubahan skor harus tercatat pada riwayat (ledger) yang dapat diaudit, mencantumkan sebab, waktu, dan nilai sebelum/sesudah.                                                                                                                      | M             |

## 7.6 Manajemen Pelanggaran & Riwayat

|        |                                                                                                                                                                                           |               |
|--------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| **ID** | **Kebutuhan**                                                                                                                                                                             | **Prioritas** |
| FR-25  | Sistem harus menyimpan setiap Violation Event beserta zona, waktu, individu (atau status “Tidak Dikenali”), dan kelas APD yang tidak terpenuhi.                                           | M             |
| FR-26  | Sistem harus menyimpan snapshot gambar sebagai bukti pada setiap Violation Event, diambil dari frame terbaru saat episode dinyatakan Confirmed (bukan frame pertama kandidat terdeteksi). | S             |
| FR-27  | Pengguna berwenang harus dapat melihat riwayat pelanggaran dengan filter zona, individu, departemen, dan rentang tanggal.                                                                 | M             |

## 7.7 Notifikasi Telegram

|        |                                                                                                                                                                 |               |
|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| **ID** | **Kebutuhan**                                                                                                                                                   | **Prioritas** |
| FR-28  | Sistem harus memeriksa skor individu terhadap threshold yang dikonfigurasi setiap kali skor diperbarui.                                                         | M             |
| FR-29  | Jika skor berada di bawah threshold, sistem harus mengirim notifikasi ke HRD dan ke Supervisor yang mengawasi zona/departemen terkait melalui Telegram Bot API. | M             |
| FR-30  | Pesan notifikasi harus memuat identitas individu, zona, waktu kejadian, APD yang dilanggar, dan skor terkini.                                                   | M             |
| FR-31  | Sistem harus mencatat status keberhasilan/kegagalan pengiriman tiap notifikasi.                                                                                 | S             |
| FR-32  | Admin harus dapat mengonfigurasi/memetakan penerima notifikasi (chat ID Telegram) untuk peran HRD dan untuk tiap Supervisor.                                    | M             |

## 7.8 Dashboard & Pelaporan

|        |                                                                                                                                           |               |
|--------|-------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| **ID** | **Kebutuhan**                                                                                                                             | **Prioritas** |
| FR-33  | Sistem harus menyediakan dashboard yang menampilkan status kepatuhan agregat secara real-time.                                            | M             |
| FR-34  | Sistem harus menyediakan daftar/leaderboard skor kredit keamanan seluruh karyawan, dengan indikator visual kondisi (aman/waspada/kritis). | S             |
| FR-35  | Sistem harus menyediakan laporan tren pelanggaran per zona/departemen/periode.                                                            | C             |

## 7.9 Manajemen Pengguna & Karyawan (Reuse dari V1)

|        |                                                                                                                                                   |               |
|--------|---------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| **ID** | **Kebutuhan**                                                                                                                                     | **Prioritas** |
| FR-36  | Sistem harus tetap mendukung pendaftaran dan pengelolaan data karyawan serta wajah (reuse EmployeesController, EmployeesFacesController dari V1). | M             |
| FR-37  | Data karyawan diperluas untuk mendukung atribut skor kredit keamanan dan penugasan Supervisor/departemen.                                         | M             |

## 7.10 Pengaturan Sistem

|        |                                                                                                                                                                        |               |
|--------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| **ID** | **Kebutuhan**                                                                                                                                                          | **Prioritas** |
| FR-38  | Threshold skor, nilai skor awal, dan besaran pengurangan harus dapat diubah oleh Admin tanpa perlu deploy ulang aplikasi (reuse pola SystemSetting key-value dari V1). | M             |

## 7.11 Stabilisasi Status Pelanggaran — Confirm/Clear State Machine (Baru — v2.1)

|        |                                                                                                                                                                                                                                                                                                                                                                                                             |               |
|--------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| **ID** | **Kebutuhan**                                                                                                                                                                                                                                                                                                                                                                                               | **Prioritas** |
| FR-39  | Sistem harus mengidentifikasi setiap episode pelanggaran dengan kunci komposit (TrackId, DangerZoneId, MissingPpeClassId) — bukan langsung EmployeeId — karena identitas wajah dapat telat/gagal diresolusi sementara tracking tetap berjalan.                                                                                                                                                              | M             |
| FR-40  | Saat kandidat pelanggaran pertama terdeteksi untuk suatu episode, sistem harus membuat state Candidate dan mencatat FirstDetectedAt; setiap frame non-compliant berikutnya memperbarui LastNonCompliantAt.                                                                                                                                                                                                  | M             |
| FR-41  | Ketika (LastNonCompliantAt − FirstDetectedAt) ≥ ConfirmThresholdSeconds, status harus berpindah ke Confirmed dan sistem membuat tepat satu Violation Event, dengan snapshot diambil dari frame terbaru saat threshold terlampaui (bukan frame pertama).                                                                                                                                                     | M             |
| FR-42  | Pada saat transisi ke Confirmed, sistem harus menjalankan Identity Resolver (memanfaatkan cache track bila tersedia) untuk mengisi EmployeeId; kegagalan resolusi dicatat sebagai “Tidak Dikenali” (FR-14).                                                                                                                                                                                                 | M             |
| FR-43  | Pengurangan skor kredit keamanan harus terjadi tepat satu kali pada titik transisi ke Confirmed — tidak per-frame dan tidak per-siklus cooldown.                                                                                                                                                                                                                                                            | M             |
| FR-44  | Ketika kondisi kembali compliant, sistem mencatat LastCompliantAt dan status berpindah ke Clearing; jika (waktu sekarang − LastCompliantAt) ≥ ClearThresholdSeconds maka status berpindah ke Cleared (episode selesai). Jika sebelum ClearThresholdSeconds tercapai kondisi kembali melanggar, LastCompliantAt direset ke null, status kembali ke Confirmed, dan sistem TIDAK membuat Violation Event baru. | M             |
| FR-45  | Frame dengan confidence di bawah Detection:MinConfidenceThreshold harus diabaikan sepenuhnya: tidak dihitung sebagai compliant maupun non-compliant, tidak mereset FirstDetectedAt, dan tidak memajukan LastNonCompliantAt/LastCompliantAt.                                                                                                                                                                 | M             |
| FR-46  | Jika track hilang sebelum episode mencapai Confirmed, state Candidate harus dihapus/digugurkan tanpa membuat insiden apa pun. (Asumsi ini ditandai TODO untuk divalidasi bersama stakeholder — lihat Bab 9.4 & 21.)                                                                                                                                                                                         | S             |
| FR-47  | Seluruh aturan stabilisasi di atas wajib dicakup oleh unit test, termasuk: pelanggaran di bawah ConfirmThreshold tidak pernah menghasilkan Violation Event/pengurangan skor; pelanggaran panjang menghasilkan tepat satu Violation Event hingga episode Cleared; kondisi sempat compliant namun belum mencapai ClearThreshold tidak menutup episode maupun membuat insiden baru.                            | M             |

## 7.12 Mesin Reset Skor — Terjadwal & Manual (Baru — v2.1)

|        |                                                                                                                                                                                                                                                                                                                                                          |               |
|--------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|
| **ID** | **Kebutuhan**                                                                                                                                                                                                                                                                                                                                            | **Prioritas** |
| FR-48  | Sistem harus menjalankan reset skor terjadwal setiap hari pada jam SafetyScore:ResetTimeOfDay untuk seluruh karyawan, mengembalikan skor sepenuhnya ke SafetyScore:InitialValue (reset total, bukan pemulihan bertahap).                                                                                                                                 | M             |
| FR-49  | Sistem harus menyediakan endpoint manual POST /api/employees/{id}/safety-score/reset, dibatasi untuk peran Admin, mewajibkan field ResetReason (beserta Note jika ResetReason = Lainnya), dan menolak permintaan dengan 400 apabila ResetReason kosong.                                                                                                  | M             |
| FR-50  | Sebelum eksekusi reset (terjadwal maupun manual), sistem harus mengarsipkan SafetyScorePeriodSummary per karyawan yang memuat skor akhir sebelum reset, total pelanggaran, dan breakdown pelanggaran per kelas APD pada periode berjalan. (Urutan lengkap langkah pra-eksekusi lain, jika ada, perlu dilengkapi bersama tim engineering — lihat Bab 21.) | M             |
| FR-51  | Setiap eksekusi reset (terjadwal maupun manual) harus menghasilkan satu ScoreResetLog yang tertaut ke SafetyScorePeriodSummary terkait, mencatat TriggerType, ResetBy (null jika Scheduled), ResetReason, dan Note bila relevan.                                                                                                                         | M             |
| FR-52  | Parameter SafetyScore:ResetTimeOfDay, SafetyScore:RecapLeadMinutes, dan SafetyScore:InitialValue harus dapat diubah Admin melalui SystemSetting tanpa deploy ulang.                                                                                                                                                                                      | M             |
| FR-53  | Sistem dapat mengirim rekap kepada HRD/Supervisor SafetyScore:RecapLeadMinutes menit sebelum eksekusi reset terjadwal, agar tim K3 sempat meninjau pelanggaran hari itu; isi dan daftar penerima rekap perlu dikonfirmasi bersama stakeholder.                                                                                                           | S             |

# 8. Kebutuhan Non-Fungsional

|                                                     |                                                                                                                                                                                                                       |
|-----------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Kategori**                                        | **Kebutuhan**                                                                                                                                                                                                         |
| Real-time                                           | Latensi dari frame video diambil hingga bounding box + skor tampil di layar pemantauan harus cukup rendah agar terasa “langsung” bagi pengawas (target diilustrasikan di Bab 18, perlu validasi teknis lebih lanjut). |
| Skalabilitas                                        | Arsitektur harus mampu menambah jumlah kamera/zona tanpa perubahan besar pada desain (horizontal scaling pada Edge/Inference Worker).                                                                                 |
| Keandalan Notifikasi                                | Kegagalan pengiriman Telegram tidak boleh membuat peristiwa pelanggaran hilang; harus ada retry dan/atau log kegagalan yang dapat ditinjau ulang.                                                                     |
| Keamanan Data                                       | Rekaman/snapshot yang memuat wajah karyawan adalah data pribadi; akses ke data ini harus dibatasi peran (role-based) dan mengikuti kebijakan retensi data yang jelas.                                                 |
| Auditability                                        | Setiap perubahan skor, setiap pelanggaran, dan setiap reset skor harus tertelusuri (siapa/apa penyebabnya, kapan, bukti apa).                                                                                         |
| Konfigurabilitas                                    | Kelas APD, aturan zona, parameter skor, threshold stabilisasi (Confirm/Clear), dan parameter reset skor harus dapat diubah tanpa mengubah kode program.                                                               |
| Kompatibilitas Perangkat                            | Reuse skema autentikasi API Key/Device Token V1 untuk perangkat kamera/edge device.                                                                                                                                   |
| Idempotensi & Keandalan Job Terjadwal (Baru — v2.1) | Reset skor terjadwal harus idempoten terhadap kegagalan/restart proses (mis. tidak mereset ganda bila job dijalankan ulang pada hari yang sama) dan berjalan pada zona waktu yang konsisten dan terdokumentasi.       |

# 9. Arsitektur Sistem Tingkat Tinggi

## 9.1 Perubahan Arsitektural Utama dari V1

V1 dirancang untuk alur request/response tunggal per gambar. V2 menuntut pemrosesan video kontinu multi-orang, sehingga diperlukan komponen baru yang tidak ada di V1:

40. Person Detector & Tracker — mendeteksi seluruh orang dalam frame dan mempertahankan identitas track (TrackId) antar-frame.

41. PPE Detector (YOLO ONNX) — dijalankan pada area sekitar tiap track orang untuk mendeteksi kelas-kelas APD.

42. Zone Intrusion Checker — logika geometris untuk menentukan apakah bounding box seseorang berpotongan/berada di dalam salah satu zona berbahaya terdefinisi.

43. Identity Resolver — memanfaatkan kembali IFaceDetectionService (YuNet) dan IFaceEmbeddingExtractor/pencocokan (SFace) dari V1, dengan strategi cache per track.

44. Violation Stabilization Service (Baru — v2.1) — menerapkan state machine Confirm/Clear per episode pelanggaran sebelum insiden & pengurangan skor dibuat (lihat 9.4).

45. Safety Scoring Engine — menerapkan aturan bisnis pengurangan skor, dipicu oleh transisi ke Confirmed dari Violation Stabilization Service.

46. Score Reset Engine (Baru — v2.1) — background job terjadwal + endpoint manual untuk mereset skor kredit keamanan (lihat 9.5).

47. Notification Dispatcher (Telegram) — mengirim pesan ke HRD/Supervisor saat threshold terlampaui.

## 9.2 Peta Komponen (Deskriptif)

```
[Kamera/Edge Device]
  -> [Ingestion & Frame Sampler]
  -> [Person Detector & Tracker]
  -> [Identity Resolver (cache per track)]
  -> [PPE Detector - YOLO ONNX]
  -> [Zone Intrusion Checker]
  -> [Compliance Evaluator]
  -> [Violation Stabilization Service: Candidate / Confirmed / Clearing / Cleared]
  -> pada transisi ke Confirmed: [Violation Event + Safety Scoring Engine] -> [Skor Ledger]
  -> [Threshold Checker] -> [Notification Dispatcher] -> Telegram (HRD & Supervisor)
  -> [Overlay Renderer] -> Live Monitoring Dashboard (bounding box + skor)

[Score Reset Engine] (terjadwal harian / manual)
  -> [SafetyScorePeriodSummary] -> [Reset Skor] -> [ScoreResetLog]
```

## 9.3 Pertimbangan Implementasi

- Lapisan Application/Domain/Infrastructure pada basis kode existing tetap relevan sebagai pola; komponen baru (IPpeDetectionService, IZoneIntrusionService, IViolationStabilizationService, ISafetyScoringService, IScoreResetService, ITelegramNotificationService) mengikuti pola yang sama agar konsisten dengan basis kode V1.

- Perlu keputusan teknik lebih lanjut apakah inferensi video real-time dijalankan langsung di proses API .NET atau dipisah menjadi layanan inferensi khusus (edge worker) — dicatat sebagai pertanyaan terbuka di Bab 21.

- Skema autentikasi ganda (JWT untuk dashboard admin, API Key/Device Token untuk perangkat) dari V1 tetap dipertahankan.

- (Baru — v2.1) Job reset terjadwal diusulkan sebagai .NET BackgroundService/hosted service (atau Hangfire bila dibutuhkan penjadwalan lebih kaya), berjalan sekali per hari per konfigurasi ResetTimeOfDay.

## 9.4 Detail Desain — Violation Stabilization Service (Confirm/Clear State Machine) (Baru — v2.1)

Layanan IViolationStabilizationService menstabilkan sinyal deteksi per-frame yang secara alami “berkedip” (flicker) menjadi episode pelanggaran yang jelas awal dan akhirnya, sehingga satu kejadian nyata hanya menghasilkan tepat satu Violation Event dan satu pengurangan skor.

### Kunci Episode

Episode diidentifikasi oleh kombinasi (TrackId, DangerZoneId, MissingPpeClassId) — bukan langsung EmployeeId — karena identitas wajah bisa telat atau gagal diresolusi sementara tracking orang tetap berjalan (reuse tracking dari FR-11).

### Diagram Status

```
(tidak ada state)
  --deteksi non-compliant pertama--> Candidate

Candidate
  --durasi non-compliant >= ConfirmThresholdSeconds--> Confirmed
    (buat 1 ViolationEvent + kurangi skor 1x)

Confirmed
  --kembali compliant--> Clearing

Clearing
  --durasi compliant >= ClearThresholdSeconds--> Cleared (episode selesai)
  --melanggar lagi sebelum ClearThresholdSeconds--> Confirmed (TIDAK ada ViolationEvent baru)

Candidate
  --track hilang sebelum Confirmed--> (dihapus, tanpa insiden) [TODO: perlu validasi stakeholder]
```

### Aturan Transisi

- Candidate → Confirmed: kandidat pelanggaran pertama terdeteksi membuat state Candidate dan mencatat FirstDetectedAt; tiap frame non-compliant berikutnya memperbarui LastNonCompliantAt. Saat (LastNonCompliantAt − FirstDetectedAt) ≥ ConfirmThresholdSeconds: status berpindah ke Confirmed; sistem membuat ViolationEvent sekali, dengan snapshot dari frame terbaru saat threshold terlampaui (bukan frame pertama); Identity Resolver dijalankan (memakai cache track bila ada) untuk mengisi EmployeeId, gagal → “Tidak Dikenali” (FR-14); skor dikurangi sekali pada titik ini — tidak per-frame, tidak per-cooldown.

- Confirmed → Clearing → Cleared: kondisi kembali compliant mencatat LastCompliantAt dan memindahkan status ke Clearing. Jika (waktu sekarang − LastCompliantAt) ≥ ClearThresholdSeconds → status ke Cleared (episode selesai). Jika sebelum threshold tercapai kondisi melanggar lagi → LastCompliantAt = null, status kembali ke Confirmed, TIDAK membuat ViolationEvent baru.

- Frame dengan confidence < Detection:MinConfidenceThreshold: diabaikan total — tidak dihitung compliant maupun non-compliant, tidak mereset FirstDetectedAt, tidak memajukan LastNonCompliantAt/LastCompliantAt.

- Track hilang sebelum Confirmed: state Candidate dihapus/digugurkan, TIDAK membuat insiden.

> **TODO (kode & produk):** aturan “track hilang sebelum Confirmed = tidak ada insiden” adalah asumsi awal yang perlu divalidasi bersama stakeholder K3 sebelum implementasi final — ada risiko pelanggaran nyata yang “lolos” bila re-tracking gagal berulang kali secara sengaja. Beri komentar TODO pada kode di titik ini.

### Kriteria Penerimaan Fitur 1

- Pelanggaran berdurasi < ConfirmThreshold tidak pernah menghasilkan ViolationEvent atau pengurangan skor.

- Pelanggaran panjang menghasilkan tepat 1 ViolationEvent sampai episode Cleared.

- Kondisi sempat compliant namun < ClearThreshold di tengah pelanggaran tidak menutup episode dan tidak membuat insiden baru.

- Seluruh aturan di atas wajib dicakup unit test sebelum rilis.

## 9.5 Detail Desain — Score Reset Engine (Terjadwal & Manual) (Baru — v2.1)

Score Reset Engine terdiri dari dua jalur eksekusi yang berbagi logika inti (pengarsipan ringkasan periode → eksekusi reset → pencatatan log): job terjadwal harian, dan endpoint manual untuk kasus insidental (mis. setelah teguran/briefing atau investigasi selesai).

### Reset Terjadwal

- Berjalan tiap hari pada jam SafetyScore:ResetTimeOfDay untuk SEMUA karyawan.

- Skor kembali penuh ke SafetyScore:InitialValue (reset total, bukan pemulihan bertahap).

- SafetyScore:RecapLeadMinutes menit sebelum eksekusi, sistem dapat mengirim rekap kepada pihak terkait — cakupan pastinya adalah pertanyaan terbuka (Bab 21).

### Reset Manual

- Endpoint: POST /api/employees/{id}/safety-score/reset.

- Body wajib berisi ResetReason (enum: TeguranBriefingDiberikan, TrainingSelesai, InvestigasiDitutup, PerbaikanFisikZona, Lainnya) dan Note wajib diisi jika ResetReason = Lainnya.

- Hanya dapat dipanggil oleh peran berwenang (Admin).

- Permintaan dengan ResetReason kosong ditolak dengan status 400.

### Sebelum Eksekusi Reset (Scheduled maupun Manual)

- Sistem membuat SafetyScorePeriodSummary yang mengarsipkan skor akhir sebelum reset, total pelanggaran, dan breakdown pelanggaran per kelas APD pada periode berjalan.

> ***Belum lengkap pada spesifikasi sumber:** langkah-langkah pra-eksekusi lain (jika ada) selain pembuatan SafetyScorePeriodSummary — misalnya urutan pasti pembuatan ScoreResetLog relatif terhadap ringkasan periode, dan penanganan bila proses gagal di tengah jalan — belum dirinci dalam draf ini dan perlu dilengkapi bersama tim engineering sebelum desain teknis final. Lihat Pertanyaan Terbuka Bab 21.*

# 10. Model Data (Entitas Baru & Perubahan)

## 10.1 DangerZone (Baru)

|                      |                              |                                                    |
|----------------------|------------------------------|----------------------------------------------------|
| **Field**            | **Tipe**                     | **Keterangan**                                     |
| Id                   | Guid                         | Identitas unik zona                                |
| Name                 | string                       | Nama zona, mis. “Ruang Panel Listrik Lantai 2”     |
| CameraSourceId       | Guid/string                  | Referensi sumber kamera/video                      |
| RectangleCoordinates | object (x, y, width, height) | Koordinat area persegi panjang, ternormalisasi 0–1 |
| IsActive             | bool                         | Status aktif/nonaktif zona                         |
| SupervisorIds        | `List<Guid>`                 | Supervisor yang bertanggung jawab atas zona ini    |

## 10.2 PpeClassDefinition (Baru)

|                     |          |                                                                               |
|---------------------|----------|-------------------------------------------------------------------------------|
| **Field**           | **Tipe** | **Keterangan**                                                                |
| Id                  | Guid     | Identitas unik                                                                |
| YoloClassIndex      | int      | Indeks kelas sesuai keluaran model YOLO                                       |
| DisplayName         | string   | Nama APD yang dipahami manusia (mis. “Helm”)                                  |
| IndicatesCompliance | bool     | true jika kelas ini menandakan APD dipakai; false jika menandakan pelanggaran |

## 10.3 ZoneRequiredPpe (Baru — relasi banyak-ke-banyak)

|                      |          |                                 |
|----------------------|----------|---------------------------------|
| **Field**            | **Tipe** | **Keterangan**                  |
| DangerZoneId         | Guid     | Referensi ke DangerZone         |
| PpeClassDefinitionId | Guid     | Referensi ke PpeClassDefinition |

## 10.4 Employee (Perluasan dari V1)

|                    |            |                                           |
|--------------------|------------|-------------------------------------------|
| **Field Tambahan** | **Tipe**   | **Keterangan**                            |
| SafetyCreditScore  | int/double | Skor kredit keamanan saat ini             |
| SupervisorId       | Guid?      | Supervisor langsung individu ini          |
| DepartmentId/Name  | string     | Departemen, untuk pengelompokan pelaporan |

## 10.5 ViolationEvent (Baru)

|                           |                    |                                                              |
|---------------------------|--------------------|--------------------------------------------------------------|
| **Field**                 | **Tipe**           | **Keterangan**                                               |
| Id                        | Guid               | Identitas unik                                               |
| EmployeeId                | Guid?              | Nullable — dapat “Tidak Dikenali” (FR-14)                    |
| DangerZoneId              | Guid               | Zona tempat pelanggaran terjadi                              |
| MissingPpeClassIds        | `List<Guid>`       | APD wajib yang tidak terdeteksi dipakai                      |
| DetectedAt                | DateTimeOffset     | Waktu kejadian (saat episode Confirmed)                      |
| SnapshotImagePath         | string?            | Path/URL bukti gambar (frame terbaru saat Confirmed)         |
| ScoreDeducted             | double             | Jumlah skor yang dikurangi akibat kejadian ini               |
| ViolationCandidateStateId | Guid (Baru — v2.1) | Referensi ke episode stabilisasi yang menghasilkan event ini |

## 10.6 SafetyScoreLedger (Baru — riwayat/audit skor)

|                          |                     |                                                                 |
|--------------------------|---------------------|-----------------------------------------------------------------|
| **Field**                | **Tipe**            | **Keterangan**                                                  |
| Id                       | Guid                | Identitas unik                                                  |
| EmployeeId               | Guid                | Referensi individu                                              |
| ChangeAmount             | double              | Perubahan skor (negatif untuk pelanggaran, positif untuk reset) |
| ScoreBefore / ScoreAfter | double              | Nilai sebelum & sesudah                                         |
| RelatedViolationEventId  | Guid?               | Referensi ke ViolationEvent jika relevan                        |
| RelatedScoreResetLogId   | Guid? (Baru — v2.1) | Referensi ke ScoreResetLog jika perubahan berasal dari reset    |
| Timestamp                | DateTimeOffset      | Waktu perubahan                                                 |

## 10.7 NotificationRecipient (Baru)

|                            |                        |                                                                 |
|----------------------------|------------------------|-----------------------------------------------------------------|
| **Field**                  | **Tipe**               | **Keterangan**                                                  |
| Id                         | Guid                   | Identitas unik                                                  |
| Role                       | enum (HRD, Supervisor) | Peran penerima                                                  |
| TelegramChatId             | string                 | Chat ID Telegram tujuan                                         |
| LinkedSupervisorEmployeeId | Guid?                  | Jika Role = Supervisor, tautan ke data karyawan Supervisor tsb. |

## 10.8 NotificationLog (Baru)

|                  |                     |                                 |
|------------------|---------------------|---------------------------------|
| **Field**        | **Tipe**            | **Keterangan**                  |
| Id               | Guid                | Identitas unik                  |
| ViolationEventId | Guid                | Referensi kejadian pemicu       |
| RecipientId      | Guid                | Referensi NotificationRecipient |
| Status           | enum (Sent, Failed) | Status pengiriman               |
| SentAt           | DateTimeOffset      | Waktu pengiriman/percobaan      |
| ErrorMessage     | string?             | Detail bila gagal               |

## 10.9 ViolationCandidateState (Baru — v2.1)

Merepresentasikan satu episode pelanggaran yang sedang berjalan pada mesin stabilisasi Confirm/Clear (Bab 9.4). Struktur field berikut adalah usulan awal berbasis aturan yang telah ditetapkan; perlu direview oleh tim engineering pada tahap desain teknis.

|                         |                                                |                                                                                          |
|-------------------------|------------------------------------------------|------------------------------------------------------------------------------------------|
| **Field**               | **Tipe**                                       | **Keterangan**                                                                           |
| Id                      | Guid                                           | Identitas unik state                                                                     |
| TrackId                 | string/Guid                                    | Bagian dari kunci episode; identitas track dari Person Detector & Tracker                |
| DangerZoneId            | Guid                                           | Bagian dari kunci episode; zona tempat kandidat pelanggaran terjadi                      |
| MissingPpeClassId       | Guid                                           | Bagian dari kunci episode; kelas APD yang tidak terpenuhi                                |
| Status                  | enum (Candidate, Confirmed, Clearing, Cleared) | Status episode saat ini                                                                  |
| FirstDetectedAt         | DateTimeOffset                                 | Waktu kandidat pelanggaran pertama terdeteksi                                            |
| LastNonCompliantAt      | DateTimeOffset                                 | Waktu frame non-compliant terakhir tercatat                                              |
| LastCompliantAt         | DateTimeOffset?                                | Waktu mulai kembali compliant (null di luar status Clearing)                             |
| EmployeeId              | Guid?                                          | Diisi oleh Identity Resolver pada saat transisi ke Confirmed; null bila “Tidak Dikenali” |
| ViolationEventId        | Guid?                                          | Referensi ke ViolationEvent yang dibuat saat episode Confirmed                           |
| ConfirmedAt / ClearedAt | DateTimeOffset?                                | Timestamp transisi status, untuk audit & analitik                                        |

## 10.10 SafetyScorePeriodSummary (Baru — v2.1)

|                          |                          |                                              |
|--------------------------|--------------------------|----------------------------------------------|
| **Field**                | **Tipe**                 | **Keterangan**                               |
| Id                       | Guid                     | Identitas unik                               |
| EmployeeId               | Guid                     | Referensi individu                           |
| PeriodStart / PeriodEnd  | DateTimeOffset           | Rentang periode skor yang diringkas          |
| FinalScoreBeforeReset    | double                   | Skor akhir individu sebelum reset dieksekusi |
| TotalViolations          | int                      | Total pelanggaran pada periode tersebut      |
| ViolationsByPpeClassJson | string (JSON)            | Breakdown jumlah pelanggaran per kelas APD   |
| TriggerType              | enum (Scheduled, Manual) | Pemicu reset yang menghasilkan ringkasan ini |

## 10.11 ScoreResetLog (Baru — v2.1)

|                        |                                                                                                   |                                                      |
|------------------------|---------------------------------------------------------------------------------------------------|------------------------------------------------------|
| **Field**              | **Tipe**                                                                                          | **Keterangan**                                       |
| Id                     | Guid                                                                                              | Identitas unik                                       |
| EmployeeId             | Guid                                                                                              | Referensi individu                                   |
| ResetAt                | DateTimeOffset                                                                                    | Waktu reset dieksekusi                               |
| ResetBy                | Guid?                                                                                             | Id pengguna Admin; null jika TriggerType = Scheduled |
| ResetReason            | enum (TeguranBriefingDiberikan, TrainingSelesai, InvestigasiDitutup, PerbaikanFisikZona, Lainnya) | Alasan reset                                         |
| Note                   | string?                                                                                           | Wajib diisi jika ResetReason = Lainnya               |
| TriggerType            | enum (Scheduled, Manual)                                                                          | Jenis pemicu reset                                   |
| RelatedPeriodSummaryId | Guid                                                                                              | Referensi ke SafetyScorePeriodSummary terkait        |

# 11. Ringkasan Perubahan API

|                     |                                                                  |                                                                          |                        |
|---------------------|------------------------------------------------------------------|--------------------------------------------------------------------------|------------------------|
| **Metode**          | **Path (Usulan)**                                                | **Deskripsi**                                                            | **Status**             |
| GET/POST/PUT/DELETE | /api/danger-zones                                                | CRUD zona berbahaya                                                      | Baru                   |
| GET/POST/PUT        | /api/ppe-classes                                                 | Kelola pemetaan kelas APD dari model YOLO                                | Baru                   |
| PUT                 | /api/danger-zones/{id}/required-ppe                              | Menetapkan APD wajib untuk suatu zona                                    | Baru                   |
| POST / WS           | /api/monitoring/stream/{cameraId} atau /ws/monitoring/{cameraId} | Menerima/streaming frame untuk diproses pipeline deteksi                 | Baru                   |
| GET                 | /api/employees/{id}/safety-score                                 | Melihat skor & riwayat skor individu                                     | Baru                   |
| GET                 | /api/violations                                                  | Daftar riwayat pelanggaran (dengan filter)                               | Baru                   |
| GET/PUT             | /api/notifications/recipients                                    | Kelola pemetaan penerima Telegram (HRD/Supervisor)                       | Baru                   |
| GET                 | /api/notifications/logs                                          | Log status pengiriman notifikasi                                         | Baru                   |
| POST                | /api/employees/{id}/safety-score/reset                           | Reset skor manual — wajib ResetReason (+Note jika Lainnya), khusus Admin | Baru (v2.1)            |
| GET                 | /api/employees/{id}/safety-score/period-summaries                | Riwayat SafetyScorePeriodSummary individu                                | Baru (v2.1)            |
| GET                 | /api/employees/{id}/safety-score/reset-logs                      | Riwayat ScoreResetLog individu (audit reset)                             | Baru (v2.1)            |
| GET/POST            | /api/employees                                                   | Manajemen data karyawan                                                  | Reuse V1               |
| POST                | /api/employees/{id}/faces                                        | Pendaftaran wajah karyawan                                               | Reuse V1               |
| GET/PUT             | /api/settings                                                    | Pengaturan sistem (threshold, skor awal, jadwal reset, dsb.)             | Reuse & perluasan V1   |
| POST                | /api/auth/login                                                  | Autentikasi admin (JWT)                                                  | Reuse V1               |
| POST                | /api/recognition/attempt                                         | Endpoint pengenalan wajah tunggal V1                                     | Dipertahankan/opsional |

> ***Catatan:** rancangan endpoint di atas bersifat usulan tingkat tinggi untuk keperluan estimasi; kontrak detail (skema request/response) perlu dirancang pada fase technical design.*

# 12. Model Machine Learning

|                         |                                                                                                |                                                                                                      |
|-------------------------|------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| **Model**               | **Fungsi**                                                                                     | **Status**                                                                                           |
| YuNet (yunet.onnx)      | Deteksi wajah                                                                                  | Reuse dari V1                                                                                        |
| SFace (sface.onnx)      | Ekstraksi embedding & pencocokan wajah untuk identifikasi individu                             | Reuse dari V1                                                                                        |
| YOLO APD (.onnx)        | Deteksi kelas-kelas APD pada frame video                                                       | Baru — model sudah tersedia, daftar kelas akan diisi kemudian dan wajib dikelola sebagai konfigurasi |
| Person Detector/Tracker | Mendeteksi & melacak individu dalam frame agar identitas track (TrackId) konsisten antar-frame | Baru                                                                                                 |

> ***Catatan:** karena kelas APD belum final saat PRD ini ditulis, seluruh desain di PRD ini sengaja dibuat tidak bergantung pada nama kelas spesifik — admin akan memetakan kelas hasil model ke label dan aturan bisnis melalui antarmuka konfigurasi (Alur 2b), bukan melalui perubahan kode.*

## 12.1 Dataset Sumber untuk Model YOLO APD dari Roboflow Universe (Baru — v2.1)

Sebagai referensi awal pembentukan model deteksi APD (Bab 12), tim telah mengidentifikasi beberapa dataset publik di Roboflow Universe yang relevan dan berencana menggabungkannya menjadi satu dataset pelatihan. Bagian ini mendokumentasikan dataset kandidat, proses penggabungannya, serta implikasinya terhadap pemetaan kelas APD.

|                              |                                             |                   |                                                       |
|------------------------------|---------------------------------------------|-------------------|-------------------------------------------------------|
| **Dataset**                  | **Sumber / Lisensi**                        | **Jumlah Gambar** | **Kelas**                                             |
| Hardhat Detection            | Roboflow Universe (publik)                  | —                 | head, helmet, person                                  |
| Mask Wearing Detection       | Roboflow Universe (publik)                  | —                 | mask, no-mask                                         |
| Lab PPE                      | Azriel — CC BY 4.0                          | 108               | Gloves, Lab Coat, Safety Shoes                        |
| to_try_to_annotate_something | Tjoargens Workspace (milik tim) — CC BY 4.0 | 407               | Bouffant-cap, Jas-laboratorium, Masker, Sarung-tangan |

**Proses Penggabungan Dataset — Fork lalu Merge**

- Dataset publik milik pihak lain (Hardhat, Mask Wearing, Lab PPE) harus di-fork terlebih dahulu ke workspace tim melalui tombol “Fork Dataset” sebelum dapat digabung; dataset yang memang sudah dimiliki tim sendiri (to_try_to_annotate_something) tidak memerlukan proses fork ini.

- Setelah seluruh dataset berada dalam satu workspace, project-project tersebut digabung melalui fitur “Merge Datasets” pada Roboflow (menu titik tiga pada project → pilih project lain yang ingin digabung → beri nama project & annotation group baru).

- Hasil merge adalah project baru yang berisi gabungan gambar dari seluruh project sumber; project-project asli tidak hilang, dan gambar duplikat antar dataset tidak dikenakan biaya tambahan.

**Catatan Penting — Kebutuhan Pemetaan Kelas (Class Mapping)**

Penggabungan dataset di Roboflow tidak secara otomatis menyatukan kelas yang secara konsep sama namun berbeda penamaan atau bahasa (dataset di atas mencampur istilah Indonesia dan Inggris). Akibatnya, seluruh kelas dari keempat dataset akan tetap tampil apa adanya pada project gabungan, padahal beberapa di antaranya merepresentasikan konsep APD yang sama, misalnya:

- mask vs Masker

- Gloves vs Sarung-tangan

- Lab Coat vs Jas-laboratorium

|                                   |                                                                                                                                       |                                  |
|-----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|----------------------------------|
| **Kelas Mentah (Dataset Sumber)** | **Kelas Kanonis (Usulan)**                                                                                                            | **Kategori**                     |
| mask, Masker                      | Masker                                                                                                                                | Indikator Kepatuhan              |
| no-mask                           | Masker (Tidak Dipakai)                                                                                                                | Indikator Pelanggaran            |
| Gloves, Sarung-tangan             | Sarung Tangan                                                                                                                         | Indikator Kepatuhan              |
| Lab Coat, Jas-laboratorium        | Jas Laboratorium                                                                                                                      | Indikator Kepatuhan              |
| Bouffant-cap                      | Penutup Kepala (Bouffant Cap)                                                                                                         | Indikator Kepatuhan              |
| Safety Shoes                      | Sepatu Safety                                                                                                                         | Indikator Kepatuhan              |
| helmet                            | Helm                                                                                                                                  | Indikator Kepatuhan              |
| head                              | Helm (Tidak Dipakai)                                                                                                                  | Indikator Pelanggaran            |
| person                            | (bukan kelas APD — redundan dengan komponen Person Detector & Tracker (Bab 9.1); diusulkan tidak diikutkan dalam anotasi dataset APD) | Non-APD (Diusulkan Dikecualikan) |

Pemetaan kelas mentah hasil model YOLO ke kelas kanonis di atas dilakukan melalui mekanisme konfigurasi PpeClassDefinition (Bab 10.2) dan Alur 2b (Bab 6) saat Admin mengonfigurasi kelas APD dari model — bukan melalui perubahan kode — sejalan dengan asumsi bahwa daftar kelas APD final belum ditetapkan saat PRD ini ditulis (Bab 4.3).

> ***Catatan — kelas head/person vs. pipeline wajah (YuNet + SFace):** kelas head pada dataset Hardhat menandai kepala tanpa helm terdeteksi (bukan wajah), sehingga tetap dipertahankan sebagai indikator pelanggaran untuk kelas Helm — sejalan dengan pola no-mask di atas — dan tidak tumpang tindih dengan pipeline pengenalan wajah: head/helmet mendukung deteksi kepatuhan APD pada model YOLO, sedangkan YuNet + SFace menjalankan identifikasi individu (Identity Resolver, Bab 9.1) pada crop wajah yang terpisah, untuk tujuan yang berbeda (atribusi identitas, bukan kepatuhan APD). Kelas person, sebaliknya, diusulkan tidak diikutkan dalam anotasi/pelatihan dataset APD karena fungsinya (deteksi keberadaan orang) sudah dicakup oleh komponen Person Detector & Tracker (Bab 9.1) yang berjalan terpisah dari PPE Detector; menyertakannya hanya menduplikasi pekerjaan anotasi tanpa menambah nilai bagi klasifikasi APD.*
>
> ***Catatan:** nama & jumlah kelas final, serta kelas kanonis mana yang dipakai sebagai rujukan tunggal per konsep APD (mis. “Masker” vs “Mask”), masih perlu difinalisasi bersama tim sebelum dataset gabungan dipakai untuk pelatihan model produksi. Lihat juga Pertanyaan Terbuka Bab 21 poin 1.*

# 13. Aturan Bisnis — Skor Kredit Keamanan (Ilustratif)

Nilai-nilai berikut adalah contoh awal untuk diskusi, seluruhnya harus dapat dikonfigurasi melalui SystemSetting (mengikuti pola V1):

|                                                   |                                    |                                                                                                                                                                         |
|---------------------------------------------------|------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Parameter**                                     | **Nilai Contoh**                   | **Keterangan**                                                                                                                                                          |
| Skor awal per karyawan (SafetyScore:InitialValue) | 100                                | Nilai yang dipulihkan setiap kali reset dieksekusi (lihat 13.2)                                                                                                         |
| Pengurangan per pelanggaran                       | -10 s/d -20 (tergantung kelas APD) | Pelanggaran pada APD kritis dapat diberi bobot lebih besar                                                                                                              |
| ConfirmThresholdSeconds (Direvisi v2.1)           | mis. 3–5 detik (contoh)            | Menggantikan konsep “cooldown deduplikasi” pada draft v2.0 — durasi non-compliant berkelanjutan sebelum episode dinyatakan Confirmed dan skor dikurangi (lihat Bab 9.4) |
| ClearThresholdSeconds (Baru v2.1)                 | mis. beberapa detik (contoh)       | Durasi compliant berkelanjutan sebelum episode dinyatakan Cleared (lihat Bab 9.4)                                                                                       |
| Detection:MinConfidenceThreshold (Baru v2.1)      | mis. 0.5 (contoh)                  | Frame di bawah nilai ini diabaikan total oleh mesin stabilisasi                                                                                                         |
| Threshold notifikasi                              | Skor < 60                         | Saat terlampaui, sistem mengirim notifikasi ke HRD dan Supervisor terkait sekaligus                                                                                     |

> ***Catatan:** threshold bertingkat (mis. peringatan ke Supervisor saja pada skor < 70, eskalasi ke HRD pada skor < 40) dapat dipertimbangkan pada fase berikutnya, namun kebutuhan inti V2 adalah satu threshold yang memicu notifikasi ke HRD dan Supervisor secara bersamaan.*

## 13.2 Parameter Reset Skor (Baru — v2.1)

|                              |                  |                                                                              |
|------------------------------|------------------|------------------------------------------------------------------------------|
| **Parameter**                | **Nilai Contoh** | **Keterangan**                                                               |
| SafetyScore:ResetTimeOfDay   | “00:00”          | Jam eksekusi reset terjadwal harian, untuk seluruh karyawan                  |
| SafetyScore:RecapLeadMinutes | 15               | Menit sebelum eksekusi reset saat rekap (opsional) dikirim ke HRD/Supervisor |
| SafetyScore:InitialValue     | 100              | Nilai skor yang dipulihkan pada setiap eksekusi reset                        |

> ***Catatan:** kebijakan reset skor sebelumnya tercatat sebagai “keputusan bisnis terbuka” pada draft v2.0 (Bab 13); pada v2.1 kebijakan ini sudah dirinci sebagai mesin reset terjadwal harian + manual (lihat Bab 6 Alur 7, 7.12, 9.5). Nilai contoh di atas tetap perlu disepakati resmi oleh tim K3/HRD.*

# 14. Integrasi Notifikasi Telegram

- Mekanisme: Bot Telegram terpisah (token disimpan sebagai secret/konfigurasi sistem), mengirim pesan ke chat_id yang telah dipetakan untuk tiap penerima (HRD bersifat global; Supervisor dipetakan per zona/departemen melalui NotificationRecipient).

- Isi pesan notifikasi (usulan template): nama & kode karyawan (atau “Tidak Dikenali”), nama zona berbahaya, waktu kejadian (saat episode Confirmed), daftar APD yang tidak terpenuhi, skor kredit keamanan terkini, dan (opsional) tautan/lampiran snapshot bukti.

- Keandalan: setiap pengiriman dicatat pada NotificationLog dengan status Sent/Failed; kegagalan tidak menghapus Violation Event terkait sehingga dapat ditinjau ulang dari dashboard.

- (Baru — v2.1) Notifikasi pelanggaran kini dipicu tepat satu kali per episode (saat transisi ke Confirmed), bukan berulang per-frame; rekap pra-reset (SafetyScore:RecapLeadMinutes) adalah jalur notifikasi terpisah yang perlu dikonfirmasi cakupannya.

# 15. Deskripsi Antarmuka Pengguna (Konseptual)

48. Live Monitoring View — menampilkan umpan video per kamera dengan overlay: garis batas zona berbahaya, bounding box tiap individu, dan label nama + skor kredit keamanan pada tiap box (warna berbeda untuk status patuh vs. melanggar).

49. Zone Editor — antarmuka untuk menggambar/mengedit area persegi panjang di atas pratinjau kamera, memilih kelas APD wajib untuk zona tersebut, dan menautkan Supervisor penanggung jawab.

50. Manajemen Kelas APD — antarmuka untuk memetakan indeks kelas model YOLO ke nama APD dan menandai status kepatuhan/pelanggarannya.

51. Papan Skor Karyawan — daftar seluruh karyawan dengan skor kredit keamanan terkini, dapat difilter per departemen/zona, dengan indikator warna (aman/waspada/kritis).

52. Riwayat Pelanggaran — daftar Violation Event dengan filter zona/individu/tanggal, status episode (mis. sedang Confirmed vs. sudah Cleared — v2.1), serta detail snapshot bukti.

53. Pengaturan Notifikasi — antarmuka untuk memetakan chat ID Telegram HRD dan tiap Supervisor, serta mengatur nilai threshold, skor awal, dan besaran pengurangan.

54. (Baru — v2.1) Dialog Reset Skor Manual — form ringkas untuk Admin memilih karyawan, memilih ResetReason dari dropdown, mengisi Note (wajib bila Lainnya), dan mengonfirmasi eksekusi reset.

55. (Baru — v2.1) Riwayat Reset Skor & Ringkasan Periode — daftar ScoreResetLog dan SafetyScorePeriodSummary per karyawan, untuk keperluan audit HRD.

# 16. Migrasi dari V1 ke V2

|                                                                         |                                                                                                                                                         |
|-------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Komponen V1**                                                         | **Status di V2**                                                                                                                                        |
| Employee, enrollment wajah (EmployeesFacesController)                   | Reuse & diperluas (tambah skor, supervisor, departemen)                                                                                                 |
| IFaceDetectionService (YuNet), IFaceEmbeddingExtractor/matching (SFace) | Reuse sebagai modul Identity Resolver, kini juga dipakai oleh Violation Stabilization Service (v2.1)                                                    |
| Autentikasi JWT (admin) & API Key/Device Token (perangkat)              | Reuse tanpa perubahan mendasar                                                                                                                          |
| SystemSetting (key-value config)                                        | Reuse pola untuk parameter skor/threshold, termasuk parameter stabilisasi dan reset (v2.1)                                                              |
| AttendanceSession, AttendanceEntry                                      | Dinonaktifkan dari fungsi utama. Keputusan hapus total atau dipertahankan sebagai modul terpisah/legacy adalah keputusan bisnis terbuka (lihat Bab 21). |
| RecognitionLog                                                          | Pola log dipertahankan, dievolusikan menjadi bagian dari audit trail ViolationEvent/ViolationCandidateState.                                            |
| ISpoofingDetectionService                                               | Dapat dipertahankan sebagai mitigasi terhadap upaya penipuan identifikasi; relevansinya meningkat di konteks V2.                                        |
| Endpoint POST /api/recognition/attempt                                  | Dipertahankan sebagai kapabilitas pengenalan wajah tunggal, namun tidak lagi menjadi alur utama produk.                                                 |

# 17. Risiko & Mitigasi

|                                                                             |                                                                                      |                                                                                                                                                            |
|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Risiko**                                                                  | **Dampak**                                                                           | **Mitigasi**                                                                                                                                               |
| Daftar kelas APD & model YOLO belum final                                   | Keterlambatan pengembangan fitur kepatuhan                                           | Desain sistem sepenuhnya config-driven untuk kelas APD (Bab 10.2, 12)                                                                                      |
| False positive/negative deteksi APD                                         | Skor individu bisa turun secara tidak adil, atau pelanggaran nyata tidak tercatat    | Simpan snapshot bukti pada setiap Violation Event; pertimbangkan mekanisme banding/koreksi skor oleh Admin                                                 |
| Privasi data wajah & rekaman video                                          | Risiko kepatuhan regulasi perlindungan data pribadi                                  | Kontrol akses berbasis peran, kebijakan retensi data snapshot, tinjau kepatuhan regulasi sebelum go-live                                                   |
| Beban komputasi inferensi real-time multi-kamera                            | Latensi tinggi, sistem tidak responsif                                               | Evaluasi kebutuhan GPU/edge inference; batasi frame rate; pertimbangkan pemisahan Edge/Inference Worker                                                    |
| Koneksi Telegram/internet terputus saat insiden kritis                      | Eskalasi tidak sampai ke HRD/Supervisor tepat waktu                                  | Retry otomatis, NotificationLog untuk audit kegagalan, alert di dashboard sebagai jalur cadangan                                                           |
| Wajah tidak terdeteksi/tidak dikenali                                       | Pelanggaran tidak dapat diatribusikan ke individu                                    | Tetap catat sebagai “Tidak Dikenali” dengan snapshot (FR-14)                                                                                               |
| (Baru v2.1) Track hilang sebelum episode Confirmed digugurkan tanpa insiden | Pelanggaran nyata berpotensi “lolos” bila re-tracking gagal berulang (sengaja/tidak) | Tandai TODO di kode (Bab 9.4); validasi asumsi ini bersama stakeholder K3 sebelum implementasi final; pertimbangkan metrik pemantauan frekuensi track loss |
| (Baru v2.1) Job reset terjadwal gagal/berjalan ganda                        | Skor karyawan tidak ter-reset tepat waktu, atau ter-reset dua kali dalam sehari      | Rancang job idempoten, log setiap eksekusi (ScoreResetLog), pantau kegagalan job dan sediakan mekanisme retry/re-run manual oleh Admin                     |
| (Baru v2.1) Spesifikasi urutan pra-eksekusi reset belum lengkap (Bab 9.5)   | Ambiguitas implementasi antara pembuatan ringkasan periode dan log reset             | Lengkapi urutan detail bersama tim engineering pada fase desain teknis sebelum coding dimulai (lihat Bab 21)                                               |

# 18. Metrik Keberhasilan (Ilustratif — Perlu Validasi Stakeholder)

- Waktu dari terjadinya pelanggaran (episode Confirmed) hingga notifikasi Telegram terkirim: target awal beberapa detik.

- Persentase pelanggaran yang berhasil diatribusikan ke individu terdaftar (vs. “Tidak Dikenali”).

- Tren penurunan jumlah pelanggaran tercatat per zona dari waktu ke waktu setelah sistem berjalan.

- Tingkat keberhasilan pengiriman notifikasi Telegram (Sent vs. Failed).

- (Baru v2.1) Rasio jumlah kandidat pelanggaran (Candidate) terhadap jumlah yang benar-benar Confirmed — indikator efektivitas mesin stabilisasi dalam menyaring flicker/false positive per-frame.

- (Baru v2.1) Tingkat keberhasilan eksekusi reset terjadwal harian (berhasil vs. gagal/perlu re-run manual).

# 19. Roadmap Implementasi (Usulan Fase)

|                     |                                          |                                                                                                                              |
|---------------------|------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| **Fase**            | **Fokus**                                | **Output Utama**                                                                                                             |
| Fase 1              | Fondasi deteksi video                    | Integrasi model YOLO ONNX, pipeline penerimaan video, deteksi & tracking orang, overlay bounding box dasar (tanpa skor/zona) |
| Fase 2              | Zona & Kepatuhan                         | Zone Editor, konfigurasi kelas APD, logika deteksi pelanggaran zona                                                          |
| Fase 3              | Mesin Skor & Stabilisasi (Direvisi v2.1) | Violation Stabilization Service (Confirm/Clear state machine), Safety Scoring Engine, skor kredit keamanan, ledger riwayat   |
| Fase 3b (Baru v2.1) | Score Reset Engine                       | Background job reset terjadwal harian, endpoint reset manual, SafetyScorePeriodSummary, ScoreResetLog                        |
| Fase 4              | Notifikasi                               | Integrasi Telegram Bot API, pemetaan penerima HRD/Supervisor, threshold checker                                              |
| Fase 5              | Dashboard & Pelaporan                    | Live monitoring UI lengkap, papan skor, riwayat pelanggaran, riwayat reset skor, laporan tren                                |
| Fase 6              | Hardening & Kepatuhan Data               | Kontrol akses, kebijakan retensi snapshot, pengujian beban multi-kamera, unit test lengkap untuk state machine stabilisasi   |

# 20. Kriteria Penerimaan (Acceptance Criteria) — Ringkasan Fitur Inti

- Zona Berbahaya: Admin dapat membuat zona persegi panjang kustom di atas pratinjau kamera tertentu dan menyimpannya; zona tersebut tampil sebagai garis batas pada live monitoring.

- Aturan APD: Admin dapat menetapkan satu/lebih kelas APD wajib untuk suatu zona, dan sistem membedakan aturan antar zona yang berbeda.

- Deteksi & Skor: ketika seseorang yang terdaftar masuk ke zona berbahaya tanpa APD wajib secara stabil (melewati ConfirmThresholdSeconds), sistem mencatat pelanggaran, mengurangi skornya tepat sekali, dan skor terbaru langsung tampil pada bounding box-nya di layar pemantauan.

- Stabilisasi (Baru v2.1): pelanggaran berdurasi singkat (di bawah ConfirmThreshold) tidak pernah menghasilkan insiden; pelanggaran panjang menghasilkan tepat satu Violation Event sampai episode Cleared; kembali patuh sesaat sebelum ClearThreshold tercapai tidak menutup episode maupun membuat insiden baru.

- Reset Skor (Baru v2.1): skor seluruh karyawan kembali ke nilai awal setiap hari pada jam yang dikonfigurasi; Admin dapat mereset skor karyawan tertentu secara manual dengan alasan wajib tercatat; setiap reset menghasilkan ringkasan periode dan log audit yang dapat ditelusuri.

- Notifikasi: ketika skor seseorang turun di bawah threshold yang dikonfigurasi, pesan otomatis terkirim ke chat Telegram HRD dan Supervisor terkait, memuat detail pelanggaran.

- Audit: setiap pelanggaran, perubahan skor, dan reset skor dapat ditelusuri kembali melalui riwayat/log yang tersedia di dashboard.

# 21. Pertanyaan Terbuka untuk Stakeholder

> *Penomoran poin di bawah mengikuti penomoran pertanyaan asli pada backlog stakeholder (kode Q56–Q67); beberapa nomor urut sengaja tidak berurutan karena mengikuti nomor pertanyaan sumber.*

### 21.1 Daftar final kelas APD & pemetaan indeks model (Q56)

Rekomendasi: lanjutkan desain teknis dengan kontrak PpeClassDefinition (Bab 10.2). Kelas APD sudah ada sebagian dan mungkin nanti ditambah lagi.

### 21.3 Jumlah kamera/zona & infrastruktur GPU (Q58)

Rilis awal dibatasi 2 kamera per zona, sebelum scale-out, karena NFR skalabilitas (Bab 8) sudah mensyaratkan arsitektur horizontal-scaling — jadi pilot kecil tidak mengunci desain. GPU yang tersedia hanya GPU laptop.

### 21.4 In-process vs Edge/Inference Worker (Q59)

Dipisahkan sebagai layanan Inference Worker mandiri sejak awal, bukan in-process di API .NET. Saat development akan memakai laptop terlebih dahulu (2 unit).

### 21.5 Integrasi HRIS (Q60)

Rekomendasi: tidak wajib untuk rilis awal (V2.1). Reuse data Employee/Department yang sudah ada dari V1 (Bab 16) cukup untuk MVP. Tandai integrasi HRIS otomatis sebagai kandidat roadmap V3 kecuali stakeholder K3/HRD menyatakan data karyawan V1 sudah usang/tidak sinkron — dalam hal itu, sinkronisasi manual/batch import jadi jalan tengah sebelum integrasi penuh.

### 21.6 Nilai skor awal, pengurangan per kelas, threshold (Q61)

Ini wajib keputusan resmi tim K3/HRD, bukan tim engineering — tapi untuk mempercepat, diusulkan memakai nilai ilustratif Bab 13 sebagai baseline proposal dalam workshop sign-off: skor awal 100, pengurangan -10 s/d -20 tergantung kelas kritis, threshold notifikasi skor < 60. Workshop ini dijadikan gate wajib sebelum Sprint yang mengimplementasi Safety Scoring Engine (Bab 7.5), karena nilai ini murni SystemSetting (config), jadi tidak memblokir desain arsitektur — hanya memblokir go-live dengan angka yang benar.

### 21.7 Kebijakan retensi data snapshot (Q62)

Tidak perlu ada snapshot.

### 21.8 Nilai ConfirmThreshold/ClearThreshold/MinConfidenceThreshold (Q63)

Rekomendasi: mulai dengan nilai global (bukan per-zona/per-kelas) untuk V2.1 — ConfirmThresholdSeconds 3–5 detik, ClearThresholdSeconds beberapa detik lebih pendek dari Confirm (agar episode tidak mudah "menggantung"), MinConfidenceThreshold 0.5, sesuai contoh Bab 13. Opsi per-zona/per-kelas dibuka sebagai fase 2 — cukup pastikan skema SystemSetting/PpeClassDefinition sudah mendukung override granular nanti tanpa migrasi ulang.

### 21.9 Asumsi "track hilang sebelum Confirmed = tidak ada insiden"

Ya, dibiarkan seperti itu (tidak menghasilkan insiden).

### 21.10 Isi & penerima notifikasi rekap RecapLeadMinutes (Q65)

Rekomendasi: opsional dan dapat dinonaktifkan (default: aktif), bukan wajib mutlak — karena reset terjadwal berjalan harian untuk SEMUA karyawan (Bab 9.5), rekap wajib untuk setiap orang tiap hari berisiko jadi noise Telegram. Isi rekap: skor akhir sebelum reset + jumlah pelanggaran per kelas APD (persis field SafetyScorePeriodSummary, Bab 10.10) — jadi tidak perlu agregasi data baru. Penerima default: Supervisor langsung karyawan bersangkutan; HRD hanya menerima rekap agregat harian (bukan per-karyawan) agar tidak overload.

### 21.11 Urutan lengkap langkah pra-eksekusi reset & penanganan kegagalan (Q66)

(1) Buat SafetyScorePeriodSummary → (2) tulis ScoreResetLog berstatus "Started" sebelum mengubah skor (bukan sesudah) → (3) eksekusi reset skor ke InitialValue → (4) update ScoreResetLog jadi "Completed". Jika gagal di tengah: gunakan transaksi DB yang mencakup langkah 1–3 sekaligus (semua-atau-tidak-sama-sekali), dan job harus idempoten — cek dulu apakah sudah ada ScoreResetLog "Completed" untuk tanggal berjalan sebelum menjalankan reset lagi (sejalan dengan NFR Idempotensi Bab 8).

### 21.12 Zona waktu acuan ResetTimeOfDay (Q67)

Rekomendasi: WIB tetap untuk V2.1, karena scope saat ini tidak menyebut multi-lokasi pabrik lintas zona waktu (asumsi implisit single-site). Simpan nilai ResetTimeOfDay sebagai waktu lokal + timezone identifier eksplisit (mis. Asia/Jakarta) di config — bukan UTC offset mentah — supaya kalau nanti ekspansi multi-lokasi terjadi, tinggal menambah field zona per-lokasi tanpa mengubah logika job.

# 22. Lampiran — Ringkasan Stack Teknis yang Direuse dari V1

- Backend: .NET 8, ASP.NET Core Web API, Clean Architecture (Api / Application / Domain / Infrastructure).

- Basis Data: PostgreSQL via Entity Framework Core.

- Model AI Eksisting: yunet.onnx (deteksi wajah), sface.onnx (embedding & pencocokan wajah), dijalankan via Microsoft.ML.OnnxRuntime.

- Model AI Baru: Model deteksi APD berbasis YOLO, format .onnx — kelas dikonfigurasi kemudian.

- Pemrosesan Gambar: SixLabors.ImageSharp.

- Autentikasi: JWT Bearer (admin) + API Key/Device Token (skema Combined).

- Library Numerik: MathNet.Numerics (perhitungan kemiripan/cosine similarity pada pencocokan wajah).

- (Baru v2.1) Background Job: .NET BackgroundService/IHostedService untuk job reset terjadwal (opsi Hangfire bila dibutuhkan penjadwalan lebih kaya) — keputusan teknis final dibahas pada fase desain teknis.

# 23. Panduan Pengembangan .NET (Development Guidelines)

> *Bab ini merangkum Standard Operating Procedure (SOP) dan best practice teknis yang wajib diikuti tim engineering saat mengimplementasikan SAW (Safety Always Watch!) berbasis .NET Core WebAPI/MVC, agar codebase tetap scalable, highly maintainable, aman, dan selaras dengan standar industri. Seluruh proyek tim bootcamp — termasuk SAW — wajib mengikuti pola dan konfigurasi berikut.*

## 23.1 Standar Arsitektur

**Clean Architecture & Struktur N-Tier** — solusi dipisah menjadi layer yang saling terpisah (decoupled) untuk mencegah aplikasi menjadi kodebase monolitik "spaghetti":

- **Domain Layer** — entity inti, interface, dan aturan bisnis enterprise; wajib nol dependensi terhadap framework, database, atau library eksternal apa pun.
- **Application Layer** — logika bisnis, DTO, mapping, aturan validasi, dan interface service.
- **Infrastructure Layer** — hal-hal eksternal: DbContext, implementasi repository, filesystem, integrasi API pihak ketiga, dan layanan email.
- **Presentation / API Layer** — titik masuk aplikasi (Controller, Middleware, Views, atau `Program.cs`); hanya bertanggung jawab menangani HTTP request dan mengembalikan response yang sesuai.

**Prinsip SOLID** — setiap class harus memenuhi Single Responsibility; dependency selalu di-inject melalui abstraksi (interface), bukan implementasi konkret, memanfaatkan DI container bawaan .NET.

**Repository Design Pattern** — mengekspos `DbContext` secara langsung di Controller atau Application Service dilarang keras. Gunakan repository generik atau spesifik untuk mengenkapsulasi akses data — ini mengabstraksi provider database, memastikan mockability untuk testing, dan mensentralisasi optimasi query.

## 23.2 Alur Data & Validasi

Data yang masuk dan keluar aplikasi harus dikontrol ketat, strictly typed, dan divalidasi penuh sebelum menyentuh logika bisnis inti.

- **Data Transfer Object (DTO)** — entity database tidak boleh diekspos langsung ke client/frontend. Implementasikan Request DTO (menangkap payload masuk) dan Response DTO (membentuk data keluar) untuk mencegah kerentanan over-posting dan kebocoran skema database sensitif.
- **AutoMapper** — hindari mapping objek manual yang repetitif dan rawan error (mis. `dto.Name = entity.Name`); gunakan AutoMapper dengan mapping profile di Application layer untuk menerjemahkan Entity ke DTO dan sebaliknya.
- **FluentValidation** — hindari Data Annotation primitif (`[Required]`, `[StringLength]`) di domain model/DTO; jaga validasi tetap decoupled dengan validator class terpisah berbasis FluentValidation untuk aturan validasi bisnis yang kompleks.
- **FluentAPI Configuration** — jaga domain entity tetap bersih dari atribut spesifik database (`[Table]`, `[Key]`, `[ForeignKey]`); gunakan EF Core FluentAPI di method `OnModelCreating` — atau diisolasi dalam class `IEntityTypeConfiguration<T>` terpisah — untuk mendefinisikan skema tabel, primary/foreign key, cascade behavior, dan index constraint.

## 23.3 Standardisasi Response & Error Handling

Aplikasi enterprise harus berkomunikasi secara prediktif; client harus menerima skema JSON yang konsisten terlepas dari sukses atau gagalnya suatu operasi.

- **Pola `ServiceResult<T>`** — Application service tidak boleh melempar HTTP exception mentah atau menangani HTTP status code secara langsung. Sebagai gantinya, kembalikan wrapper generik seperti `ServiceResult<T>` yang memuat: `IsSuccess` (bool), `Data` (T — payload bila berhasil), `ErrorMessage` (string — deskripsi error bila gagal), dan `ValidationErrors` (list error per field input). Presentation/API layer adalah satu-satunya lapisan yang mengevaluasi wrapper ini dan memetakannya ke HTTP status code yang tepat (200 OK, 400 Bad Request, 404 Not Found, 401 Unauthorized, dst).
- **Global Exception Handling Middleware** — hilangkan try-catch berulang di seluruh controller/service. Implementasikan middleware exception handling global kustom: bila terjadi crash aplikasi/runtime yang tak tertangani, middleware menangkapnya, mencatat stack trace kritis secara aman, dan mengembalikan response JSON error yang bersih, tidak membocorkan detail internal, dan standar ke client (mis. 500 Internal Server Error).

## 23.4 Keamanan & Autentikasi

Keamanan diperlakukan sebagai layer arsitektural inti yang menjaga batas endpoint dan akses data.

- **JSON Web Token (JWT)** — untuk arsitektur WebAPI, autentikasi pengguna dilakukan secara stateless via JWT. Amankan endpoint dengan menerapkan atribut `[Authorize]`; konfigurasikan validasi token secara aman di `Program.cs`, memverifikasi issuer, audience, lifetime, dan signing key.
- **Role-Based Access Control (RBAC)** — lebih dari sekadar autentikasi dasar: implementasikan authorization policy berbasis User Roles atau Claims (mis. `[Authorize(Roles = "Admin, Manager")]`). Pastikan endpoint administratif tidak dapat disusupi atau dipanggil oleh pengguna yang tidak berwenang.

## 23.5 Observability & Dokumentasi

Aplikasi yang production-ready harus transparan, memudahkan developer memantau kesehatan sistem dan pihak ketiga berintegrasi tanpa panduan manual.

- **Structured Logging dengan Serilog** — hindari pernyataan `Console.WriteLine()` dasar. Implementasikan Serilog untuk mencapai logging terstruktur dan asinkron; konfigurasikan log dalam format JSON atau teks bersih, dengan output ke rolling physical file atau sink log manajemen terpusat eksternal. Catat event kritis, warning, dan state internal aplikasi beserta metadata kontekstual yang relevan.
- **Swagger / OpenAPI Documentation** — aktifkan dan perkaya Swagger UI di dalam WebAPI. Konfigurasikan Swagger agar mendukung otorisasi JWT Bearer Token secara native, memungkinkan tim manajemen dan QA mengautentikasi dan menguji endpoint yang terkunci langsung dari browser. Gunakan XML documentation comment untuk secara eksplisit mendeskripsikan behavior endpoint, parameter, dan payload response yang diharapkan.

## 23.6 Quality Assurance & Testing

Kepercayaan pada level enterprise sangat bergantung pada verifikasi kualitas kode otomatis dan suite unit test yang andal.

- **Unit Testing (xUnit / NUnit & Moq)** — tulis unit test yang terisolasi dan robust untuk seluruh logika bisnis yang berada di Application Service. Gunakan framework testing seperti xUnit atau NUnit, dipadukan dengan Moq untuk mengisolasi dependency dan mock repository, external client, atau mailing framework. Upayakan coverage komprehensif pada komputasi bisnis inti dan edge case.
- **Automated Code Quality Tools** — pastikan seluruh solusi compile tanpa warning berat atau pelanggaran arsitektur. Tim wajib menjalankan kode melalui static code analysis tools (seperti JetBrains Qodana atau ReSharper) untuk secara otomatis mendeteksi, menandai, dan memperbaiki code smell, penyimpangan naming convention, dependency tak terpakai, atau potensi memory leak sebelum fase code review atau deployment.

## 23.7 Praktik Terbaik Database

Database harus dikelola secara programatik, memperlakukan skema data persis seperti source code.

- **EF Core Migrations** — jangan mengubah skema secara manual langsung di server database. Seluruh perubahan struktural (tabel, kolom, index) wajib dilacak, direview, dan diterapkan menggunakan Entity Framework Core Migrations.
- **Soft Delete & Audit Interceptor** — jangan pernah melakukan hard-delete permanen terhadap record dari tabel database transaksional. Implementasikan mekanisme auditing (mis. base entity atau EF Core `SaveChanges` Interceptor) yang otomatis memperbarui properti audit seperti `CreatedAt`, `CreatedBy`, `UpdatedAt`, dan `UpdatedBy`. Untuk penghapusan, gunakan flag boolean `IsDeleted` bernilai true, dan manfaatkan EF Core Global Query Filter agar item yang soft-deleted otomatis tersaring dari query aplikasi normal.

## 23.8 Performa & Skalabilitas

Aplikasi harus tetap sangat responsif dan menjaga memory footprint yang rendah, bahkan di bawah beban kerja produksi yang intensif dan konkuren.

- **Pemrograman Asinkron (`async`/`await`)** — untuk mencegah thread starvation dan memaksimalkan throughput hardware, tulis kode I/O yang sepenuhnya non-blocking dan asinkron. Setiap query database, panggilan jaringan eksternal, atau operasi file-system wajib memanfaatkan `async` dan `await`. Hindari pemanggilan blok sinkron seperti `.Result`, `.Wait()`, atau `.GetAwaiter().GetResult()`, karena dapat memicu deadlock thread langsung di lingkungan production.
- **Pagination, Filtering, & Sorting** — jangan pernah mengambil atau mengembalikan koleksi database yang tidak dipaginasi secara penuh ke client. Setiap endpoint yang mengekspos daftar record wajib secara eksplisit menuntut dan menerapkan parameter metadata paginasi (mis. `PageNumber`, `PageSize`). Terapkan logika filtering dan sorting secara dinamis menggunakan ekspresi `IQueryable` agar manipulasi data dieksekusi secara efisien di level server database sebelum menyentuh memori sistem.
- **Strategi Caching** — perkenalkan strategi caching yang eksplisit. Manfaatkan In-Memory Caching standar atau distributed caching (mis. Redis) untuk lookup, master list, atau data konfigurasi yang sering diakses namun jarang dimodifikasi. Ini melewati round-trip jaringan database yang redundan dan menekan latensi endpoint hingga ke level milidetik satu digit.

## 23.9 Konfigurasi & Manajemen Environment

Aplikasi harus mengikuti gaya konfigurasi "twelve-factor app" yang aman, yang menyederhanakan transisi lintas berbagai environment.

- **Secure Secret Management** — kredensial infrastruktur, connection string database, JWT secret key, atau API key pihak ketiga sama sekali tidak boleh di-hardcode di dalam file source code. Gunakan `appsettings.json` hanya untuk properti struktural yang tidak sensitif. Untuk pengembangan di mesin lokal, manfaatkan .NET Secret Manager atau environment variable lokal.
- **CI/CD Pipeline Readiness** — bangun codebase agar sepenuhnya kompatibel dengan sistem build otomatis. Pastikan hook konfigurasi memungkinkan continuous integration server (seperti Jenkins) melakukan checkout repository, me-restore package secara otomatis, menjalankan automated code style check, mengeksekusi unit test suite, dan mengganti token environment secara dinamis selama build lokal atau packaging artifact otomatis.

# 24. Riwayat Revisi Dokumen

|             |                   |                                                                                                                                                                                                                                                                                                                                                                        |
|-------------|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Versi**   | **Tanggal**       | **Perubahan**                                                                                                                                                                                                                                                                                                                                                          |
| 2.0.0-draft | 5 September 2026  | Draf awal PRD V2 SAW (Safety Always Watch!) (evolusi dari NETFace Attendance).                                                                                                                                                                                                                                                                                        |
| 2.1.0-draft | 5 September 2026  | Menambahkan spesifikasi Violation Stabilization State Machine (Confirm/Clear) dan Score Reset Engine (terjadwal + manual). Merevisi Bab 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 13, 14, 15, 17, 18, 19, 20, 21, 22 untuk mengakomodasi kedua fitur baru tersebut. Menambahkan Bab 12.1 berisi dataset sumber Roboflow Universe untuk model YOLO APD dan usulan pemetaan kelas. |
| 2.2.0-draft | 7 September 2026  | Rebranding nama proyek dari NETGuard menjadi **SAW (Safety Always Watch!)** pada judul dan riwayat dokumen. Menambahkan Bab 23 — Panduan Pengembangan .NET (Development Guidelines) — berisi SOP & best practice wajib tim engineering (Clean Architecture/N-Tier, DTO & FluentValidation, pola `ServiceResult<T>` & global exception handling, JWT & RBAC, Serilog & Swagger, unit testing & static analysis, EF Core migrations & soft delete, async/pagination/caching, secure secret management & CI/CD). Riwayat Revisi Dokumen berpindah menjadi Bab 24. Merapikan format Bab 21 (Pertanyaan Terbuka) menjadi sub-bagian bernomor 21.1–21.12.                        |

*Dokumen ini adalah draf PRD V2.2 dan dimaksudkan sebagai dasar diskusi bersama stakeholder (Admin/Safety, HRD, Engineering) sebelum masuk ke tahap desain teknis rinci.*
