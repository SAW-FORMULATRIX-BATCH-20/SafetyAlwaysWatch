using NUnit.Framework;
using SafetyAlwaysWatch.Application.DTOs.Inference;
using SafetyAlwaysWatch.Infrastructure.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Tests.Infrastructure.Services;

[TestFixture]
public class DummyZoneComplianceEvaluatorTests
{
    private DummyZoneComplianceEvaluator _evaluator;

    [SetUp]
    public void Setup()
    {
        _evaluator = new DummyZoneComplianceEvaluator();
    }

    [Test]
    public async Task EvaluateAsync_WhenTrackIdIsSimViolator_ReturnsNonCompliant()
    {
        // Arrange
        var person = new DetectedPersonDto("sim_violator", new BoundingBoxDto(0, 0, 0, 0), 0.9, null, new List<PpeDetectionDto>(), false);

        // Act
        var result = await _evaluator.EvaluateAsync("cam1", person);

        // Assert
        Assert.That(result.IsInZone, Is.True);
        Assert.That(result.IsCompliant, Is.False);
        Assert.That(result.HazardousZoneId, Is.Not.Null);
        Assert.That(result.MissingPpeClassId, Is.Not.Null);
    }

    [Test]
    public async Task EvaluateAsync_WhenTrackIdIsNotSimViolator_ReturnsCompliant()
    {
        // Arrange
        var person = new DetectedPersonDto("sim_compliant", new BoundingBoxDto(0, 0, 0, 0), 0.9, null, new List<PpeDetectionDto>(), false);

        // Act
        var result = await _evaluator.EvaluateAsync("cam1", person);

        // Assert
        Assert.That(result.IsCompliant, Is.True);
    }
}
