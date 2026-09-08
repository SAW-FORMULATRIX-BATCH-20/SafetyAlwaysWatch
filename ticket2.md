## Parent #31
## Blocked by #34

**Acceptance Criteria:**
- Repository pattern, DTO+AutoMapper, FluentValidation, ServiceResult<T>, XML doc di Swagger.
- GET /api/employees dengan search, filter departemen, filter SafetyStatus, sorting, pagination via IQueryable (bukan filter di memori).
- GET /api/employees/{id} dengan departemen, Supervisor Area, Skor Keselamatan, Ambang Eskalasi, status enrollment read-only, ringkasan audit SafetyScoreLedger.
- Edge case (Eksplisit): SafetyStatus 2-state dulu (Aman/Kritis) bukan 3-tier.
- Edge case (Eksplisit): Endpoint hanya MELAPORKAN status enrollment yang sudah ada, tidak boleh mensimulasikan/mengklaim enrollment berhasil.
- Edge case (Eksplisit): RBAC ditegakkan di server. Supervisor Area di-scope by zona penugasan via DangerZone.SupervisorIds (BUKAN departemen, BUKAN Employee.SupervisorId).
- Edge case (Eksplisit): GET /api/employees tidak discoping di endpoint ini, hanya endpoint zona-scoped seperti violations/monitoring yang discoping.
- Edge case (Eksplisit): HRD ditolak 403 di endpoint monitoring/stream manapun.
