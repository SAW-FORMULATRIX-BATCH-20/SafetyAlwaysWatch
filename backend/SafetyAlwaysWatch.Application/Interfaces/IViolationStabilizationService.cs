namespace SafetyAlwaysWatch.Application.Interfaces;

public interface IViolationStabilizationService
{
    Task ProcessDetectionAsync(
        string trackId,
        Guid dangerZoneId,
        Guid missingPpeClassId,
        bool isCompliant,
        double confidence,
        DateTimeOffset timestamp,
        Guid? resolvedEmployeeId,
        byte[]? frameSnapshot = null,
        CancellationToken cancellationToken = default);

    Task HandleLostTrackAsync(string trackId, CancellationToken cancellationToken = default);
}
