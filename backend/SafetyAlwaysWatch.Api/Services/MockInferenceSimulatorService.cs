using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SafetyAlwaysWatch.Application.DTOs.Inference;
using SafetyAlwaysWatch.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Api.Services;

public class MockInferenceSimulatorService : BackgroundService
{
    private readonly IMockSimulationControl _simulationControl;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MockInferenceSimulatorService> _logger;
    private int _delayMs = 1000;

    public MockInferenceSimulatorService(
        IMockSimulationControl simulationControl,
        IServiceScopeFactory scopeFactory,
        ILogger<MockInferenceSimulatorService> logger)
    {
        _simulationControl = simulationControl;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public void SetDelay(int delayMs)
    {
        _delayMs = delayMs;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Mock Inference Simulator Service is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            if (_simulationControl.IsRunning)
            {
                try
                {
                    await RunSimulationStepAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during mock simulation step.");
                }
            }

            await Task.Delay(_delayMs, stoppingToken);
        }

        _logger.LogInformation("Mock Inference Simulator Service is stopping.");
    }

    private async Task RunSimulationStepAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var ingestionService = scope.ServiceProvider.GetRequiredService<IInferenceIngestionService>();

        var payload = new IngestFrameDto(
            CameraId: "sim_cam_1",
            Timestamp: DateTime.UtcNow,
            Persons: new List<DetectedPersonDto>
            {
                // Compliant person (with a mock employee id)
                new DetectedPersonDto(
                    TrackId: "sim_compliant",
                    BoundingBox: new BoundingBoxDto(10, 10, 50, 50),
                    Confidence: 0.95,
                    SimulatedEmployeeId: Guid.NewGuid(),
                    FaceEmbedding: null,
                    PpeDetections: new List<PpeDetectionDto>
                    {
                        new PpeDetectionDto(1, new BoundingBoxDto(10, 10, 20, 20), 0.9)
                    },
                    IsTrackLost: false
                ),
                // Violator person (unknown)
                new DetectedPersonDto(
                    TrackId: "sim_violator",
                    BoundingBox: new BoundingBoxDto(100, 100, 50, 50),
                    Confidence: 0.85,
                    SimulatedEmployeeId: null,
                    FaceEmbedding: null,
                    PpeDetections: new List<PpeDetectionDto>(),
                    IsTrackLost: false
                )
            }
        );

        await ingestionService.ProcessFrameAsync(payload, cancellationToken);
    }
}
