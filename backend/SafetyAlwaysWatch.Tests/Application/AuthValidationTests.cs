using NUnit.Framework;
using SafetyAlwaysWatch.Application.DTOs.Auth;
using SafetyAlwaysWatch.Application.Validators;

namespace SafetyAlwaysWatch.Tests.Application;

[TestFixture]
public class AuthValidationTests
{
    private LoginRequestValidator _loginValidator;
    private ChangePasswordRequestValidator _changePasswordValidator;

    [SetUp]
    public void SetUp()
    {
        _loginValidator = new LoginRequestValidator();
        _changePasswordValidator = new ChangePasswordRequestValidator();
    }

    [Test]
    public void LoginValidator_WithValidInput_Passes()
    {
        var request = new LoginRequestDto
        {
            Identifier = "admin@saw.local",
            Password = "Password123!"
        };

        var result = _loginValidator.Validate(request);

        Assert.That(result.IsValid, Is.True);
    }

    [TestCase("", "Password123!")]
    [TestCase(null, "Password123!")]
    [TestCase("admin@saw.local", "")]
    [TestCase("admin@saw.local", null)]
    public void LoginValidator_WithMissingFields_Fails(string? identifier, string? password)
    {
        var request = new LoginRequestDto
        {
            Identifier = identifier!,
            Password = password!
        };

        var result = _loginValidator.Validate(request);

        Assert.That(result.IsValid, Is.False);
    }

    [Test]
    public void ChangePasswordValidator_WithValidInput_Passes()
    {
        var request = new ChangePasswordRequestDto
        {
            CurrentPassword = "OldPassword123!",
            NewPassword = "NewSecurePassword456!"
        };

        var result = _changePasswordValidator.Validate(request);

        Assert.That(result.IsValid, Is.True);
    }

    [TestCase("", "NewPassword123!")]
    [TestCase("OldPassword123!", "")]
    [TestCase("OldPassword123!", "12345")] // Kurang dari 6 karakter
    public void ChangePasswordValidator_WithInvalidFields_Fails(string currentPassword, string newPassword)
    {
        var request = new ChangePasswordRequestDto
        {
            CurrentPassword = currentPassword,
            NewPassword = newPassword
        };

        var result = _changePasswordValidator.Validate(request);

        Assert.That(result.IsValid, Is.False);
    }
}
