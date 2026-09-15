using NUnit.Framework;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Infrastructure.Security;

namespace SafetyAlwaysWatch.Tests.Infrastructure;

[TestFixture]
public class PasswordHasherTests
{
    private IPasswordHasher _hasher;

    [SetUp]
    public void SetUp()
    {
        _hasher = new PasswordHasher();
    }

    [Test]
    public void HashPassword_WithValidPassword_ReturnsNonEmptyHashWithSalt()
    {
        // Act
        var hash = _hasher.HashPassword("Admin123!");

        // Assert
        Assert.That(hash, Is.Not.Null);
        Assert.That(hash, Is.Not.Empty);
        Assert.That(hash.Contains('.'), Is.True);
    }

    [Test]
    public void VerifyPassword_WithCorrectPassword_ReturnsTrue()
    {
        // Arrange
        const string password = "SecretPassword@2026";
        var hash = _hasher.HashPassword(password);

        // Act
        var isValid = _hasher.VerifyPassword(password, hash);

        // Assert
        Assert.That(isValid, Is.True);
    }

    [Test]
    public void VerifyPassword_WithIncorrectPassword_ReturnsFalse()
    {
        // Arrange
        const string password = "SecretPassword@2026";
        var hash = _hasher.HashPassword(password);

        // Act
        var isValid = _hasher.VerifyPassword("WrongPassword123!", hash);

        // Assert
        Assert.That(isValid, Is.False);
    }

    [Test]
    public void HashPassword_SamePasswordMultipleTimes_GeneratesUniqueSalts()
    {
        // Arrange
        const string password = "RepeatablePassword123!";

        // Act
        var hash1 = _hasher.HashPassword(password);
        var hash2 = _hasher.HashPassword(password);

        // Assert
        Assert.That(hash1, Is.Not.EqualTo(hash2));
        Assert.That(_hasher.VerifyPassword(password, hash1), Is.True);
        Assert.That(_hasher.VerifyPassword(password, hash2), Is.True);
    }
}
