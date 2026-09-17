using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using SafetyAlwaysWatch.Api.Controllers;
using SafetyAlwaysWatch.Application.DTOs.Inference;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Api.Services;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Tests.Api.Controllers;

[TestFixture]
public class MonitoringControllerTests
{
    private Mock<IInferenceIngestionService> _mockIngestionService;
    private Mock<IMockSimulationControl> _mockSimulationControl;
    private MonitoringController _controller;

    [SetUp]
    public void Setup()
    {
        _mockIngestionService = new Mock<IInferenceIngestionService>();
        _mockSimulationControl = new Mock<IMockSimulationControl>();
        _controller = new MonitoringController(_mockIngestionService.Object, _mockSimulationControl.Object);
    }

    [Test]
    public async Task Stream_WhenCameraIdMismatch_ReturnsBadRequest()
    {
        // Arrange
        var payload = new IngestFrameDto("camera2", DateTimeOffset.UtcNow, new List<DetectedPersonDto>(), null);

        // Act
        var result = await _controller.Stream("camera1", payload);

        // Assert
        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        _mockIngestionService.Verify(i => i.ProcessFrameAsync(It.IsAny<IngestFrameDto>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Stream_WhenValidPayload_ProcessesFrameAndBroadcastsAndReturnsAccepted()
    {
        // Arrange
        var payload = new IngestFrameDto("camera1", DateTimeOffset.UtcNow, new List<DetectedPersonDto>(), null);
        var output = new DetectionFrameOutput("camera1", payload.Timestamp, new List<DetectedPersonOutput>());

        _mockIngestionService.Setup(i => i.ProcessFrameAsync(payload, It.IsAny<CancellationToken>()))
            .ReturnsAsync(output);

        // Act
        var result = await _controller.Stream("camera1", payload);

        // Assert
        Assert.That(result, Is.InstanceOf<AcceptedResult>());
        _mockIngestionService.Verify(i => i.ProcessFrameAsync(payload, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public void SimulateStart_CallsStartOnControlAndReturnsOk()
    {
        // Act
        var result = _controller.SimulateStart();

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        _mockSimulationControl.Verify(c => c.Start(), Times.Once);
    }

    [Test]
    public void SimulateStop_CallsStopOnControlAndReturnsOk()
    {
        // Act
        var result = _controller.SimulateStop();

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());
        _mockSimulationControl.Verify(c => c.Stop(), Times.Once);
    }
}
