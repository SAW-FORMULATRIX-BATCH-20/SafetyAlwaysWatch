using System;
using System.Collections.Generic;

namespace SAW.ComputerVision.Worker;

public class IngestFrameDto
{
    public string CameraId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public List<DetectedPersonDto> Persons { get; set; } = new List<DetectedPersonDto>();
}

public class DetectedPersonDto
{
    public string TrackId { get; set; } = string.Empty;
    public BoundingBoxDto BoundingBox { get; set; } = new BoundingBoxDto();
    public double Confidence { get; set; }
    public Guid? SimulatedEmployeeId { get; set; }
    public byte[]? FaceEmbedding { get; set; }
    public List<PpeDetectionDto> PpeDetections { get; set; } = new List<PpeDetectionDto>();
    public bool IsTrackLost { get; set; }
}

public class BoundingBoxDto
{
    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
}

public class PpeDetectionDto
{
    public int ClassIndex { get; set; }
    public BoundingBoxDto BoundingBox { get; set; } = new BoundingBoxDto();
    public double Confidence { get; set; }
}
