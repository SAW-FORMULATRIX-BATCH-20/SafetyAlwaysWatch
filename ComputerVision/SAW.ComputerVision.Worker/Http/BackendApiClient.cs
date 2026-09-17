using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SAW.ComputerVision.Worker.Configuration;

namespace SAW.ComputerVision.Worker.Http;

public class BackendApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<BackendApiClient> _logger;

    public BackendApiClient(HttpClient httpClient, IOptions<CvConfig> config, ILogger<BackendApiClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        
        var backendConfig = config.Value.Backend;
        if (!string.IsNullOrEmpty(backendConfig.ApiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("X-API-Key", backendConfig.ApiKey);
        }
    }

    public async Task SendFrameDataAsync(IngestFrameDto data, CancellationToken cancellationToken)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync($"/api/monitoring/stream/{data.CameraId}", data, cancellationToken);
            response.EnsureSuccessStatusCode();
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to send frame data for camera {CameraId}", data.CameraId);
        }
    }
}
