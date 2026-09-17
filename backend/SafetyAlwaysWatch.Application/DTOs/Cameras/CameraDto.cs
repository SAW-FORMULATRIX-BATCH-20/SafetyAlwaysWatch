using SafetyAlwaysWatch.Domain.Enums;

namespace SafetyAlwaysWatch.Application.DTOs.Cameras;

public record CameraDto(
    Guid Id,
    string Name,
    string Location,
    string? StreamUrl,
    CameraStatus Status
);
