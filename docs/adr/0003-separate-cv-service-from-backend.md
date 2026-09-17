# Separate Computer Vision service from the backend

The CV inference pipeline (person detection, PPE detection, face detection, face embedding, object tracking) runs as a standalone .NET Worker Service in `ComputerVision/` with its own solution, independent of the backend. It reads RTSP camera streams, runs four ONNX models on CPU, and POSTs structured `IngestFrameDto` payloads to the backend's existing `POST /api/monitoring/stream/{cameraId}` endpoint over HTTP with static API key auth. The backend remains responsible for identity resolution, zone compliance evaluation, violation stabilization, scoring, and Telegram escalation.

We chose this over keeping inference in-process (too heavy for the API server, couples deployment of business logic and ML workloads) and over gRPC/message-queue communication (HTTP is pragmatic given the existing endpoint and bootcamp scope). The CV Service sends normalized bounding-box coordinates and periodic JPEG snapshots (~every 2 s) so the backend can serve violation evidence to Telegram without needing bidirectional communication.

## Considered Options

- **In-process inference** inside the backend: rejected because ML workloads would starve the API thread pool and couple deployment lifecycles.
- **gRPC streaming**: rejected as over-engineered for ~2 FPS throughput; HTTP POST is sufficient and the endpoint already exists.
- **Message queue (RabbitMQ/Redis Streams)**: rejected to avoid adding infrastructure dependencies for a bootcamp project.
