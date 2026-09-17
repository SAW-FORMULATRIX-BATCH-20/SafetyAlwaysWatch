using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SAW.ComputerVision.Core.Models;

namespace SAW.ComputerVision.Core.Pipeline;

public class StubFrameProcessor : IFrameProcessor
{
    public Task<PipelineOutput> ProcessFrameAsync(byte[] frame, CancellationToken cancellationToken = default)
    {
        // Stub implementation returning a fake tracked person
        var output = new PipelineOutput
        {
            Persons = new List<TrackedPerson>
            {
                new TrackedPerson
                {
                    TrackId = Guid.NewGuid(),
                    Box = new BoundingBox(10, 10, 100, 200),
                    PpeDetections = new List<Detection>
                    {
                        new Detection(new BoundingBox(10, 10, 50, 50), 0.9, 1)
                    }
                }
            }
        };

        return Task.FromResult(output);
    }
}
