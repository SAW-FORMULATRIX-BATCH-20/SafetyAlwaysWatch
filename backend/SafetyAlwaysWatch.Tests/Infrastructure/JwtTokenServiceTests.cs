using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using NUnit.Framework;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Enums;
using SafetyAlwaysWatch.Infrastructure.Security;

namespace SafetyAlwaysWatch.Tests.Infrastructure;

[TestFixture]
public class JwtTokenServiceTests
{
    private IConfiguration _configuration;
    private IJwtTokenService _jwtTokenService;

    [SetUp]
    public void SetUp()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "JwtSettings:Secret", "this_is_a_very_secure_and_long_jwt_secret_key_12345!" },
            { "JwtSettings:Issuer", "SAW_Issuer" },
            { "JwtSettings:Audience", "SAW_Audience" },
            { "JwtSettings:ExpiryMinutes", "60" }
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        _jwtTokenService = new JwtTokenService(_configuration);
    }

    [Test]
    public void GenerateToken_ReturnsValidJwtString()
    {
        // Arrange
        var employee = new Employee(
            Guid.NewGuid(),
            "ADM-001",
            "Admin SAW",
            Guid.NewGuid(),
            100.0,
            "admin@saw.local",
            "dummy_hash",
            EmployeeRole.Admin,
            false);

        // Act
        var token = _jwtTokenService.GenerateToken(employee);

        // Assert
        Assert.That(token, Is.Not.Null);
        Assert.That(token, Is.Not.Empty);
        var parts = token.Split('.');
        Assert.That(parts.Length, Is.EqualTo(3));
    }

    [Test]
    public void GenerateToken_ContainsExpectedClaims()
    {
        // Arrange
        var empId = Guid.NewGuid();
        var employee = new Employee(
            empId,
            "SUP-001",
            "Budi Supervisor",
            Guid.NewGuid(),
            90.0,
            "budi@saw.local",
            "dummy_hash",
            EmployeeRole.Supervisor,
            true);

        // Act
        var token = _jwtTokenService.GenerateToken(employee);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);

        var nameIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "nameid");
        Assert.That(nameIdClaim, Is.Not.Null);
        Assert.That(nameIdClaim!.Value, Is.EqualTo(empId.ToString()));

        var roleClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role || c.Type == "role");
        Assert.That(roleClaim, Is.Not.Null);
        Assert.That(roleClaim!.Value, Is.EqualTo("Supervisor"));

        var emailClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email || c.Type == "email");
        Assert.That(emailClaim, Is.Not.Null);
        Assert.That(emailClaim!.Value, Is.EqualTo("budi@saw.local"));

        var codeClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "EmployeeCode");
        Assert.That(codeClaim, Is.Not.Null);
        Assert.That(codeClaim!.Value, Is.EqualTo("SUP-001"));

        var reqChangeClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "RequiresPasswordChange");
        Assert.That(reqChangeClaim, Is.Not.Null);
        Assert.That(reqChangeClaim!.Value, Is.EqualTo("true"));
    }
}
