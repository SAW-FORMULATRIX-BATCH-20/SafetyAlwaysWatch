using SafetyAlwaysWatch.Domain.Common;

namespace SafetyAlwaysWatch.Domain.Entities;

public class DangerZone : BaseEntity
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public Guid? CameraSourceId { get; private set; }
    public bool IsActive { get; private set; }
    public List<Guid> SupervisorIds { get; private set; } = new();

    private DangerZone()
    {
    }

    public DangerZone(string name, Guid? cameraSourceId = null)
    {
        Id = Guid.NewGuid();
        Name = name;
        CameraSourceId = cameraSourceId;
        IsActive = true;
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
}
