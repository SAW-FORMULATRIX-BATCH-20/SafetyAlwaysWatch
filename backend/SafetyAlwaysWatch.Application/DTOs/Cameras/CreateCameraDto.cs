namespace SafetyAlwaysWatch.Application.DTOs.Cameras;

public record CreateCameraDto(
    string Name,
    string Location,
    string? StreamUrl
);
