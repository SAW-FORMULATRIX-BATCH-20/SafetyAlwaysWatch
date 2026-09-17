using System.Collections.Generic;

namespace SAW.ComputerVision.Core.Models;

public class PipelineOutput
{
    public IEnumerable<TrackedPerson> Persons { get; set; } = new List<TrackedPerson>();
}
