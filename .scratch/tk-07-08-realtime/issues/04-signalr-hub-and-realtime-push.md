## Parent
#89

## What to build
Set up the SignalR Hub to push processed real-time events to the frontend UI:
1. Create `MonitoringHub` at route `/hubs/monitoring`.
2. Implement client-to-server methods `JoinCamera(string cameraId)` and `LeaveCamera(string cameraId)` to manage group subscriptions (`Camera_{cameraId}`).
3. Update `IInferenceIngestionService` to inject `IHubContext<MonitoringHub>` and push the fully processed `DetectionFrameOutput` to the appropriate camera group via the `ReceiveDetectionFrame` method.
4. Update CORS policy in `Program.cs` to support SignalR (`.AllowCredentials()`).

## Acceptance criteria
- [ ] `MonitoringHub` is registered and accessible at `/hubs/monitoring`.
- [ ] Clients can join and leave camera-specific groups.
- [ ] The orchestrator successfully pushes `DetectionFrameOutput` to the correct camera group after processing a frame.
- [ ] CORS policy allows SignalR WebSocket connections.

## Blocked by
- 03: Inference Ingestion Orchestrator & Webhook
