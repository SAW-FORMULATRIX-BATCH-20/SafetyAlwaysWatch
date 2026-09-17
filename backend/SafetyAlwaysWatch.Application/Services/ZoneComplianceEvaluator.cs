using SafetyAlwaysWatch.Application.DTOs.Inference;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Application.Services;

public class ZoneComplianceEvaluator : IZoneComplianceEvaluator
{
    private readonly IRepository<HazardousZone> _zoneRepository;

    // Temporary static mapping until PpeClassDefinition (TK-06-BE) is implemented
    private static readonly Dictionary<int, Guid> _ppeClassIndexToGuid = new()
    {
        { 0, Guid.Parse("ebcc3638-4eb9-407f-afbd-329cc658b4ba") }, // Helm Keselamatan
        { 1, Guid.Parse("88ef2248-c849-4eb5-b28f-7f5b7ea57223") }, // Rompi Reflektif
        { 2, Guid.Parse("11961dc2-be77-4b44-934d-cf9bda165b45") }, // Sepatu Boot
        { 3, Guid.Parse("b6a71ec9-d419-482a-a9a7-935dfa824e88") }, // Kacamata Pelindung
        { 4, Guid.Parse("51ce8b24-9b28-4e1b-af3b-a2c918a53df4") }  // Masker
    };

    public ZoneComplianceEvaluator(IRepository<HazardousZone> zoneRepository)
    {
        _zoneRepository = zoneRepository;
    }

    public async Task<ZoneComplianceResult> EvaluateAsync(string cameraId, DetectedPersonDto person, CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(cameraId, out var cameraGuid))
        {
            return new ZoneComplianceResult(false, null, true, null);
        }

        // 1. Fetch active zones for this camera
        var activeZones = await _zoneRepository.FindAsync(z => z.IsActive && z.CameraSourceId == cameraGuid, cancellationToken);

        if (!activeZones.Any())
        {
            return new ZoneComplianceResult(false, null, true, null);
        }

        // 2. Determine intersecting zones
        var intersectingZones = new List<HazardousZone>();
        var pBox = person.BoundingBox;

        foreach (var zone in activeZones)
        {
            bool intersects = pBox.X < (zone.RelativeX + zone.RelativeWidth) &&
                              (pBox.X + pBox.Width) > zone.RelativeX &&
                              pBox.Y < (zone.RelativeY + zone.RelativeHeight) &&
                              (pBox.Y + pBox.Height) > zone.RelativeY;
            if (intersects)
            {
                intersectingZones.Add(zone);
            }
        }

        if (!intersectingZones.Any())
        {
            return new ZoneComplianceResult(false, null, true, null);
        }

        // 3. Combine required PPE classes from all intersecting zones
        var requiredPpeClassIds = intersectingZones
            .SelectMany(z => z.RequiredPpeClassIds)
            .Distinct()
            .ToList();

        if (!requiredPpeClassIds.Any())
        {
            // Intersects, but no PPE required
            return new ZoneComplianceResult(true, intersectingZones.First().Id, true, null);
        }

        // 4. Determine detected PPE Guids
        var detectedPpeClassIds = person.PpeDetections
            .Select(d => d.ClassIndex)
            .Where(_ppeClassIndexToGuid.ContainsKey)
            .Select(idx => _ppeClassIndexToGuid[idx])
            .ToList();

        // 5. Calculate missing PPEs
        var missingPpeClassIds = requiredPpeClassIds.Except(detectedPpeClassIds).ToList();

        bool isCompliant = !missingPpeClassIds.Any();

        return new ZoneComplianceResult(
            IsInZone: true,
            HazardousZoneId: intersectingZones.First().Id,
            IsCompliant: isCompliant,
            MissingPpeClassIds: isCompliant ? null : missingPpeClassIds
        );
    }
}
