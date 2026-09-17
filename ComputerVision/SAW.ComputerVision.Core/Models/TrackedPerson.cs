using System;
using System.Collections.Generic;

namespace SAW.ComputerVision.Core.Models;

public class TrackedPerson
{
    public Guid TrackId { get; set; }
    public BoundingBox Box { get; set; }
    public IEnumerable<Detection> PpeDetections { get; set; } = new List<Detection>();
    public float[]? FaceEmbedding { get; set; }
}
