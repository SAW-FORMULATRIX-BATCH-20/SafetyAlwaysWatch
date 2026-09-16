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
    private readonly IMockSimulationControl _simulationControl;

    public MonitoringController(IInferenceIngestionService inferenceIngestionService, IMockSimulationControl simulationControl)
    {
        _inferenceIngestionService = inferenceIngestionService;
        _simulationControl = simulationControl;
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

    [HttpPost("simulate/start")]
    public IActionResult SimulateStart()
    {
        _simulationControl.Start();
        return Ok("Simulation started");
    }

    [HttpPost("simulate/stop")]
    public IActionResult SimulateStop()
    {
        _simulationControl.Stop();
        return Ok("Simulation stopped");
    }
}
