using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenCvSharp;
using SAW.ComputerVision.Core.Pipelines;
using SAW.ComputerVision.Worker.Configuration;
using SAW.ComputerVision.Worker.Http;

namespace SAW.ComputerVision.Worker.Services;

public class CameraBackgroundService : BackgroundService
{
    private readonly CameraConfig _cameraConfig;
    private readonly PipelineConfig _pipelineConfig;
    private readonly FrameProcessor _frameProcessor;
    private readonly BackendApiClient _apiClient;
    private readonly ILogger<CameraBackgroundService> _logger;

    public CameraBackgroundService(
        CameraConfig cameraConfig,
        IOptions<CvConfig> config,
        FrameProcessor frameProcessor,
        BackendApiClient apiClient,
        ILogger<CameraBackgroundService> logger)
    {
        _cameraConfig = cameraConfig;
        _pipelineConfig = config.Value.Pipeline;
        _frameProcessor = frameProcessor;
        _apiClient = apiClient;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Starting capture for camera {CameraId} on {RtspUrl}", _cameraConfig.Id, _cameraConfig.RtspUrl);
        
        using var capture = new VideoCapture(_cameraConfig.RtspUrl);
        if (!capture.IsOpened())
        {
            _logger.LogError("Failed to open RTSP stream for camera {CameraId}", _cameraConfig.Id);
            return;
        }

        var delayMs = 1000 / _pipelineConfig.ProcessingFps;
        var stopwatch = new Stopwatch();
        var snapshotStopwatch = Stopwatch.StartNew();

        using var frame = new Mat();

        while (!stoppingToken.IsCancellationRequested)
        {
            stopwatch.Restart();

            if (!capture.Read(frame) || frame.Empty())
            {
                _logger.LogWarning("Failed to read frame from camera {CameraId}", _cameraConfig.Id);
                await Task.Delay(1000, stoppingToken); // Wait before retrying
                continue;
            }

            // Convert Mat to float array for FrameProcessor (simplified approach)
            // In a real implementation, you might need to resize and normalize based on ONNX model requirements
            var frameData = new float[frame.Total() * frame.Channels()];
            // For now, we will just pass a dummy float[] to simulate processing
            // since the Core ONNX models are currently dummies as well.
            
            var pipelineOutput = _frameProcessor.ProcessFrame(frameData, frame.Width, frame.Height);

            // Encode JPEG if snapshot interval elapsed
            byte[]? jpegBytes = null;
            if (snapshotStopwatch.Elapsed.TotalSeconds >= _pipelineConfig.SnapshotIntervalSeconds)
            {
                Cv2.ImEncode(".jpg", frame, out jpegBytes);
                snapshotStopwatch.Restart();
            }

            var dto = new IngestFrameDto(
                CameraId: _cameraConfig.Id,
                Timestamp: DateTimeOffset.UtcNow,
                Persons: pipelineOutput.Persons.Select(p => new DetectedPersonDto(
                    TrackId: p.TrackId.ToString(),
                    BoundingBox: new BoundingBoxDto(p.Box.X, p.Box.Y, p.Box.Width, p.Box.Height),
                    Confidence: 1.0, // Confidence not provided by tracker currently
                    FaceEmbedding: p.FaceEmbedding != null && p.FaceEmbedding.Length > 0 ? ConvertFloatArrayToByteArray(p.FaceEmbedding) : null,
                    PpeDetections: p.PpeDetections.Select(ppe => new PpeDetectionDto(
                        ClassIndex: ppe.ClassId,
                        BoundingBox: new BoundingBoxDto(ppe.Box.X, ppe.Box.Y, ppe.Box.Width, ppe.Box.Height),
                        Confidence: ppe.Confidence
                    )).ToList(),
                    IsTrackLost: false // simplified for now
                )).ToList(),
                FrameJpeg: jpegBytes
            );

            await _apiClient.SendFrameDataAsync(dto, stoppingToken);

            var elapsed = stopwatch.ElapsedMilliseconds;
            var timeToWait = delayMs - (int)elapsed;
            if (timeToWait > 0)
            {
                await Task.Delay(timeToWait, stoppingToken);
            }
        }
    }

    private static byte[] ConvertFloatArrayToByteArray(float[] floats)
    {
        var bytes = new byte[floats.Length * 4];
        Buffer.BlockCopy(floats, 0, bytes, 0, bytes.Length);
        return bytes;
    }
}
