using SafetyAlwaysWatch.Application.Common;
using SafetyAlwaysWatch.Application.DTOs.Auth;

namespace SafetyAlwaysWatch.Application.Interfaces;

/// <summary>
/// Layanan bisnis untuk alur autentikasi dan manajemen kredensial pengguna.
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Memvalidasi kredensial login (email/kode karyawan & password) dan menghasilkan JWT Bearer token.
    /// </summary>
    Task<ServiceResult<AuthResponseDto>> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Mengubah password akun pengguna terautentikasi setelah memverifikasi password saat ini.
    /// </summary>
    Task<ServiceResult<bool>> ChangePasswordAsync(Guid userId, ChangePasswordRequestDto request, CancellationToken cancellationToken = default);
}
