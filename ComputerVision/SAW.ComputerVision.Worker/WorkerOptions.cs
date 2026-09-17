namespace SAW.ComputerVision.Worker;

public class WorkerOptions
{
    public string CameraId { get; set; } = string.Empty;
    public string RtspUrl { get; set; } = string.Empty;
    public int TargetFps { get; set; } = 10;
    public string BackendApiUrl { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
}
