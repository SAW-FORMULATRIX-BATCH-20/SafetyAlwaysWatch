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

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCamera(Guid id, [FromBody] UpdateCameraDto dto, CancellationToken cancellationToken)
    {
        if (id != dto.Id) return BadRequest("Camera ID in URL does not match ID in body.");

        var updatedCamera = await _cameraService.UpdateCameraAsync(id, dto, cancellationToken);
        if (updatedCamera == null) return NotFound();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCamera(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _cameraService.DeleteCameraAsync(id, cancellationToken);
            if (!result) return NotFound();

            return NoContent();
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException)
        {
            return BadRequest("Kamera tidak bisa dihapus karena masih digunakan oleh satu atau lebih zona berbahaya.");
        }
    }
}
