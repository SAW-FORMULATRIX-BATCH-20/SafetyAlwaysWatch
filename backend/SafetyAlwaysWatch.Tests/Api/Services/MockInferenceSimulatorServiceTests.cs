using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using SafetyAlwaysWatch.Api.Services;
using SafetyAlwaysWatch.Application.DTOs.Inference;
using SafetyAlwaysWatch.Application.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Tests.Api.Services;

[TestFixture]
public class MockInferenceSimulatorServiceTests
{
    private Mock<IServiceScopeFactory> _mockScopeFactory;
    private Mock<IServiceScope> _mockScope;
    private Mock<IServiceProvider> _mockServiceProvider;
    private Mock<IInferenceIngestionService> _mockIngestionService;
    private Mock<IMockSimulationControl> _mockControl;
    private Mock<ILogger<MockInferenceSimulatorService>> _mockLogger;

    private MockInferenceSimulatorService _service;

    [SetUp]
    public void Setup()
    {
        _mockScopeFactory = new Mock<IServiceScopeFactory>();
        _mockScope = new Mock<IServiceScope>();
        _mockServiceProvider = new Mock<IServiceProvider>();
        _mockIngestionService = new Mock<IInferenceIngestionService>();
        _mockControl = new Mock<IMockSimulationControl>();
        _mockLogger = new Mock<ILogger<MockInferenceSimulatorService>>();

        _mockScopeFactory.Setup(x => x.CreateScope()).Returns(_mockScope.Object);
        _mockScope.Setup(x => x.ServiceProvider).Returns(_mockServiceProvider.Object);
        _mockServiceProvider.Setup(x => x.GetService(typeof(IInferenceIngestionService)))
            .Returns(_mockIngestionService.Object);

        _service = new MockInferenceSimulatorService(_mockControl.Object, _mockScopeFactory.Object, _mockLogger.Object);
        _service.SetDelay(10); // Use a short delay for tests
    }

    [TearDown]
    public void TearDown()
    {
        _service?.Dispose();
    }

    [Test]
    public async Task ExecuteAsync_WhenNotRunning_DoesNotCallProcessFrame()
    {
        // Arrange
        _mockControl.Setup(c => c.IsRunning).Returns(false);
        var cts = new CancellationTokenSource(50); // Run for 50ms

        // Act
        try { await _service.StartAsync(cts.Token); } catch (TaskCanceledException) { }

        // Assert
        _mockIngestionService.Verify(i => i.ProcessFrameAsync(It.IsAny<IngestFrameDto>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task ExecuteAsync_WhenRunning_CallsProcessFrameWithScriptedScenario()
    {
        // Arrange
        _mockControl.Setup(c => c.IsRunning).Returns(true);
        var cts = new CancellationTokenSource();

        // Act
        await _service.StartAsync(cts.Token);
        await Task.Delay(50); // allow it to loop a few times
        cts.Cancel();
        try { await _service.StopAsync(CancellationToken.None); } catch { }

        // Assert
        _mockIngestionService.Verify(i => i.ProcessFrameAsync(It.Is<IngestFrameDto>(dto => dto.Persons.Count >= 2), It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }
}
