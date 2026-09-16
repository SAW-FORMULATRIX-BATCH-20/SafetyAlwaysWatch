using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using SafetyAlwaysWatch.Api.Controllers;
using SafetyAlwaysWatch.Api.Hubs;
using SafetyAlwaysWatch.Application.DTOs.Inference;
using SafetyAlwaysWatch.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Tests.Api.Controllers;

[TestFixture]
public class MonitoringControllerTests
{
    private Mock<IInferenceIngestionService> _mockIngestionService;
    private Mock<IHubContext<MonitoringHub>> _mockHubContext;
    private Mock<IHubClients> _mockClients;
    private Mock<IClientProxy> _mockClientProxy;
    private MonitoringController _controller;

    [SetUp]
    public void Setup()
    {
        _mockIngestionService = new Mock<IInferenceIngestionService>();
        _mockHubContext = new Mock<IHubContext<MonitoringHub>>();
        _mockClients = new Mock<IHubClients>();
        _mockClientProxy = new Mock<IClientProxy>();

        _mockHubContext.Setup(h => h.Clients).Returns(_mockClients.Object);
        _mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockClientProxy.Object);

        _controller = new MonitoringController(_mockIngestionService.Object, _mockHubContext.Object);
    }

    [Test]
    public async Task Stream_WhenCameraIdMismatch_ReturnsBadRequest()
    {
        // Arrange
        var payload = new IngestFrameDto("camera2", DateTime.UtcNow, new List<DetectedPersonDto>());

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
        var payload = new IngestFrameDto("camera1", DateTime.UtcNow, new List<DetectedPersonDto>());
        var output = new DetectionFrameOutput("camera1", payload.Timestamp, new List<DetectedPersonOutput>());

        _mockIngestionService.Setup(i => i.ProcessFrameAsync(payload, It.IsAny<CancellationToken>()))
            .ReturnsAsync(output);

        // Act
        var result = await _controller.Stream("camera1", payload);

        // Assert
        Assert.That(result, Is.InstanceOf<AcceptedResult>());
        _mockIngestionService.Verify(i => i.ProcessFrameAsync(payload, It.IsAny<CancellationToken>()), Times.Once);
        _mockClientProxy.Verify(c => c.SendCoreAsync("ReceiveDetectionFrame", new object[] { output }, It.IsAny<CancellationToken>()), Times.Once);
    }
}
