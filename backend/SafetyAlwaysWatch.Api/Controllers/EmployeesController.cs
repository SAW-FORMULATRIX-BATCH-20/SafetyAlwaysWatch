using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SafetyAlwaysWatch.Application.DTOs.Employees;
using SafetyAlwaysWatch.Application.Interfaces;

namespace SafetyAlwaysWatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;

    public EmployeesController(IEmployeeService employeeService)
    {
        _employeeService = employeeService;
    }

    /// <summary>
    /// Mendapatkan daftar direktori karyawan dan skor keselamatan dengan filter dan pagination.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetEmployees([FromQuery] GetEmployeesQuery query, CancellationToken cancellationToken)
    {
        var result = await _employeeService.GetEmployeesAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Mendapatkan detail profil dan skor keselamatan karyawan berdasarkan ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetEmployeeById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _employeeService.GetEmployeeByIdAsync(id, cancellationToken);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }
        return Ok(result);
    }
}
