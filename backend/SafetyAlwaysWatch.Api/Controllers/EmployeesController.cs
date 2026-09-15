using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SafetyAlwaysWatch.Application.DTOs.Employees;
using SafetyAlwaysWatch.Application.Interfaces;

using FluentValidation;
using SafetyAlwaysWatch.Application.Common;
using SafetyAlwaysWatch.Application.Common.Models;

namespace SafetyAlwaysWatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin, Safety Officer, HRD")]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;
    private readonly IValidator<GetEmployeesQuery> _getEmployeesValidator;
    private readonly IValidator<CreateEmployeeDto> _createEmployeeValidator;

    public EmployeesController(
        IEmployeeService employeeService, 
        IValidator<GetEmployeesQuery> getEmployeesValidator,
        IValidator<CreateEmployeeDto> createEmployeeValidator)
    {
        _employeeService = employeeService;
        _getEmployeesValidator = getEmployeesValidator;
        _createEmployeeValidator = createEmployeeValidator;
    }

    /// <summary>
    /// Mendapatkan daftar direktori karyawan dan skor keselamatan dengan filter dan pagination.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetEmployees([FromQuery] GetEmployeesQuery query, CancellationToken cancellationToken)
    {
        var validationResult = await _getEmployeesValidator.ValidateAsync(query, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

            return BadRequest(ServiceResult<PaginatedList<EmployeeDto>>.ValidationFailure(errors));
        }

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

    /// <summary>
    /// Mendaftarkan karyawan baru dan menginisialisasi skor keselamatan awal.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeDto dto, CancellationToken cancellationToken)
    {
        var validationResult = await _createEmployeeValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

            return BadRequest(ServiceResult<Guid>.ValidationFailure(errors));
        }

        var result = await _employeeService.CreateEmployeeAsync(dto, cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return CreatedAtAction(nameof(GetEmployeeById), new { id = result.Data }, result);
    }
}
