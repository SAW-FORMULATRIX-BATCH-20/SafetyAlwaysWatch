using System;
using System.Collections.Generic;

namespace SafetyAlwaysWatch.Application.DTOs.HazardousZones;

public class HazardousZoneDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? CameraSourceId { get; set; }
    public double RelativeX { get; set; }
    public double RelativeY { get; set; }
    public double RelativeWidth { get; set; }
    public double RelativeHeight { get; set; }
    public bool IsActive { get; set; }
    public List<Guid> SupervisorIds { get; set; } = new();
    public List<Guid> RequiredPpeClassIds { get; set; } = new();
}
