using MockQueryable.Moq;
using Moq;
using NUnit.Framework;
using SafetyAlwaysWatch.Application.DTOs.Inference;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Interfaces;
using SafetyAlwaysWatch.Infrastructure.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Tests.Infrastructure.Services;

[TestFixture]
public class ZoneComplianceEvaluatorTests
{
    private Mock<IRepository<HazardousZone>> _mockZoneRepository;
    private ZoneComplianceEvaluator _evaluator;

    [SetUp]
    public void Setup()
    {
        _mockZoneRepository = new Mock<IRepository<HazardousZone>>();
        _evaluator = new ZoneComplianceEvaluator(_mockZoneRepository.Object);
    }

    [Test]
    public async Task EvaluateAsync_InvalidCameraId_ReturnsCompliantAndNotInZone()
    {
        // Act
        var result = await _evaluator.EvaluateAsync("invalid-guid", new DetectedPersonDto("track1", new BoundingBoxDto(0, 0, 0, 0), 0.9, null, new List<PpeDetectionDto>(), false));

        // Assert
        Assert.That(result.IsInZone, Is.False);
        Assert.That(result.IsCompliant, Is.True);
    }

    [Test]
    public async Task EvaluateAsync_PersonOutsideZone_ReturnsCompliantAndNotInZone()
    {
        // Arrange
        var cameraId = Guid.NewGuid();
        var zone = new HazardousZone("Zone1", 0.1, 0.1, 0.2, 0.2, cameraId);
        _mockZoneRepository.Setup(r => r.Query()).Returns(new List<HazardousZone> { zone }.AsQueryable().BuildMock());

        var personBox = new BoundingBoxDto(0.5, 0.5, 0.1, 0.1); // Outside (0.1-0.3)
        var person = new DetectedPersonDto("track1", personBox, 0.9, null, new List<PpeDetectionDto>(), false);

        // Act
        var result = await _evaluator.EvaluateAsync(cameraId.ToString(), person);

        // Assert
        Assert.That(result.IsInZone, Is.False);
        Assert.That(result.IsCompliant, Is.True);
    }

    [Test]
    public async Task EvaluateAsync_PersonInsideZoneMissingPpe_ReturnsNonCompliant()
    {
        // Arrange
        var cameraId = Guid.NewGuid();
        var zone = new HazardousZone("Zone1", 0.1, 0.1, 0.5, 0.5, cameraId);
        
        // Ppe class 1 Guid
        var requiredPpeGuid = GetGuidForClassIndex(1);
        zone.SetRequiredPpeClasses(new List<Guid> { requiredPpeGuid });

        _mockZoneRepository.Setup(r => r.Query()).Returns(new List<HazardousZone> { zone }.AsQueryable().BuildMock());

        var personBox = new BoundingBoxDto(0.2, 0.2, 0.1, 0.1); // Inside zone
        var person = new DetectedPersonDto("track1", personBox, 0.9, null, new List<PpeDetectionDto>(), false); // Missing PPE

        // Act
        var result = await _evaluator.EvaluateAsync(cameraId.ToString(), person);

        // Assert
        Assert.That(result.IsInZone, Is.True);
        Assert.That(result.IsCompliant, Is.False);
        Assert.That(result.MissingPpeClassIds, Contains.Item(requiredPpeGuid));
        Assert.That(result.HazardousZoneId, Is.EqualTo(zone.Id));
    }

    [Test]
    public async Task EvaluateAsync_PersonInsideZoneWithPpe_ReturnsCompliant()
    {
        // Arrange
        var cameraId = Guid.NewGuid();
        var zone = new HazardousZone("Zone1", 0.1, 0.1, 0.5, 0.5, cameraId);
        
        var requiredPpeGuid = GetGuidForClassIndex(1);
        zone.SetRequiredPpeClasses(new List<Guid> { requiredPpeGuid });

        _mockZoneRepository.Setup(r => r.Query()).Returns(new List<HazardousZone> { zone }.AsQueryable().BuildMock());

        var personBox = new BoundingBoxDto(0.2, 0.2, 0.1, 0.1); // Inside zone
        var ppeDetection = new PpeDetectionDto(1, new BoundingBoxDto(0.2, 0.2, 0.1, 0.1), 0.9);
        var person = new DetectedPersonDto("track1", personBox, 0.9, null, new List<PpeDetectionDto> { ppeDetection }, false); 

        // Act
        var result = await _evaluator.EvaluateAsync(cameraId.ToString(), person);

        // Assert
        Assert.That(result.IsInZone, Is.True);
        Assert.That(result.IsCompliant, Is.True);
        Assert.That(result.MissingPpeClassIds, Is.Empty);
    }

    private Guid GetGuidForClassIndex(int classIndex)
    {
        var bytes = new byte[16];
        BitConverter.GetBytes(classIndex).CopyTo(bytes, 0);
        return new Guid(bytes);
    }
}
