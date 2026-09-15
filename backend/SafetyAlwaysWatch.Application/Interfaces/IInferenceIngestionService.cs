using SafetyAlwaysWatch.Application.DTOs.Inference;
using System.Threading;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Application.Interfaces;

public interface IInferenceIngestionService
{
    Task<DetectionFrameOutput> ProcessFrameAsync(IngestFrameDto payload, CancellationToken cancellationToken = default);
}
