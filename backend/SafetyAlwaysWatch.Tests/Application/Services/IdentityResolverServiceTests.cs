using Moq;
using NUnit.Framework;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Application.Services;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Interfaces;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Tests.Application.Services;

[TestFixture]
public class IdentityResolverServiceTests
{
    private Mock<ITrackIdentityCache> _mockCache;
    private Mock<IFaceRecognitionService> _mockFaceRecognition;
    private Mock<IRepository<Employee>> _mockEmployeeRepo;
    private IdentityResolverService _service;

    [SetUp]
    public void Setup()
    {
        _mockCache = new Mock<ITrackIdentityCache>();
        _mockFaceRecognition = new Mock<IFaceRecognitionService>();
        _mockEmployeeRepo = new Mock<IRepository<Employee>>();

        _service = new IdentityResolverService(
            _mockCache.Object,
            _mockFaceRecognition.Object,
            _mockEmployeeRepo.Object
        );
    }

    [Test]
    public async Task ResolveIdentityAsync_WhenFoundInCache_ReturnsCachedResult()
    {
        // Arrange
        var trackId = "track1";
        var expectedResult = new IdentityResult(Guid.NewGuid(), "John Doe", 100, true);
        _mockCache.Setup(c => c.Get(trackId)).Returns(expectedResult);

        // Act
        var result = await _service.ResolveIdentityAsync(trackId, null);

        // Assert
        Assert.That(result, Is.EqualTo(expectedResult));
        _mockFaceRecognition.Verify(f => f.MatchEmbeddingAsync(It.IsAny<byte[]>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task ResolveIdentityAsync_WithEmbedding_MatchesFaceAndCaches()
    {
        // Arrange
        var trackId = "track1";
        var faceEmbedding = new byte[] { 1, 2, 3 };
        var matchedId = Guid.NewGuid();
        var employee = new Employee(matchedId, "EMP02", "Matched User", Guid.NewGuid(), 100);

        _mockFaceRecognition.Setup(f => f.MatchEmbeddingAsync(faceEmbedding, It.IsAny<CancellationToken>())).ReturnsAsync(matchedId);
        _mockEmployeeRepo.Setup(r => r.GetByIdAsync(matchedId, It.IsAny<CancellationToken>())).ReturnsAsync(employee);

        // Act
        var result = await _service.ResolveIdentityAsync(trackId, faceEmbedding);

        // Assert
        Assert.That(result.EmployeeId, Is.EqualTo(matchedId));
        Assert.That(result.DisplayName, Is.EqualTo("Matched User"));
        Assert.That(result.IsIdentified, Is.True);
        _mockCache.Verify(c => c.Set(trackId, result), Times.Once);
    }

    [Test]
    public async Task ResolveIdentityAsync_WithUnknownFace_ReturnsUnknownWithoutCaching()
    {
        // Arrange
        var trackId = "track1";
        var faceEmbedding = new byte[] { 1, 2, 3 };

        _mockFaceRecognition.Setup(f => f.MatchEmbeddingAsync(faceEmbedding, It.IsAny<CancellationToken>())).ReturnsAsync((Guid?)null);

        // Act
        var result = await _service.ResolveIdentityAsync(trackId, faceEmbedding);

        // Assert
        Assert.That(result.EmployeeId, Is.Null);
        Assert.That(result.DisplayName, Is.EqualTo("Unknown"));
        Assert.That(result.IsIdentified, Is.False);
        _mockCache.Verify(c => c.Set(It.IsAny<string>(), It.IsAny<IdentityResult>()), Times.Never);
    }
}
