using Moq;
using NUnit.Framework;
using SafetyAlwaysWatch.Application.DTOs.Inference;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Application.Services;
using SafetyAlwaysWatch.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
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
    private Mock<IZoneComplianceEvaluator> _mockZoneEvaluator;
    private Mock<IInferenceResultPublisher> _mockPublisher;
    private InferenceIngestionService _service;

    [SetUp]
    public void Setup()
    {
        _mockIdentityResolver = new Mock<IIdentityResolverService>();
        _mockCache = new Mock<ITrackIdentityCache>();
        _mockStabilization = new Mock<IViolationStabilizationService>();
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockZoneEvaluator = new Mock<IZoneComplianceEvaluator>();
        _mockPublisher = new Mock<IInferenceResultPublisher>();

        _service = new InferenceIngestionService(
            _mockIdentityResolver.Object,
            _mockCache.Object,
            _mockStabilization.Object,
            _mockUnitOfWork.Object,
            _mockZoneEvaluator.Object,
            _mockPublisher.Object
        );
    }

    [Test]
    public async Task ProcessFrameAsync_WithNoDetections_ReturnsEmptyOutputAndNoSubServicesCalled()
    {
        // Arrange
        var payload = new IngestFrameDto("camera1", DateTime.UtcNow, new List<DetectedPersonDto>());

        // Act
        var result = await _service.ProcessFrameAsync(payload);

        // Assert
        Assert.That(result.Persons, Is.Empty);
        _mockIdentityResolver.Verify(i => i.ResolveIdentityAsync(It.IsAny<string>(), It.IsAny<byte[]>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockZoneEvaluator.Verify(z => z.EvaluateAsync(It.IsAny<string>(), It.IsAny<DetectedPersonDto>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task ProcessFrameAsync_SingleDetectionNotInZone_NoViolationProcessing()
    {
        // Arrange
        var personDto = new DetectedPersonDto("track1", new BoundingBoxDto(0, 0, 0, 0), 0.9, null, null, new List<PpeDetectionDto>(), false);
        var payload = new IngestFrameDto("camera1", DateTime.UtcNow, new List<DetectedPersonDto> { personDto });

        _mockIdentityResolver.Setup(i => i.ResolveIdentityAsync("track1", null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IdentityResult(null, "Unknown", null, false));
        
        _mockZoneEvaluator.Setup(z => z.EvaluateAsync("camera1", personDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ZoneComplianceResult(false, null, true, null));

        // Act
        var result = await _service.ProcessFrameAsync(payload);

        // Assert
        Assert.That(result.Persons.First().IsCompliant, Is.True);
        _mockStabilization.Verify(s => s.ProcessDetectionAsync(It.IsAny<string>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<bool>(), It.IsAny<double>(), It.IsAny<DateTimeOffset>(), It.IsAny<Guid?>(), It.IsAny<byte[]>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockPublisher.Verify(p => p.PublishAsync("camera1", result, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task ProcessFrameAsync_SingleDetectionInZoneMissingPpe_CallsStabilization()
    {
        // Arrange
        var personDto = new DetectedPersonDto("track1", new BoundingBoxDto(0, 0, 0, 0), 0.9, null, null, new List<PpeDetectionDto>(), false);
        var payload = new IngestFrameDto("camera1", DateTime.UtcNow, new List<DetectedPersonDto> { personDto });

        var identityResult = new IdentityResult(Guid.NewGuid(), "John Doe", 100, true);
        _mockIdentityResolver.Setup(i => i.ResolveIdentityAsync("track1", null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(identityResult);
        
        var zoneId = Guid.NewGuid();
        var missingPpeId = Guid.NewGuid();
        _mockZoneEvaluator.Setup(z => z.EvaluateAsync("camera1", personDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ZoneComplianceResult(true, zoneId, false, missingPpeId));

        // Act
        var result = await _service.ProcessFrameAsync(payload);

        // Assert
        Assert.That(result.Persons.First().IsCompliant, Is.False);
        _mockStabilization.Verify(s => s.ProcessDetectionAsync(
            "track1", zoneId, missingPpeId, false, 0.9, payload.Timestamp, identityResult.EmployeeId, null, It.IsAny<CancellationToken>()
        ), Times.Once);
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
        _mockStabilization.Verify(s => s.HandleLostTrackAsync("track1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public void ProcessFrameAsync_WhenExceptionOccurs_RollsBackTransaction()
    {
        // Arrange
        var personDto = new DetectedPersonDto("track1", new BoundingBoxDto(0, 0, 0, 0), 0.9, null, null, new List<PpeDetectionDto>(), false);
        var payload = new IngestFrameDto("camera1", DateTime.UtcNow, new List<DetectedPersonDto> { personDto });

        _mockIdentityResolver.Setup(i => i.ResolveIdentityAsync(It.IsAny<string>(), It.IsAny<byte[]>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act & Assert
        Assert.ThrowsAsync<Exception>(async () => await _service.ProcessFrameAsync(payload));
        _mockUnitOfWork.Verify(u => u.RollbackAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
