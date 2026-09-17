using SafetyAlwaysWatch.Application.DTOs.Cameras;

namespace SafetyAlwaysWatch.Application.Interfaces;

public interface ICameraService
{
    Task<CameraDto> CreateCameraAsync(CreateCameraDto dto, CancellationToken cancellationToken = default);
    Task<IEnumerable<CameraDto>> GetCamerasAsync(CancellationToken cancellationToken = default);
    Task<CameraDto?> GetCameraByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CameraDto?> UpdateCameraAsync(Guid id, UpdateCameraDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteCameraAsync(Guid id, CancellationToken cancellationToken = default);
}
