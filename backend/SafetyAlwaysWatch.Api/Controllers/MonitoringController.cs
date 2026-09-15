using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using SafetyAlwaysWatch.Api.Filters;
using SafetyAlwaysWatch.Api.Hubs;
using SafetyAlwaysWatch.Application.DTOs.Inference;
using SafetyAlwaysWatch.Application.Interfaces;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MonitoringController : ControllerBase
{
    private readonly IInferenceIngestionService _inferenceIngestionService;
    private readonly IHubContext<MonitoringHub> _hubContext;

    public MonitoringController(IInferenceIngestionService inferenceIngestionService, IHubContext<MonitoringHub> hubContext)
    {
        _inferenceIngestionService = inferenceIngestionService;
        _hubContext = hubContext;
    }

    [HttpPost("stream/{cameraId}")]
    [ApiKey]
    public async Task<IActionResult> Stream(string cameraId, [FromBody] IngestFrameDto payload)
    {
        if (cameraId != payload.CameraId)
        {
            return BadRequest("Camera ID in path does not match payload");
        }

        var result = await _inferenceIngestionService.ProcessFrameAsync(payload);
        await _hubContext.Clients.Group($"Camera_{cameraId}").SendAsync("ReceiveDetectionFrame", result);
        return Accepted();
    }
}
