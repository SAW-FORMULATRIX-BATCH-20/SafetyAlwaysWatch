using System;
using System.Collections.Generic;

namespace SAW.ComputerVision.Core.Models;

public class PipelineOutput
{
    public IEnumerable<ProcessedPerson> Persons { get; set; } = new List<ProcessedPerson>();
    public IEnumerable<Guid> LostTrackIds { get; set; } = new List<Guid>();
}

public class ProcessedPerson
{
    public Guid TrackId { get; set; }
    public BoundingBox Box { get; set; }
    public float[] FaceEmbedding { get; set; } = Array.Empty<float>();
    public IEnumerable<Detection> PpeDetections { get; set; } = new List<Detection>();
}
