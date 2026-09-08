---
title: Backend Foundation & Employee Directory
labels: [spec]
status: draft
---

# Tujuan
Membangun fondasi awal (walking skeleton) backend SafetyAlwaysWatchAPI menggunakan Clean Architecture (.NET 8) sekaligus mengimplementasikan fitur pertama: Direktori Karyawan & Skor Keamanan.

# Scope
- Penghapusan project template API yang ada dan pembuatan ulang 4 project layer (Domain, Application, Infrastructure, Api) dengan namespace `SafetyAlwaysWatch.*`.
- Setup database PostgreSQL via Entity Framework Core.
- Konfigurasi logging (Serilog), dokumentasi API (Swagger + XML docs), dan CORS.
- Implementasi otentikasi JWT dasar dan RBAC (Role-Based Access Control).
- Implementasi entitas dasar: `Employee`, `Department`, dan `SafetyScoreLedger`.
- Full CRUD API untuk Karyawan (`GET`, `POST`, `PUT`, `DELETE`).
- Inisialisasi otomatis Skor Keamanan (SafetyCreditScore) pada pembuatan Karyawan.
- Pagination, sorting, dan filtering untuk Endpoint Direktori Karyawan.

# Out of Scope
- Endpoint Monitoring/Stream dan integrasi Edge Device/Inference Worker.
- CRUD endpoint untuk entitas `Department` (hanya via seed data pada rilis ini).
- Manajemen Danger Zones dan PPE Classes.
- Notifikasi Telegram.
- Penyimpanan file snapshot gambar.

# Perilaku Utama (Sesuai Bab 23 PRD & Kesepakatan)
- **Clean Architecture**: Pemisahan tegas antara `Domain`, `Application`, `Infrastructure`, dan `Api`.
- **Repository Pattern**: Penggunaan Generic `IRepository<T>` yang di-extend untuk repositori spesifik per entitas.
- **DTO & Manual Mapping**: Penggunaan manual mapping dari Entity ke DTO dan sebaliknya (AutoMapper tidak digunakan untuk menghindari masalah lisensi, instruksi override PRD Bab 23).
- **FluentValidation**: Validasi bisnis dipisah menggunakan FluentValidation, tidak menggunakan Data Annotations.
- **ServiceResult<T>**: Digunakan untuk return type layer Application, dengan dukungan property `ValidationErrors` berformat `Dictionary<string, string[]>` dan factory methods.
- **JWT + RBAC**: Autentikasi dengan token JWT. Mendukung 3 peran utama (Admin, Supervisor, HRD). Terdapat endpoint dasar `/api/auth/login` dan `/api/auth/change-password`.
- **Serilog**: Sink ke Console dan Rolling file untuk keperluan development.
- **Swagger**: Aktif dengan integrasi JWT Bearer Authentication dan XML Documentation.
- **EF Core Migrations**: Pendekatan Code-First dengan FluentAPI (`IEntityTypeConfiguration<T>`) untuk mendefinisikan schema dan seeding awal.
- **Soft Delete**: Entitas menggunakan kolom `IsDeleted`. Soft-delete ditangani melalui EF Core interceptors secara otomatis.
- **Audit Logging Base Entity**: Menggunakan kolom `CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy` (tipe `Guid?`).
- **Pagination via IQueryable**: Response di-wrap dalam bentuk envelope dengan meta-data `pageNumber`, `pageSize`, `totalCount`, dan `totalPages`.
- **Testing**: Centralized test project (`SafetyAlwaysWatch.Tests`) menggunakan NUnit.

# Edge Cases dan Aturan Bisnis
- **(Illustrative) Safety Status Threshold**: Keputusan menggunakan 2-state (Aman/Kritis) sudah ditetapkan, tetapi batas konkrit `EscalationThreshold` (contoh: 60) dan `InitialValue` (contoh: 100) masih bersifat illustrative dan bisa disesuaikan via `SystemSetting` seiring validasi HRD.
- **Skor Otomatis**: Karyawan yang baru didaftarkan secara default langsung mendapatkan skor `InitialValue` (contoh 100). Catatan inisialisasi ini wajib masuk ke `SafetyScoreLedger` sebagai `ChangeType` = `Initialization`.
- **(Illustrative) Akses Scoping Supervisor**: 
  - Pada endpoint direktori karyawan (`GET /api/employees`), Supervisor dapat melihat **semua** karyawan (tanpa batasan scope). 
  - Scoping untuk Supervisor diikat secara struktural melalui relasi dengan Zona (`DangerZone.SupervisorIds`), BUKAN melalui atasan langsung (hierarki organisasi/departemen). Batasan ini baru akan diimplementasikan pada fitur pelanggaran dan monitoring nanti.

# Modul / Seam Terlibat
1. **Domain**:
   - `Employee`: `Id`, `EmployeeCode`, `FullName`, `Role` (Enum), `Status` (Enum), `PasswordHash`, `RequiresPasswordChange`, `SafetyCreditScore` (int), `SupervisorId` (Guid? untuk rekap, bukan scoping dashboard), `DepartmentId`, koleksi `FaceEmbeddings`.
   - `Department`: `Id`, `Name`.
   - `SafetyScoreLedger`: `Id`, `EmployeeId`, `ChangeAmount`, `ScoreBefore`, `ScoreAfter`, `ChangeType` (Enum: Violation, Reset, Initialization), `Description`, `Timestamp`.
   - `SystemSetting`: `Key` (PK String), `Value`.
   - Enums: `EmployeeRole`, `EmployeeStatus`, `LedgerChangeType`.
2. **Application**:
   - DTOs untuk Karyawan dan Pagination.
   - Interfaces untuk Repository (`IRepository<T>`, `IEmployeeRepository`).
   - Command/Query Handlers atau Services untuk manajemen Karyawan.
   - Validators (FluentValidation).
3. **Infrastructure**:
   - `AppDbContext` (EF Core) dan FluentAPI Configs.
   - Implementasi Repository.
   - Interceptor untuk Soft Delete dan Audit properties.
   - Initial Seed Data untuk Admin, 3 Department, dan `SystemSetting`.
4. **Api**:
   - `EmployeesController`: GET (list), GET (detail), POST, PUT, DELETE.
   - `AuthController`: Login, ChangePassword.
   - Swagger configs, Serilog bootstrap, CORS rules.

# Acceptance Criteria
1. **Fondasi Arsitektur**:
   - `dotnet build` berjalan sukses di semua project.
   - `dotnet test` berjalan sukses minimal dengan satu NUnit test.
   - Swagger UI dapat diakses secara lokal dan mendukung login JWT.
   - Migrasi EF Core dapat digenerate dan di-apply ke database PostgreSQL lokal tanpa error.
2. **Direktori Karyawan**:
   - Endpoint `POST /api/employees` berhasil membuat karyawan baru, menghasilkan token `SafetyCreditScore` awal, dan menciptakan entri log di tabel Ledger.
   - Endpoint `GET /api/employees` mendukung parameter `search` (mencocokkan nama dan kode), memfilter berdasarkan `departmentId` dan computed `safetyStatus`, melakukan sorting (`fullName`, `employeeCode`, `safetyCreditScore`, `department`), dan paginasi (mengembalikan format Envelope).
   - Endpoint `GET /api/employees/{id}` mengembalikan riwayat skor (`recentScoreHistory` dibatasi max 10 entri) dan info read-only untuk status `enrollment`.
   - User dengan role "HRD" dan "Supervisor" dapat memanggil `GET /api/employees` dengan sukses (menerima respons 200).
   - Update dan delete karyawan mematuhi struktur entitas dan pola soft-delete.
