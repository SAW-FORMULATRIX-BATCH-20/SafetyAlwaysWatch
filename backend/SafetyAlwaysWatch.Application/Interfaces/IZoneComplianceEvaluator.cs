using SafetyAlwaysWatch.Application.DTOs.Inference;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Application.Interfaces;

public interface IZoneComplianceEvaluator
{
    Task<ZoneComplianceResult> EvaluateAsync(
        string cameraId,
        DetectedPersonDto person,
        CancellationToken cancellationToken = default);
}

public record ZoneComplianceResult(
    bool IsInZone,
    Guid? HazardousZoneId,
    bool IsCompliant,
    List<Guid>? MissingPpeClassIds
);
