namespace SafetyAlwaysWatch.Application.DTOs.Auth;

/// <summary>
/// Permintaan perubahan password oleh pengguna terautentikasi.
/// </summary>
public class ChangePasswordRequestDto
{
    /// <summary>
    /// Password saat ini untuk verifikasi identitas.
    /// </summary>
    public string CurrentPassword { get; set; } = string.Empty;

    /// <summary>
    /// Password baru yang diinginkan (minimal 6 karakter).
    /// </summary>
    public string NewPassword { get; set; } = string.Empty;
}
