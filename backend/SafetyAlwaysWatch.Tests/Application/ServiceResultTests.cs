using NUnit.Framework;
using SafetyAlwaysWatch.Application.Common;

namespace SafetyAlwaysWatch.Tests.Application;

[TestFixture]
public class ServiceResultTests
{
    [Test]
    public void Success_ReturnsIsSuccessTrue_AndSetsData()
    {
        // Arrange
        var expectedData = "Test Data";

        // Act
        var result = ServiceResult<string>.Success(expectedData);

        // Assert
        Assert.IsTrue(result.IsSuccess);
        Assert.That(result.Data, Is.EqualTo(expectedData));
        Assert.IsNull(result.ErrorMessage);
        Assert.IsEmpty(result.ValidationErrors);
    }

    [Test]
    public void Failure_ReturnsIsSuccessFalse_AndSetsErrorMessage()
    {
        // Arrange
        var expectedErrorMessage = "An error occurred";

        // Act
        var result = ServiceResult<string>.Failure(expectedErrorMessage);

        // Assert
        Assert.IsFalse(result.IsSuccess);
        Assert.That(result.ErrorMessage, Is.EqualTo(expectedErrorMessage));
        Assert.IsNull(result.Data);
        Assert.IsEmpty(result.ValidationErrors);
    }

    [Test]
    public void ValidationFailure_ReturnsIsSuccessFalse_AndSetsValidationErrors()
    {
        // Arrange
        var validationErrors = new Dictionary<string, string[]>
        {
            { "Field1", new[] { "Error1" } }
        };

        // Act
        var result = ServiceResult<string>.ValidationFailure(validationErrors);

        // Assert
        Assert.IsFalse(result.IsSuccess);
        Assert.That(result.ErrorMessage, Is.EqualTo("Validation failed."));
        Assert.That(result.ValidationErrors, Is.EqualTo(validationErrors));
        Assert.IsNull(result.Data);
    }
}
