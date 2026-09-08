## Parent #31
## Blocked by: Tidak ada

**Acceptance Criteria:**
- 4 layer terpisah (Domain nol dependensi eksternal).
- AppDbContext ke PostgreSQL (connection string dari env var/.NET Secret Manager, bukan hardcoded).
- Base entity dengan audit interceptor (CreatedAt/By, UpdatedAt/By) + soft delete (IsDeleted + Global Query Filter).
- ServiceResult<T> sebagai kontrak return Application service.
- Global exception middleware.
- JWT Bearer + RBAC.
- Serilog.
- Swagger dengan otorisasi JWT dari browser.
- Project test xUnit+Moq dengan minimal satu test hijau.
- Minimal satu EF Core migration awal (dotnet ef database update berhasil).
- `dotnet build`/test/format hijau di root solution.
- TANPA fitur bisnis baru di bagian fondasi.
