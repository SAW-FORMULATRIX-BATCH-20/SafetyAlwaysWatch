## Parent
#89

## What to build
Implement the foundation requirements for the realtime pipeline by addressing gaps and bugs in the existing codebase:
1. Create the `PpeClassDefinition` entity (Id, YoloClassIndex, DisplayName, IndicatesCompliance) and its EF Core migration, then seed it. This fixes the gap from TK-06-BE where `RequiredPpeClassIds` referenced non-existent entities.
2. Fix non-atomic writes in `ViolationStabilizationService.ProcessDetectionAsync` by either updating the generic `Repository` to support Unit of Work or wrapping the service calls in a transaction.
3. Cache `SystemSetting` queries in `ViolationStabilizationService` using `IMemoryCache` (with a 30s TTL) to prevent N+1 DB queries on every detection frame.
4. Fix `ViolationCandidateState.UpdateCompliant()` so that a compliant frame during `Candidate` status deletes the candidate entirely (flicker suppression) rather than incorrectly setting `LastCompliantAt`.
5. Register `ISafetyScoringService` and `IViolationStabilizationService` in the dependency injection container in `Program.cs`.

## Acceptance criteria
- [ ] `PpeClassDefinition` entity exists and is seeded via EF Core migrations.
- [ ] Multiple `SaveChanges` calls in `ViolationStabilizationService` are replaced with a single atomic transaction.
- [ ] `SystemSetting` queries in the stabilization service are cached via `IMemoryCache`.
- [ ] `ViolationCandidateState` is deleted/aborted if a compliant frame arrives while in `Candidate` status.
- [ ] `ISafetyScoringService` and `IViolationStabilizationService` can be resolved from DI.

## Blocked by
- None (can start immediately)
