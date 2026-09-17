using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenCvSharp;
using SAW.ComputerVision.Core.Pipeline;

namespace SAW.ComputerVision.Worker;

public class CameraWorker : BackgroundService
{
    private readonly ILogger<CameraWorker> _logger;
    private readonly IFrameProcessor _frameProcessor;
    private readonly HttpClient _httpClient;
    private readonly WorkerOptions _options;

    public CameraWorker(
        ILogger<CameraWorker> logger,
        IFrameProcessor frameProcessor,
        HttpClient httpClient,
        IOptions<WorkerOptions> options)
    {
        _logger = logger;
        _frameProcessor = frameProcessor;
        _httpClient = httpClient;
        _options = options.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("CameraWorker starting for CameraId: {CameraId} at {Time}", _options.CameraId, DateTimeOffset.Now);

        using var capture = new VideoCapture(_options.RtspUrl);
        if (!capture.IsOpened())
        {
            _logger.LogError("Failed to open RTSP stream: {RtspUrl}", _options.RtspUrl);
            return;
        }

        var delayMs = 1000 / (_options.TargetFps > 0 ? _options.TargetFps : 10);
        using var frame = new Mat();

        while (!stoppingToken.IsCancellationRequested)
        {
            var loopStart = DateTime.UtcNow;

            if (capture.Read(frame) && !frame.Empty())
            {
                // Encode frame to JPEG byte array
                var jpegBytes = frame.ImEncode(".jpg");

                // Process frame via Core Pipeline
                var result = await _frameProcessor.ProcessFrameAsync(jpegBytes, stoppingToken);

                // Map to DTO
                var dto = new IngestFrameDto
                {
                    CameraId = _options.CameraId,
                    Timestamp = DateTime.UtcNow,
                    Persons = result.Persons.Select(p => new DetectedPersonDto
                    {
                        TrackId = p.TrackId.ToString(),
                        BoundingBox = new BoundingBoxDto
                        {
                            X = p.Box.X,
                            Y = p.Box.Y,
                            Width = p.Box.Width,
                            Height = p.Box.Height
                        },
                        Confidence = 1.0, // Stub
                        FaceEmbedding = p.FaceEmbedding != null ? p.FaceEmbedding.SelectMany(BitConverter.GetBytes).ToArray() : null,
                        PpeDetections = p.PpeDetections.Select(ppe => new PpeDetectionDto
                        {
                            ClassIndex = ppe.ClassId,
                            Confidence = ppe.Confidence,
                            BoundingBox = new BoundingBoxDto
                            {
                                X = ppe.Box.X,
                                Y = ppe.Box.Y,
                                Width = ppe.Box.Width,
                                Height = ppe.Box.Height
                            }
                        }).ToList()
                    }).ToList()
                };

                // Send to backend
                try
                {
                    var request = new HttpRequestMessage(HttpMethod.Post, _options.BackendApiUrl)
                    {
                        Content = JsonContent.Create(dto)
                    };
                    request.Headers.Add("X-API-Key", _options.ApiKey);

                    var response = await _httpClient.SendAsync(request, stoppingToken);
                    if (!response.IsSuccessStatusCode)
                    {
                        _logger.LogWarning("Backend returned error: {StatusCode}", response.StatusCode);
                    }
                    else
                    {
                        _logger.LogDebug("Successfully posted frame data to backend");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send data to backend API.");
                }
            }
            else
            {
                _logger.LogWarning("Failed to read frame from RTSP stream.");
                await Task.Delay(1000, stoppingToken); // Wait before retry
                continue;
            }

            var elapsed = DateTime.UtcNow - loopStart;
            var remainingDelay = delayMs - (int)elapsed.TotalMilliseconds;
            if (remainingDelay > 0)
            {
                await Task.Delay(remainingDelay, stoppingToken);
            }
        }
    }
}
