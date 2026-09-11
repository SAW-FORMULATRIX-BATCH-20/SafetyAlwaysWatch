using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SafetyAlwaysWatch.Application.Common;
using SafetyAlwaysWatch.Application.DTOs.Auth;
using SafetyAlwaysWatch.Application.Interfaces;

namespace SafetyAlwaysWatch.Api.Controllers;

/// <summary>
/// Controller untuk menangani autentikasi dan manajemen akun pengguna.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IValidator<LoginRequestDto> _loginValidator;
    private readonly IValidator<ChangePasswordRequestDto> _changePasswordValidator;
    private readonly ICurrentUserService _currentUserService;

    /// <summary>
    /// Inisialisasi AuthController dengan dependensi yang dibutuhkan.
    /// </summary>
    public AuthController(
        IAuthService authService,
        IValidator<LoginRequestDto> loginValidator,
        IValidator<ChangePasswordRequestDto> changePasswordValidator,
        ICurrentUserService currentUserService)
    {
        _authService = authService;
        _loginValidator = loginValidator;
        _changePasswordValidator = changePasswordValidator;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Melakukan autentikasi menggunakan email atau kode karyawan beserta password untuk mendapatkan JWT Bearer token.
    /// </summary>
    /// <param name="request">Payload login berisi identifier (email/kode) dan password.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Token JWT dan ringkasan data profil pengguna.</returns>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ServiceResult<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ServiceResult<AuthResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ServiceResult<AuthResponseDto>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request, CancellationToken cancellationToken)
    {
        var validationResult = await _loginValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

            return BadRequest(ServiceResult<AuthResponseDto>.ValidationFailure(errors));
        }

        var result = await _authService.LoginAsync(request, cancellationToken);
        if (!result.IsSuccess)
        {
            return Unauthorized(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Mengubah password akun pengguna yang sedang login.
    /// </summary>
    /// <param name="request">Payload perubahan password berisi password saat ini dan password baru.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Status keberhasilan perubahan password.</returns>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(ServiceResult<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ServiceResult<bool>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            return Unauthorized(ServiceResult<bool>.Failure("Pengguna tidak terautentikasi."));
        }

        var validationResult = await _changePasswordValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

            return BadRequest(ServiceResult<bool>.ValidationFailure(errors));
        }

        var result = await _authService.ChangePasswordAsync(userId.Value, request, cancellationToken);
        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}
