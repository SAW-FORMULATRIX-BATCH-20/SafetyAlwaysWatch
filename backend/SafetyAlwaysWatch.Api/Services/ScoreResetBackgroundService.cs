using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SafetyAlwaysWatch.Application.Interfaces;

namespace SafetyAlwaysWatch.Api.Services;

public class ScoreResetBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ScoreResetBackgroundService> _logger;

    public ScoreResetBackgroundService(IServiceProvider serviceProvider, ILogger<ScoreResetBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ScoreResetBackgroundService is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTimeOffset.UtcNow;
            // Target next 00:00 UTC for daily reset
            var nextRunTime = now.Date.AddDays(1);
            var initialDelay = nextRunTime - now;

            // Wait until 00:00
            try
            {
                await Task.Delay(initialDelay, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }

            _logger.LogInformation("Executing Scheduled Score Reset at {time}", DateTimeOffset.UtcNow);

            try
            {
                using var scope = _serviceProvider.CreateScope();
                var resetService = scope.ServiceProvider.GetRequiredService<IScoreResetService>();
                await resetService.ExecuteScheduledResetAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while executing scheduled score reset.");
            }
        }
    }
}
