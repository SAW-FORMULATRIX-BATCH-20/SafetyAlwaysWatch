namespace SafetyAlwaysWatch.Application.DTOs.Inference;

public record IngestFrameDto(
    string CameraId,
    DateTimeOffset Timestamp,
    List<DetectedPersonDto> Persons,
    byte[]? FrameJpeg
);

public record DetectedPersonDto(
    string TrackId,
    BoundingBoxDto BoundingBox,
    double Confidence,
    byte[]? FaceEmbedding,
    List<PpeDetectionDto> PpeDetections,
    bool IsTrackLost
);

public record BoundingBoxDto(
    double X,
    double Y,
    double Width,
    double Height
);

public record PpeDetectionDto(
    int ClassIndex,
    BoundingBoxDto BoundingBox,
    double Confidence
);
