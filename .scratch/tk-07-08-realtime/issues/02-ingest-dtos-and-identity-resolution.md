## Parent
#89

## What to build
Define the core DTOs for the ingest pipeline and implement the face matching logic (Identity Resolution):
1. Create the `IngestFrameDto`, `DetectedPersonDto`, `BoundingBoxDto`, and `PpeDetectionDto` models for receiving data from the Inference Worker.
2. Create the `DetectionFrameOutput`, `DetectedPersonOutput`, and `PpeItemOutput` models for pushing data to SignalR clients.
3. Define `IIdentityResolverService` and its return type `IdentityResult` (EmployeeId, DisplayName, CurrentSafetyScore, IsIdentified).
4. Implement `ITrackIdentityCache` as a Singleton using `ConcurrentDictionary` with TTL eviction to cache resolved identities per TrackId.
5. Add `MatchEmbeddingAsync` to `IFaceRecognitionService` (which uses cosine similarity against active `EmployeeFaceEmbedding` records, or bypasses this if `SimulatedEmployeeId` is provided).
6. Implement `IdentityResolverService` to retry matching while Unknown, and cache once matched.

## Acceptance criteria
- [ ] Ingest and Output DTO schemas are defined.
- [ ] `ITrackIdentityCache` correctly stores, retrieves, and evicts track identities.
- [ ] `IFaceRecognitionService` supports matching an embedding against enrolled faces.
- [ ] `IdentityResolverService` resolves a given track ID and embedding, utilizing the cache to avoid redundant matching.
- [ ] Unknown tracks return a valid `IdentityResult` with null `EmployeeId` and "Unknown" `DisplayName`.

## Blocked by
- None (can start immediately)
