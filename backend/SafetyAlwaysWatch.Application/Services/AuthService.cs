using Microsoft.EntityFrameworkCore;
using SafetyAlwaysWatch.Application.Common;
using SafetyAlwaysWatch.Application.DTOs.Auth;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Enums;
using SafetyAlwaysWatch.Domain.Interfaces;

namespace SafetyAlwaysWatch.Application.Services;

/// <summary>
/// Layanan bisnis autentikasi dan manajemen akun karyawan.
/// </summary>
public class AuthService : IAuthService
{
    private readonly IRepository<Employee> _employeeRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthService(
        IRepository<Employee> employeeRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService)
    {
        _employeeRepository = employeeRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Identifier) || string.IsNullOrWhiteSpace(request.Password))
        {
            return ServiceResult<AuthResponseDto>.Failure("Kredensial login tidak valid.");
        }

        var normalizedIdentifier = request.Identifier.Trim();

        // Cari user berdasarkan EmployeeCode atau Email
        var employee = await _employeeRepository.Query()
            .FirstOrDefaultAsync(e => e.EmployeeCode == normalizedIdentifier || (e.Email != null && e.Email == normalizedIdentifier), cancellationToken);

        if (employee == null)
        {
            return ServiceResult<AuthResponseDto>.Failure("Kredensial login tidak valid.");
        }

        if (employee.Status != EmployeeStatus.Active)
        {
            return ServiceResult<AuthResponseDto>.Failure("Akun karyawan tidak aktif atau dinonaktifkan.");
        }

        if (string.IsNullOrEmpty(employee.PasswordHash) || !_passwordHasher.VerifyPassword(request.Password, employee.PasswordHash))
        {
            return ServiceResult<AuthResponseDto>.Failure("Kredensial login tidak valid.");
        }

        var token = _jwtTokenService.GenerateToken(employee);

        var response = new AuthResponseDto
        {
            Token = token,
            TokenType = "Bearer",
            ExpiresIn = _jwtTokenService.ExpirySeconds,
            User = new AuthenticatedUserDto
            {
                Id = employee.Id,
                EmployeeCode = employee.EmployeeCode,
                FullName = employee.FullName,
                Email = employee.Email,
                Role = employee.Role?.ToString(),
                RequiresPasswordChange = employee.RequiresPasswordChange
            }
        };

        return ServiceResult<AuthResponseDto>.Success(response);
    }

    public async Task<ServiceResult<bool>> ChangePasswordAsync(Guid userId, ChangePasswordRequestDto request, CancellationToken cancellationToken = default)
    {
        var employee = await _employeeRepository.Query()
            .FirstOrDefaultAsync(e => e.Id == userId, cancellationToken);

        if (employee == null)
        {
            return ServiceResult<bool>.Failure("Pengguna tidak ditemukan.");
        }

        if (string.IsNullOrEmpty(employee.PasswordHash) || !_passwordHasher.VerifyPassword(request.CurrentPassword, employee.PasswordHash))
        {
            return ServiceResult<bool>.Failure("Password saat ini tidak valid.");
        }

        var newHash = _passwordHasher.HashPassword(request.NewPassword);
        employee.UpdatePassword(newHash);

        await _employeeRepository.UpdateAsync(employee, cancellationToken);

        return ServiceResult<bool>.Success(true);
    }
}
