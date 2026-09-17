using System.Threading;
using System.Threading.Tasks;
using SAW.ComputerVision.Core.Models;

namespace SAW.ComputerVision.Core.Pipeline;

public interface IFrameProcessor
{
    Task<PipelineOutput> ProcessFrameAsync(byte[] frame, CancellationToken cancellationToken = default);
}
