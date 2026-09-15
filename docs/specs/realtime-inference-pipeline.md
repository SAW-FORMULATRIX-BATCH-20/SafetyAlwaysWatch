---
title: "TK-07-BE & TK-08-BE: Realtime Inference Pipeline & Identity Resolution"
labels: [spec, ready-for-agent]
parent-stories: [US-07, US-08]
status: ready
---

## Problem Statement

SAW's live monitoring screen cannot yet display real-time detections because the backend has no contract for receiving inference results, no mechanism for pushing processed events to the frontend, and no integration point for matching a detected face to a registered Employee. The monitoring pipeline—from camera frame to bounding-box overlay—does not exist.

Additionally, five pre-existing bugs in the codebase block or degrade the pipeline's correctness: a missing `PpeClassDefinition` entity, non-atomic writes in the Violation Stabilization Service, two missing DI registrations, a per-call SystemSettings query in a hot path, and an incorrect Candidate→compliant state transition.

## Solution

Build the backend half of the realtime monitoring pipeline. An Inference Worker (simulated for MVP) sends processed detection payloads to a REST ingest endpoint. A new orchestrator service coordinates identity resolution, zone membership, PPE compliance, and violation stabilization. The orchestrator pushes the fully processed Detection Frame Output to connected monitoring frontends through a SignalR Hub. A predefined simulation scenario exercises the entire lifecycle (zone entry → PPE violation → Candidate → Confirmed → Clearing → Cleared).

Concurrently, fix the five identified bugs so the pipeline runs on a sound foundation.

## User Stories

1. As an Operator, I want to receive live detection events for a specific camera on my monitoring screen, so that I see real-time bounding boxes and PPE status without refreshing.
2. As an Operator, I want each detected person labeled with their name or the exact label **Unknown**, so that I can immediately tell whether the person is a registered Employee.
3. As an Operator, I want to see each detected person's current Safety Score alongside their bounding box, so that I can assess their compliance standing at a glance.
4. As an Operator, I want to subscribe to a specific camera's detection stream, so that I only receive events relevant to the camera I am monitoring.
5. As an Operator, I want the monitoring connection to automatically reconnect after a network interruption, so that I do not miss detections during transient failures.
6. As a Safety Officer, I want each detected person's PPE items listed with worn/not-worn status, so that I can see exactly which PPE is being violated.
7. As a Safety Officer, I want the system to evaluate whether a detected person is inside a Hazardous Zone and which required PPE they are missing, so that only relevant non-compliance reaches the violation pipeline.
8. As a Safety Officer, I want transient detections with confidence below the configured threshold ignored entirely, so that noisy model output does not pollute the monitoring feed.
9. As a Backend Developer, I want a well-defined Ingest Frame DTO contract, so that the real Inference Worker can be implemented independently against a stable API.
10. As a Backend Developer, I want the inference ingest endpoint secured with an API Key, so that only authorized Inference Workers can submit detection frames.
11. As a Backend Developer, I want a mock simulator that publishes a predefined detection scenario on demand, so that the frontend team can develop overlays without a real Inference Worker.
12. As a Backend Developer, I want the Identity Resolver to cache a matched Employee per track and retry while Unknown, so that face matching overhead is bounded and late matches are not lost.
13. As a Backend Developer, I want an explicit `lostTrackIds` field in the ingest payload, so that the backend can deterministically handle track loss without maintaining frame-to-frame diff state.
14. As a Backend Developer, I want the Violation Stabilization Service's writes wrapped in a UnitOfWork transaction, so that a Telegram failure cannot leave the database in an inconsistent state.
15. As a Backend Developer, I want SystemSettings cached with a short TTL in the hot detection path, so that the stabilization service does not query the database on every detection call.
16. As a Backend Developer, I want a compliant frame during Candidate status to delete the ViolationCandidateState entirely, so that brief flickers are correctly treated as non-events rather than accumulating stale state.
17. As a Backend Developer, I want `PpeClassDefinition` to exist as a first-class entity with migration and CRUD, so that zone PPE requirements reference a real table and the compliance evaluator can map YOLO class indices to domain concepts.
18. As a Backend Developer, I want `ISafetyScoringService` and `IViolationStabilizationService` registered in DI, so that the orchestrator can resolve them at runtime.

## Implementation Decisions

### Architecture

- **Transport: Inference Worker → .NET API**: REST/HTTP `POST /api/monitoring/stream/{cameraId}`. Chosen over gRPC/WebSocket for simplicity at the MVP scale of 2 cameras. The Inference Worker authenticates with an API Key header, reusing the V1 device token pattern.
- **Transport: .NET API → Frontend**: ASP.NET Core SignalR Hub at `/hubs/monitoring`. One Hub with group-per-camera. Clients call `JoinCamera(cameraId)` / `LeaveCamera(cameraId)`. Server pushes via `ReceiveDetectionFrame`. Chosen for native reconnection support and WebSocket with automatic fallback.
- **Pipeline Orchestration**: New `IInferenceIngestionService` with a single `ProcessFrameAsync(IngestFrameDto)` method. The controller validates the payload, calls the orchestrator, and returns `202 Accepted`. The orchestrator loops detections, calls sub-services, and pushes the result via `IHubContext<MonitoringHub>`. This keeps the controller thin and the pipeline testable.
- **Inference Worker Scope**: Contract + Mock Simulator only. No real AI inference. The simulator is a `BackgroundService` triggered by `POST /api/monitoring/simulate/start` and stopped by `POST /api/monitoring/simulate/stop`. It publishes a predefined scenario: 2–3 tracked persons, one enters a Hazardous Zone without a required PPE item, triggering the full Candidate → Confirmed → Clearing → Cleared lifecycle.

### Ingest Frame DTO (Inference Worker → .NET API)

```csharp
// One POST per camera frame — contains all detected persons
public class IngestFrameDto
{
    public Guid CameraId { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public byte[]? FrameJpeg { get; set; }          // For snapshot capture
    public List<DetectedPersonDto> Detections { get; set; }
    public List<string> LostTrackIds { get; set; }   // Explicit track loss
}

public class DetectedPersonDto
{
    public string TrackId { get; set; }
    public BoundingBoxDto BoundingBox { get; set; }
    public float[]? FaceEmbedding { get; set; }      // 128-dim SFace vector
    public Guid? SimulatedEmployeeId { get; set; }   // Mock shortcut only
    public List<PpeDetectionDto> PpeDetections { get; set; }
}

public class BoundingBoxDto
{
    public double X { get; set; }                    // Normalized 0–1
    public double Y { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
}

public class PpeDetectionDto
{
    public int YoloClassIndex { get; set; }
    public double Confidence { get; set; }
}
```

### Detection Frame Output DTO (.NET API → Frontend via SignalR)

```csharp
public class DetectionFrameOutput
{
    public Guid CameraId { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public List<DetectedPersonOutput> Detections { get; set; }
}

public class DetectedPersonOutput
{
    public string TrackId { get; set; }
    public BoundingBoxDto BoundingBox { get; set; }
    public Guid? EmployeeId { get; set; }            // null = Unknown
    public string DisplayName { get; set; }          // "Unknown" if unmatched
    public double? CurrentSafetyScore { get; set; }  // null for Unknown
    public bool IsIdentified { get; set; }
    public List<PpeItemOutput> PpeItems { get; set; }
    public bool IsInZone { get; set; }
    public string? ZoneName { get; set; }
    public string ComplianceStatus { get; set; }     // Compliant|Candidate|Confirmed|Clearing|Cleared
    public List<string> MissingPpeClassNames { get; set; }
}

public class PpeItemOutput
{
    public string PpeClassName { get; set; }
    public bool IsWorn { get; set; }
    public double Confidence { get; set; }
}
```

### Identity Resolution (TK-08-BE)

- **New interface**: `IIdentityResolverService` in Application layer with `Task<IdentityResult> ResolveAsync(string trackId, float[]? faceEmbedding, Guid? simulatedEmployeeId, CancellationToken ct)`. Returns `IdentityResult` containing `EmployeeId?`, `DisplayName`, `CurrentSafetyScore?`, and `IsIdentified`.
- **Cache strategy**: Resolve-until-matched. While a track's identity is Unknown, retry on every frame that includes a face embedding. Once matched to an Employee, cache the result for the lifetime of that track. This balances compute cost with accuracy for late face detections.
- **DI scoping**: `IIdentityResolverService` is Scoped (accesses Scoped repositories). The cache itself is a Singleton `ITrackIdentityCache` backed by `ConcurrentDictionary<string, TrackIdentity>` with TTL-based eviction. Tracks are evicted when they appear in `LostTrackIds` or when TTL expires.
- **Face matching**: For MVP, when `SimulatedEmployeeId` is set, the resolver returns that employee's data directly. The real contract accepts a 128-dim SFace embedding and performs cosine similarity matching against all active `EmployeeFaceEmbedding` records. The matching method will be added to `IFaceRecognitionService` as `Task<Guid?> MatchEmbeddingAsync(float[] embedding, double threshold)`.
- **Unknown handling**: When identity cannot be resolved, output uses `EmployeeId = null`, `DisplayName = "Unknown"`, `CurrentSafetyScore = null`, `IsIdentified = false`. Per PRD FR-14, Unknown events are recorded but never affect any Employee's Safety Score.

### Prerequisite: PpeClassDefinition Entity (TK-06-BE Gap)

- **New entity**: `PpeClassDefinition` with `Id` (Guid), `YoloClassIndex` (int), `DisplayName` (string), `IndicatesCompliance` (bool), matching PRD Bab 10.2.
- **Migration**: Add `PpeClassDefinitions` table. Seed initial PPE classes from the dataset in PRD Bab 12.1.
- **Impact**: The compliance evaluator within the orchestrator maps `PpeDetectionDto.YoloClassIndex` to `PpeClassDefinition` records, then compares detected PPE against `HazardousZone.RequiredPpeClassIds` to determine missing PPE.

### Bug Fixes

1. **Non-atomic writes in ViolationStabilizationService**: The orchestrator wraps the entire frame processing in an `IUnitOfWork` transaction (`BeginTransactionAsync` / `CommitAsync` / `RollbackAsync`). Individual `Repository.AddAsync` / `UpdateAsync` calls within the transaction do not call `SaveChangesAsync` independently — the commit happens once at the orchestrator boundary. This requires a change to the Repository pattern to support transactional mode, or the orchestrator calls `IUnitOfWork` explicitly around the stabilization calls.
2. **Missing DI registrations**: `ISafetyScoringService` → `SafetyScoringService` and `IViolationStabilizationService` → `ViolationStabilizationService` added to DI configuration.
3. **SystemSettings N+1 query**: Add `IMemoryCache`-based caching for `SystemSetting` values with a 30-second TTL, injected into `ViolationStabilizationService`. Batch optimization flagged as TODO for scale.
4. **Candidate + compliant = delete**: Modify `ViolationCandidateState.UpdateCompliant()` to throw or signal deletion when `Status == Candidate`. The orchestrator (or `ViolationStabilizationService`) deletes the `ViolationCandidateState` row when a compliant frame arrives during Candidate status, treating it as a flicker abort. Only `Confirmed → Clearing` transition is valid on compliance.
5. **PpeClassDefinition entity**: Create the missing entity, migration, configuration, and basic endpoints as described above.

### Pipeline Flow (End-to-End)

```
Inference Worker / Simulator
  → POST /api/monitoring/stream/{cameraId}  [API Key header]
  → MonitoringController (validates payload, returns 202 Accepted)
  → IInferenceIngestionService.ProcessFrameAsync(dto)
      ├── IUnitOfWork.BeginTransactionAsync()
      ├── For each lostTrackId in dto.LostTrackIds:
      │     ├── IViolationStabilizationService.HandleLostTrackAsync(trackId)
      │     └── ITrackIdentityCache.Evict(trackId)
      ├── For each detection in dto.Detections:
      │     ├── IIdentityResolverService.ResolveAsync(trackId, embedding?)
      │     │     └── ITrackIdentityCache lookup → if miss & embedding present:
      │     │           └── IFaceRecognitionService.MatchEmbeddingAsync(embedding)
      │     │           └── DB: Employee lookup for DisplayName + SafetyCreditScore
      │     │           └── Cache result in ITrackIdentityCache
      │     ├── Zone membership check (bbox intersection vs HazardousZone geometry)
      │     ├── PPE compliance evaluation:
      │     │     └── Map YoloClassIndex → PpeClassDefinition
      │     │     └── Compare detected PPE against zone RequiredPpeClassIds
      │     │     └── Determine missing PPE and compliance boolean
      │     └── IViolationStabilizationService.ProcessDetectionAsync(...)
      │           └── (state machine: Candidate → Confirmed → Clearing → Cleared)
      │           └── On Confirmed: create ViolationEvent, deduct score, send Telegram
      ├── IUnitOfWork.CommitAsync()
      └── IHubContext<MonitoringHub>
            .Clients.Group($"Camera_{cameraId}")
            .SendAsync("ReceiveDetectionFrame", outputDto)
```

### SignalR Hub Design

- **Hub class**: `MonitoringHub` at route `/hubs/monitoring`
- **Client→Server methods**:
  - `JoinCamera(string cameraId)` — adds the connection to group `Camera_{cameraId}`
  - `LeaveCamera(string cameraId)` — removes the connection from group
- **Server→Client methods**:
  - `ReceiveDetectionFrame(DetectionFrameOutput output)` — pushed per processed frame
- **CORS**: The existing `AllowAll` CORS policy must be updated for SignalR (`.AllowCredentials()` instead of `.AllowAnyOrigin()`), or a specific origin policy must be configured.
- **No authentication on Hub for MVP**: The monitoring Hub is read-only; the ingest endpoint is API Key-protected. Hub authentication is flagged as a future enhancement.

### Simulator Design

- **Start**: `POST /api/monitoring/simulate/start` — starts a `BackgroundService` that loops through a predefined scenario at ~1 FPS
- **Stop**: `POST /api/monitoring/simulate/stop` — cancels the background service
- **Scenario**: 2–3 tracked persons with predefined TrackIds. One person enters a Hazardous Zone, is detected without required PPE, remains non-compliant past `ConfirmThresholdSeconds`, gets confirmed, then becomes compliant and clears after `ClearThresholdSeconds`. One person has a `SimulatedEmployeeId` (identified), another does not (Unknown). At least one track is lost mid-scenario.
- **The simulator calls the same `POST /api/monitoring/stream/{cameraId}` endpoint internally**, exercising the full pipeline including API Key validation, orchestration, and SignalR delivery.

## Testing Decisions

### Test Seam

The primary test seam is **`IInferenceIngestionService.ProcessFrameAsync(IngestFrameDto)`**. This is the single entry point that orchestrates the entire pipeline. Testing at this seam verifies the end-to-end behavior of detection processing without depending on HTTP transport or SignalR connections.

### What Makes a Good Test

Tests should verify **external behavior** (what goes into the orchestrator and what comes out or what side-effects are triggered), not implementation details (internal method call order, private field states). A test should read as a scenario: "given this detection frame, the system should produce this output and these side-effects."

### Test Cases

1. **Frame with no detections**: ProcessFrameAsync returns an empty output, no sub-services are called.
2. **Single detection, not in zone**: The output shows `IsInZone = false`, `ComplianceStatus = "Compliant"`, no violation processing occurs.
3. **Single detection, in zone, all PPE present**: Compliant status, no violation candidate created.
4. **Single detection, in zone, missing PPE, below confidence threshold**: Detection is ignored per FR-45.
5. **Single detection, in zone, missing PPE, above confidence threshold**: ViolationStabilizationService.ProcessDetectionAsync is called with correct arguments.
6. **Identity resolution — matched Employee**: Output contains the Employee's name and current Safety Score, `IsIdentified = true`.
7. **Identity resolution — Unknown**: Output contains `DisplayName = "Unknown"`, `EmployeeId = null`, `IsIdentified = false`, `CurrentSafetyScore = null`.
8. **Identity resolution — cache hit**: Second frame for same TrackId does not call MatchEmbeddingAsync again after successful match.
9. **Identity resolution — retry while Unknown**: Second frame for same TrackId with new embedding retries matching.
10. **Lost track handling**: `LostTrackIds` triggers HandleLostTrackAsync and cache eviction.
11. **Compliant frame during Candidate**: ViolationCandidateState is deleted, no ViolationEvent created.
12. **SignalR output shape**: The output DTO pushed to IHubContext matches the expected DetectionFrameOutput schema.
13. **UnitOfWork atomicity**: When ViolationStabilizationService fails mid-transaction, all changes are rolled back.

### Prior Art

Existing test style follows `ViolationStabilizationServiceTests.cs`: NUnit `[TestFixture]`, Moq for interfaces, `MockQueryable.Moq` for IQueryable mocking, in-memory lists simulating repositories. The new tests should follow this pattern.

## Out of Scope

- Real Inference Worker implementation (YOLO, person tracking, actual camera feed processing)
- Real YuNet/SFace face detection and embedding extraction in the matching pipeline (the `DummyFaceRecognitionService` remains for enrollment; matching uses cosine similarity against stored embeddings but the embedding extraction is simulated)
- Frontend implementation (TK-07-FE, TK-08-FE)
- Violation Snapshot Buffer and Telegram notification (TK-12-BE — uses existing `ITelegramEscalationService`)
- Zone compliance evaluation logic (TK-09-BE — mentioned in the pipeline flow but the detailed zone geometry check and PPE compliance evaluator are a separate task)
- Hub authentication and authorization
- Horizontal scaling of the inference ingest endpoint
- Per-zone or per-PPE-class violation thresholds (future phase per PRD Bab 21.8)

## Further Notes

- **ADR-0001 (Do not persist violation snapshots)** remains respected: the `FrameJpeg` field in `IngestFrameDto` is passed through to the Violation Stabilization Service's `frameSnapshot` parameter for in-memory Telegram delivery only. No byte array is persisted to the database.
- **ADR-0002 (Preserve zones referenced by audit history)** is unaffected by this spec.
- The CORS configuration must change for SignalR: `AllowAnyOrigin()` is incompatible with SignalR's `AllowCredentials()` requirement when using WebSocket transport. A specific origin list or development wildcard with credentials must be configured.
- The `SimulatedEmployeeId` field on `DetectedPersonDto` should be stripped or ignored outside development environments. Consider a build-time `#if DEBUG` or a configuration flag.
- The `ITrackIdentityCache` TTL should be configurable via `SystemSetting` (e.g., `IdentityResolver:TrackCacheTtlSeconds`, default 300).
