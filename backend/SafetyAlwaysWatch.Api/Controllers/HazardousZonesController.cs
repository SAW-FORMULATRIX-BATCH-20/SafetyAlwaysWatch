using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SafetyAlwaysWatch.Application.DTOs.HazardousZones;
using SafetyAlwaysWatch.Application.Interfaces;

namespace SafetyAlwaysWatch.Api.Controllers;

[ApiController]
[Route("api/danger-zones")]
[Authorize(Roles = "Admin,SafetyOfficer")]
public class HazardousZonesController : ControllerBase
{
    private readonly IHazardousZoneService _hazardousZoneService;

    public HazardousZonesController(IHazardousZoneService hazardousZoneService)
    {
        _hazardousZoneService = hazardousZoneService;
    }

    /// <summary>
    /// Creates a new Hazardous Zone.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateHazardousZoneDto request)
    {
        var result = await _hazardousZoneService.CreateAsync(request);
        if (result.IsSuccess)
        {
            return Ok(result);
        }

        if (result.ValidationErrors?.Count > 0)
        {
            return BadRequest(result);
        }

        return BadRequest(result);
    }

    /// <summary>
    /// Updates an existing Hazardous Zone.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateHazardousZoneDto request)
    {
        if (id != request.Id)
        {
            return BadRequest("Id in URL does not match Id in body.");
        }

        var result = await _hazardousZoneService.UpdateAsync(request);
        if (result.IsSuccess)
        {
            return Ok(result);
        }

        if (result.ValidationErrors?.Count > 0)
        {
            return BadRequest(result);
        }

        return NotFound(result);
    }

    /// <summary>
    /// Retrieves a Hazardous Zone by its unique ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _hazardousZoneService.GetByIdAsync(id);
        if (result.IsSuccess)
        {
            return Ok(result);
        }

        return NotFound(result);
    }

    /// <summary>
    /// Retrieves a paginated list of Hazardous Zones.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPaginated([FromQuery] GetHazardousZonesQuery query)
    {
        var result = await _hazardousZoneService.GetPaginatedAsync(query);
        if (result.IsSuccess)
        {
            return Ok(result);
        }

        return BadRequest(result);
    }

    /// <summary>
    /// Soft-deletes a Hazardous Zone.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _hazardousZoneService.SoftDeleteAsync(id);
        if (result.IsSuccess)
        {
            return NoContent();
        }

        return NotFound(result);
    }
}
