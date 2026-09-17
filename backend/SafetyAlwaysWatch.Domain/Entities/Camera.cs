using SafetyAlwaysWatch.Domain.Common;
using SafetyAlwaysWatch.Domain.Enums;

namespace SafetyAlwaysWatch.Domain.Entities;

public class Camera : BaseEntity
{
    public Guid Id { get; private set; }
    public string Name { get; private set; }
    public string Location { get; private set; }
    public string? StreamUrl { get; private set; }
    public CameraStatus Status { get; private set; }

    private Camera()
    {
        Name = string.Empty;
        Location = string.Empty;
    }

    public Camera(string name, string location, string? streamUrl, CameraStatus status = CameraStatus.Offline)
    {
        Id = Guid.NewGuid();
        Name = name;
        Location = location;
        StreamUrl = streamUrl;
        Status = status;
    }

    public void UpdateDetails(string name, string location, string? streamUrl)
    {
        Name = name;
        Location = location;
        StreamUrl = streamUrl;
    }

    public void UpdateStatus(CameraStatus status)
    {
        Status = status;
    }
}
