namespace SafetyAlwaysWatch.Application.DTOs.Auth;

/// <summary>
/// Data ringkas profil karyawan terautentikasi.
/// </summary>
public class AuthenticatedUserDto
{
    public Guid Id { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Role { get; set; }
    public bool RequiresPasswordChange { get; set; }
}

/// <summary>
/// Respons sukses autentikasi memuat JWT Bearer token dan informasi pengguna.
/// </summary>
public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string TokenType { get; set; } = "Bearer";
    public int ExpiresIn { get; set; }
    public AuthenticatedUserDto User { get; set; } = null!;
}
