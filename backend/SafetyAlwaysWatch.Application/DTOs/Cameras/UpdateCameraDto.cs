namespace SafetyAlwaysWatch.Application.DTOs.Cameras;

using SafetyAlwaysWatch.Domain.Enums;

public record UpdateCameraDto(
    Guid Id,
    string Name,
    string Location,
    string? StreamUrl,
    CameraStatus Status
);
