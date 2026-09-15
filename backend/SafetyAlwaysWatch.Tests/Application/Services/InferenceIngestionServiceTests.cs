using Moq;
using NUnit.Framework;
using SafetyAlwaysWatch.Application.DTOs.Inference;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Application.Services;
using SafetyAlwaysWatch.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Tests.Application.Services;

[TestFixture]
public class InferenceIngestionServiceTests
{
    private Mock<IIdentityResolverService> _mockIdentityResolver;
    private Mock<ITrackIdentityCache> _mockCache;
    private Mock<IViolationStabilizationService> _mockStabilization;
    private Mock<IUnitOfWork> _mockUnitOfWork;
    private InferenceIngestionService _service;

    [SetUp]
    public void Setup()
    {
        _mockIdentityResolver = new Mock<IIdentityResolverService>();
        _mockCache = new Mock<ITrackIdentityCache>();
        _mockStabilization = new Mock<IViolationStabilizationService>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();

        _service = new InferenceIngestionService(
            _mockIdentityResolver.Object,
            _mockCache.Object,
            _mockStabilization.Object,
            _mockUnitOfWork.Object
        );
    }

    [Test]
    public async Task ProcessFrameAsync_WithLostTrack_EvictsCacheAndNotifiesStabilization()
    {
        // Arrange
        var payload = new IngestFrameDto(
            "camera1",
            DateTime.UtcNow,
            new List<DetectedPersonDto>
            {
                new DetectedPersonDto("track1", new BoundingBoxDto(0,0,0,0), 0.9, null, null, new List<PpeDetectionDto>(), true)
            }
        );

        // Act
        await _service.ProcessFrameAsync(payload);

        // Assert
        _mockCache.Verify(c => c.Remove("track1"), Times.Once);
        _mockUnitOfWork.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
