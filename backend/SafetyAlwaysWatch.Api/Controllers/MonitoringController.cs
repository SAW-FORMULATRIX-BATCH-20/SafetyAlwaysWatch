using Microsoft.AspNetCore.Mvc;
using SafetyAlwaysWatch.Api.Filters;
using SafetyAlwaysWatch.Application.DTOs.Inference;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Api.Services;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MonitoringController : ControllerBase
{
    private readonly IInferenceIngestionService _inferenceIngestionService;

    public MonitoringController(IInferenceIngestionService inferenceIngestionService)
    {
        _inferenceIngestionService = inferenceIngestionService;
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
        return Accepted();
    }
}