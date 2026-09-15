using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SafetyAlwaysWatch.Application.DTOs.Employees;
using SafetyAlwaysWatch.Application.DTOs;
using SafetyAlwaysWatch.Application.Interfaces;
using System.Security.Claims;

using FluentValidation;
using SafetyAlwaysWatch.Application.Common;
using SafetyAlwaysWatch.Application.Common.Models;
using SafetyAlwaysWatch.Application.DTOs.Requests;

namespace SafetyAlwaysWatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin, Safety Officer, HRD")]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;
    private readonly IValidator<GetEmployeesQuery> _getEmployeesValidator;
    private readonly IValidator<CreateEmployeeDto> _createEmployeeValidator;
    private readonly IValidator<UpdateEmployeeDto> _updateEmployeeValidator;
    private readonly IScoreResetService _scoreResetService;

    public EmployeesController(
        IEmployeeService employeeService,
        IValidator<GetEmployeesQuery> getEmployeesValidator,
        IValidator<CreateEmployeeDto> createEmployeeValidator,
        IValidator<UpdateEmployeeDto> updateEmployeeValidator,
        IScoreResetService scoreResetService)
    {
        _employeeService = employeeService;
        _getEmployeesValidator = getEmployeesValidator;
        _createEmployeeValidator = createEmployeeValidator;
        _updateEmployeeValidator = updateEmployeeValidator;
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

    /// <summary>
    /// Memperbarui profil karyawan.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateEmployee(Guid id, [FromBody] UpdateEmployeeDto dto, CancellationToken cancellationToken)
    {
        var validationResult = await _updateEmployeeValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

            return BadRequest(ServiceResult<bool>.ValidationFailure(errors));
        }

        var result = await _employeeService.UpdateEmployeeAsync(id, dto, cancellationToken);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Menghapus karyawan (soft-delete).
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteEmployee(Guid id, CancellationToken cancellationToken)
    {
        var result = await _employeeService.DeleteEmployeeAsync(id, cancellationToken);
        if (!result.IsSuccess)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Mendaftarkan wajah karyawan baru.
    /// </summary>
    [HttpPost("{id:guid}/faces")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> EnrollFace(Guid id, IFormFile image, CancellationToken cancellationToken)
    {
        if (image == null || image.Length == 0)
        {
            return BadRequest(ServiceResult<EnrollFaceResponseDto>.Failure("Image is required."));
        }

        var adminIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("id");
        Guid.TryParse(adminIdClaim, out Guid adminId);

        using var stream = image.OpenReadStream();
        var result = await _employeeService.EnrollFaceAsync(id, stream, image.ContentType, adminId, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPost("{id:guid}/safety-score/reset")]
    public async Task<IActionResult> ResetSafetyScore(Guid id, [FromBody] ResetScoreRequest request, CancellationToken cancellationToken)
    {
        var result = await _scoreResetService.ResetScoreManuallyAsync(id, request, cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}
