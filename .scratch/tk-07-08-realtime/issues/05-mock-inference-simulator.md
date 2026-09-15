## Parent
#89

## What to build
Build a mock Inference Worker to facilitate frontend development and end-to-end testing without a real AI model:
1. Create `POST /api/monitoring/simulate/start` and `POST /api/monitoring/simulate/stop` endpoints in `MonitoringController`.
2. Implement a `BackgroundService` (Mock Inference Simulator) that, when started, loops at ~1 FPS and internally calls `POST /api/monitoring/stream/{cameraId}`.
3. The simulator should generate a predefined, scripted scenario: 2-3 tracked persons, one enters a Hazardous Zone without required PPE, triggers the violation state machine (Candidate -> Confirmed -> Clearing -> Cleared), and handles lost tracks. It should include both identified (`SimulatedEmployeeId`) and Unknown persons.

## Acceptance criteria
- [ ] Simulator can be started and stopped via API endpoints.
- [ ] Background service successfully sends periodic `IngestFrameDto` payloads to the ingest webhook.
- [ ] The simulated scenario correctly exercises the entire violation lifecycle and identity resolution paths.

## Blocked by
- 04: SignalR Hub & Realtime Push
