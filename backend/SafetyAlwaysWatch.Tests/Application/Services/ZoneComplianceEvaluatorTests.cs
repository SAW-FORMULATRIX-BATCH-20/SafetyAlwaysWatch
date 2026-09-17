using Moq;
using NUnit.Framework;
using SafetyAlwaysWatch.Application.DTOs.Inference;
using SafetyAlwaysWatch.Application.Services;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Tests.Application.Services;

public class ZoneComplianceEvaluatorTests
{
    private Mock<IRepository<HazardousZone>> _mockRepo;
    private ZoneComplianceEvaluator _evaluator;

    [SetUp]
    public void SetUp()
    {
        _mockRepo = new Mock<IRepository<HazardousZone>>();
        _evaluator = new ZoneComplianceEvaluator(_mockRepo.Object);
    }

    [Test]
    public async Task EvaluateAsync_InvalidCameraId_ReturnsNotCompliantNotInZone()
    {
        var result = await _evaluator.EvaluateAsync("invalid-guid", new DetectedPersonDto("t1", new BoundingBoxDto(0,0,0,0), 0.9, null, new List<PpeDetectionDto>(), false));
        Assert.That(result.IsInZone, Is.False);
        Assert.That(result.IsCompliant, Is.True);
    }

    [Test]
    public async Task EvaluateAsync_NoActiveZones_ReturnsNotCompliantNotInZone()
    {
        _mockRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<HazardousZone, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<HazardousZone>());

        var result = await _evaluator.EvaluateAsync(Guid.NewGuid().ToString(), new DetectedPersonDto("t1", new BoundingBoxDto(0,0,0,0), 0.9, null, new List<PpeDetectionDto>(), false));
        Assert.That(result.IsInZone, Is.False);
        Assert.That(result.IsCompliant, Is.True);
    }

    [Test]
    public async Task EvaluateAsync_OutsideZone_ReturnsNotInZone()
    {
        var zone = new HazardousZone("Zone A", 0.1, 0.1, 0.2, 0.2, Guid.NewGuid());
        _mockRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<HazardousZone, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<HazardousZone> { zone });

        // Person at 0.5, 0.5 (outside 0.1-0.3)
        var person = new DetectedPersonDto("t1", new BoundingBoxDto(0.5, 0.5, 0.1, 0.1), 0.9, null, new List<PpeDetectionDto>(), false);
        
        var result = await _evaluator.EvaluateAsync(zone.CameraSourceId.ToString()!, person);
        Assert.That(result.IsInZone, Is.False);
    }

    [Test]
    public async Task EvaluateAsync_InsideZone_NoPpeRequired_ReturnsCompliant()
    {
        var zone = new HazardousZone("Zone A", 0.1, 0.1, 0.5, 0.5, Guid.NewGuid());
        _mockRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<HazardousZone, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<HazardousZone> { zone });

        // Person inside zone
        var person = new DetectedPersonDto("t1", new BoundingBoxDto(0.2, 0.2, 0.1, 0.1), 0.9, null, new List<PpeDetectionDto>(), false);
        
        var result = await _evaluator.EvaluateAsync(zone.CameraSourceId.ToString()!, person);
        Assert.That(result.IsInZone, Is.True);
        Assert.That(result.IsCompliant, Is.True);
        Assert.That(result.HazardousZoneId, Is.EqualTo(zone.Id));
    }

    [Test]
    public async Task EvaluateAsync_InsideZone_MissingPpe_ReturnsNonCompliant()
    {
        var zone = new HazardousZone("Zone A", 0.1, 0.1, 0.5, 0.5, Guid.NewGuid());
        var requiredPpe = Guid.Parse("ebcc3638-4eb9-407f-afbd-329cc658b4ba"); // Helm Keselamatan
        zone.SetRequiredPpeClasses(new List<Guid> { requiredPpe });

        _mockRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<HazardousZone, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<HazardousZone> { zone });

        // Person inside zone, no PPE detected
        var person = new DetectedPersonDto("t1", new BoundingBoxDto(0.2, 0.2, 0.1, 0.1), 0.9, null, new List<PpeDetectionDto>(), false);
        
        var result = await _evaluator.EvaluateAsync(zone.CameraSourceId.ToString()!, person);
        Assert.That(result.IsInZone, Is.True);
        Assert.That(result.IsCompliant, Is.False);
        Assert.That(result.MissingPpeClassIds, Contains.Item(requiredPpe));
    }

    [Test]
    public async Task EvaluateAsync_InsideZone_HasPpe_ReturnsCompliant()
    {
        var zone = new HazardousZone("Zone A", 0.1, 0.1, 0.5, 0.5, Guid.NewGuid());
        var requiredPpe = Guid.Parse("ebcc3638-4eb9-407f-afbd-329cc658b4ba"); // Helm Keselamatan
        zone.SetRequiredPpeClasses(new List<Guid> { requiredPpe });

        _mockRepo.Setup(r => r.FindAsync(It.IsAny<Expression<Func<HazardousZone, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<HazardousZone> { zone });

        // Person inside zone, has Helm Keselamatan (class index 0)
        var person = new DetectedPersonDto("t1", new BoundingBoxDto(0.2, 0.2, 0.1, 0.1), 0.9, null, new List<PpeDetectionDto>
        {
            new PpeDetectionDto(0, new BoundingBoxDto(0.2, 0.2, 0.05, 0.05), 0.95)
        }, false);
        
        var result = await _evaluator.EvaluateAsync(zone.CameraSourceId.ToString()!, person);
        Assert.That(result.IsInZone, Is.True);
        Assert.That(result.IsCompliant, Is.True);
        Assert.That(result.MissingPpeClassIds, Is.Null);
    }
}
