namespace SafetyAlwaysWatch.Application.Interfaces;

/// <summary>
/// Layanan untuk hashing dan verifikasi password pengguna.
/// </summary>
public interface IPasswordHasher
{
    /// <summary>
    /// Menghasilkan hash kriptografi satu arah dari password teks polos.
    /// </summary>
    string HashPassword(string password);

    /// <summary>
    /// Memverifikasi kecocokan password teks polos terhadap hash tersimpan.
    /// </summary>
    bool VerifyPassword(string password, string passwordHash);
}
