using SafetyAlwaysWatch.Domain.Entities;

namespace SafetyAlwaysWatch.Application.Interfaces;

/// <summary>
/// Layanan pembuatan token autentikasi JWT.
/// </summary>
public interface IJwtTokenService
{
    /// <summary>
    /// Menghasilkan token JWT yang ditandatangani untuk entitas Employee.
    /// </summary>
    string GenerateToken(Employee employee);

    /// <summary>
    /// Masa berlaku token dalam detik.
    /// </summary>
    int ExpirySeconds { get; }
}
