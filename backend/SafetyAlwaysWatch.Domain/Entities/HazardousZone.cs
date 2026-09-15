using SafetyAlwaysWatch.Domain.Common;

namespace SafetyAlwaysWatch.Domain.Entities;

public class HazardousZone : BaseEntity
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public Guid? CameraSourceId { get; private set; }

    // Relative coordinates for resilience to camera resolution changes (0.0 to 1.0)
    public double RelativeX { get; private set; }
    public double RelativeY { get; private set; }
    public double RelativeWidth { get; private set; }
    public double RelativeHeight { get; private set; }

    public bool IsActive { get; private set; }

    public List<Guid> SupervisorIds { get; private set; } = new();
    public List<Guid> RequiredPpeClassIds { get; private set; } = new();

    private HazardousZone()
    {
    }

    public HazardousZone(
        string name,
        double relativeX,
        double relativeY,
        double relativeWidth,
        double relativeHeight,
        Guid? cameraSourceId = null)
    {
        Id = Guid.NewGuid();
        Name = name;
        RelativeX = relativeX;
        RelativeY = relativeY;
        RelativeWidth = relativeWidth;
        RelativeHeight = relativeHeight;
        CameraSourceId = cameraSourceId;
        IsActive = true;
    }

    public void UpdateDetails(
        string name,
        double relativeX,
        double relativeY,
        double relativeWidth,
        double relativeHeight,
        Guid? cameraSourceId = null)
    {
        Name = name;
        RelativeX = relativeX;
        RelativeY = relativeY;
        RelativeWidth = relativeWidth;
        RelativeHeight = relativeHeight;
        CameraSourceId = cameraSourceId;
    }

    public void AddSupervisor(Guid supervisorId)
    {
        if (!SupervisorIds.Contains(supervisorId))
        {
            SupervisorIds.Add(supervisorId);
        }
    }

    public void RemoveSupervisor(Guid supervisorId)
    {
        SupervisorIds.Remove(supervisorId);
    }

    public void SetSupervisors(IEnumerable<Guid> supervisorIds)
    {
        SupervisorIds = supervisorIds.ToList();
    }

    public void SetRequiredPpeClasses(IEnumerable<Guid> ppeClassIds)
    {
        RequiredPpeClassIds = ppeClassIds.ToList();
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    public void Activate()
    {
        IsActive = true;
    }
}
