using SafetyAlwaysWatch.Application.DTOs.Inference;
using System.Threading;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Application.Interfaces;

public interface IInferenceResultPublisher
{
    Task PublishAsync(string cameraId, DetectionFrameOutput frameOutput, CancellationToken cancellationToken = default);
}
