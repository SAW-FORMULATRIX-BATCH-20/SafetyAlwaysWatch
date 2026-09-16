using Microsoft.AspNetCore.SignalR;
using SafetyAlwaysWatch.Api.Hubs;
using SafetyAlwaysWatch.Application.DTOs.Inference;
using SafetyAlwaysWatch.Application.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Api.Services;

public class SignalRInferenceResultPublisher : IInferenceResultPublisher
{
    private readonly IHubContext<MonitoringHub> _hubContext;

    public SignalRInferenceResultPublisher(IHubContext<MonitoringHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task PublishAsync(string cameraId, DetectionFrameOutput frameOutput, CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients.Group($"Camera_{cameraId}").SendAsync("ReceiveDetectionFrame", frameOutput, cancellationToken);
    }
}
