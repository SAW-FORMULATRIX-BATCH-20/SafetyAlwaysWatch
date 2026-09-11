namespace SafetyAlwaysWatch.Application.DTOs.Auth;

/// <summary>
/// Permintaan login pengguna.
/// </summary>
public class LoginRequestDto
{
    /// <summary>
    /// Email atau kode karyawan (mis. "admin@saw.local" atau "ADM-001").
    /// </summary>
    public string Identifier { get; set; } = string.Empty;

    /// <summary>
    /// Password akun pengguna.
    /// </summary>
    public string Password { get; set; } = string.Empty;
}
