using Microsoft.EntityFrameworkCore;
using SafetyAlwaysWatch.Application.DTOs.Inference;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Infrastructure.Services;

public class ZoneComplianceEvaluator : IZoneComplianceEvaluator
{
    private readonly IRepository<HazardousZone> _zoneRepository;

    public ZoneComplianceEvaluator(IRepository<HazardousZone> zoneRepository)
    {
        _zoneRepository = zoneRepository;
    }

    public async Task<ZoneComplianceResult> EvaluateAsync(
        string cameraId,
        DetectedPersonDto person,
        CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(cameraId, out Guid cameraGuid))
        {
            return new ZoneComplianceResult(false, null, true, new List<Guid>());
        }

        var zones = await _zoneRepository.Query()
            .Where(z => z.CameraSourceId == cameraGuid && z.IsActive)
            .ToListAsync(cancellationToken);

        if (!zones.Any())
        {
            return new ZoneComplianceResult(false, null, true, new List<Guid>());
        }

        var personBox = person.BoundingBox;

        foreach (var zone in zones)
        {
            // Check intersection (normalized coordinates 0.0 to 1.0)
            bool intersectsX = Math.Max(personBox.X, zone.RelativeX) < Math.Min(personBox.X + personBox.Width, zone.RelativeX + zone.RelativeWidth);
            bool intersectsY = Math.Max(personBox.Y, zone.RelativeY) < Math.Min(personBox.Y + personBox.Height, zone.RelativeY + zone.RelativeHeight);

            if (intersectsX && intersectsY)
            {
                // TODO: Map ClassIndex to PpeClassDefinition Id once PpeClassDefinition is implemented.
                // For now, we generate a deterministic Guid from ClassIndex to allow compilation and basic testing.
                var detectedPpeClassIds = person.PpeDetections.Select(p => GetGuidForClassIndex(p.ClassIndex)).ToList();
                
                var missingPpeClassIds = new List<Guid>();
                foreach (var requiredId in zone.RequiredPpeClassIds)
                {
                    if (!detectedPpeClassIds.Contains(requiredId))
                    {
                        missingPpeClassIds.Add(requiredId);
                    }
                }

                bool isCompliant = missingPpeClassIds.Count == 0;

                return new ZoneComplianceResult(true, zone.Id, isCompliant, missingPpeClassIds);
            }
        }

        return new ZoneComplianceResult(false, null, true, new List<Guid>());
    }

    private Guid GetGuidForClassIndex(int classIndex)
    {
        var bytes = new byte[16];
        BitConverter.GetBytes(classIndex).CopyTo(bytes, 0);
        return new Guid(bytes);
    }
}
