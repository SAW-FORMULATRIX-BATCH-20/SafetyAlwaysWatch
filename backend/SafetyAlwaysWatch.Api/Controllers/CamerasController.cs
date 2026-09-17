using Microsoft.AspNetCore.Mvc;
using SafetyAlwaysWatch.Application.DTOs.Cameras;
using SafetyAlwaysWatch.Application.Interfaces;

namespace SafetyAlwaysWatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CamerasController : ControllerBase
{
    private readonly ICameraService _cameraService;

    public CamerasController(ICameraService cameraService)
    {
        _cameraService = cameraService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateCamera([FromBody] CreateCameraDto dto, CancellationToken cancellationToken)
    {
        var camera = await _cameraService.CreateCameraAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetCamera), new { id = camera.Id }, camera);
    }

    [HttpGet]
    public async Task<IActionResult> GetCameras(CancellationToken cancellationToken)
    {
        var cameras = await _cameraService.GetCamerasAsync(cancellationToken);
        return Ok(cameras);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCamera(Guid id, CancellationToken cancellationToken)
    {
        var camera = await _cameraService.GetCameraByIdAsync(id, cancellationToken);
        if (camera == null) return NotFound();
        return Ok(camera);
    }
}
