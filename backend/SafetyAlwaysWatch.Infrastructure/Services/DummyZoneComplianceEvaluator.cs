using SafetyAlwaysWatch.Application.DTOs.Inference;
using SafetyAlwaysWatch.Application.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Infrastructure.Services;

public class DummyZoneComplianceEvaluator : IZoneComplianceEvaluator
{
    public Task<ZoneComplianceResult> EvaluateAsync(string cameraId, DetectedPersonDto person, CancellationToken cancellationToken = default)
    {
        if (person.TrackId == "sim_violator")
        {
            return Task.FromResult(new ZoneComplianceResult(true, Guid.NewGuid(), false, Guid.NewGuid()));
        }

        // Out of scope for Issue 03. Will be implemented in TK-09-BE.
        // For now, always return compliant.
        return Task.FromResult(new ZoneComplianceResult(false, null, true, null));
    }
}
