using System.Collections.Generic;

namespace SAW.ComputerVision.Worker.Configuration;

public class CvConfig
{
    public BackendConfig Backend { get; set; } = new();
    public PipelineConfig Pipeline { get; set; } = new();
    public ModelsConfig Models { get; set; } = new();
    public List<CameraConfig> Cameras { get; set; } = new();
}

public class BackendConfig
{
    public string BaseUrl { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
}

public class PipelineConfig
{
    public int ProcessingFps { get; set; } = 2;
    public int SnapshotIntervalSeconds { get; set; } = 2;
    public double ConfidenceThreshold { get; set; } = 0.5;
}

public class ModelsConfig
{
    public string PersonPath { get; set; } = string.Empty;
    public string PpePath { get; set; } = string.Empty;
    public string YuNetPath { get; set; } = string.Empty;
    public string SFacePath { get; set; } = string.Empty;
}

public class CameraConfig
{
    public string Id { get; set; } = string.Empty;
    public string RtspUrl { get; set; } = string.Empty;
}
