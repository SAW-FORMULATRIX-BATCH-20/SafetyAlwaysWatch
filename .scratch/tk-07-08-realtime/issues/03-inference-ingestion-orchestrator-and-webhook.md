## Parent
#89

## What to build
Create the orchestrator service and REST endpoint to receive and process inference frames:
1. Implement `IInferenceIngestionService.ProcessFrameAsync(IngestFrameDto)` which loops through the frame's detections.
2. For each detection, orchestrate: `IIdentityResolverService` (resolve face), zone membership check (bounding box intersection), PPE compliance evaluation (mapping YOLO class index to `PpeClassDefinition`), and `IViolationStabilizationService` (state machine updates).
3. Handle lost tracks by evicting them from the identity cache and notifying the stabilization service.
4. Wrap the entire frame processing in an `IUnitOfWork` transaction boundary.
5. Create `MonitoringController` with a `POST /api/monitoring/stream/{cameraId}` endpoint that accepts the `IngestFrameDto`, secured via API Key in the header.
6. Write unit tests for `IInferenceIngestionService` as the primary test seam for the pipeline.

## Acceptance criteria
- [ ] Orchestrator correctly processes detections, resolves identities, checks zones, and evaluates PPE compliance.
- [ ] Lost tracks in the payload trigger cache eviction and stabilization state updates.
- [ ] `POST /api/monitoring/stream/{cameraId}` receives the payload and returns `202 Accepted` using API Key authentication.
- [ ] Unit tests verify the end-to-end processing behavior of `ProcessFrameAsync` with mocked dependencies.

## Blocked by
- 01: Foundation Bug Fixes & PpeClassDefinition
- 02: Ingest DTOs & Identity Resolution
