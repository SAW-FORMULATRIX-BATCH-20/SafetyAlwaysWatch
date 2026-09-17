using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Domain.Entities;

namespace SafetyAlwaysWatch.Infrastructure.Security;

/// <summary>
/// Implementasi IJwtTokenService untuk menerbitkan token JWT Bearer bagi pengguna terautentikasi.
/// </summary>
public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;
    private readonly string _secret;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expiryMinutes;

    public int ExpirySeconds => _expiryMinutes * 60;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
        _secret = _configuration["JwtSettings:Secret"] ?? "super_secret_key_for_development_purposes_only_12345!";
        _issuer = _configuration["JwtSettings:Issuer"] ?? "SAW_Issuer";
        _audience = _configuration["JwtSettings:Audience"] ?? "SAW_Audience";

        if (!int.TryParse(_configuration["JwtSettings:ExpiryMinutes"], out _expiryMinutes) || _expiryMinutes <= 0)
        {
            _expiryMinutes = 60;
        }
    }

    public string GenerateToken(Employee employee)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_secret);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, employee.Id.ToString()),
            new(ClaimTypes.Name, employee.FullName),
            new("EmployeeCode", employee.EmployeeCode),
            new("RequiresPasswordChange", employee.RequiresPasswordChange.ToString().ToLowerInvariant())
        };

        if (!string.IsNullOrWhiteSpace(employee.Email))
        {
            claims.Add(new Claim(ClaimTypes.Email, employee.Email));
        }

        if (employee.Role.HasValue)
        {
            claims.Add(new Claim(ClaimTypes.Role, employee.Role.Value.ToString()));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_expiryMinutes),
            Issuer = _issuer,
            Audience = _audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
