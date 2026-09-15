namespace SafetyAlwaysWatch.Application.DTOs.Inference;

public record DetectionFrameOutput(
    string CameraId,
    DateTime Timestamp,
    List<DetectedPersonOutput> Persons
);

public record DetectedPersonOutput(
    string TrackId,
    BoundingBoxDto BoundingBox,
    double Confidence,
    Guid? EmployeeId,
    string DisplayName,
    int? CurrentSafetyScore,
    bool IsIdentified,
    bool IsCompliant,
    List<PpeItemOutput> PpeItems,
    bool IsTrackLost
);

public record PpeItemOutput(
    string ClassName,
    BoundingBoxDto BoundingBox,
    double Confidence,
    bool IsRequired
);
