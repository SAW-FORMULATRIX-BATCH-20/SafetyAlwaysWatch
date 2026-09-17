using System;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using SAW.ComputerVision.Core.Inference;
using SAW.ComputerVision.Core.Pipelines;
using SAW.ComputerVision.Core.Tracking;
using SAW.ComputerVision.Worker.Configuration;
using SAW.ComputerVision.Worker.Http;
using SAW.ComputerVision.Worker.Services;

var builder = Host.CreateApplicationBuilder(args);

// Configuration
builder.Services.Configure<CvConfig>(builder.Configuration);

// Read CvConfig early to register cameras
var cvConfig = new CvConfig();
builder.Configuration.Bind(cvConfig);

// HTTP Client
builder.Services.AddHttpClient<BackendApiClient>((serviceProvider, client) =>
{
    var config = serviceProvider.GetRequiredService<IOptions<CvConfig>>().Value.Backend;
    if (!string.IsNullOrEmpty(config.BaseUrl))
    {
        client.BaseAddress = new Uri(config.BaseUrl);
    }
});

// Core Dependencies
builder.Services.AddSingleton<IPersonDetector>(sp => 
{
    var config = sp.GetRequiredService<IOptions<CvConfig>>().Value.Models;
    return new PersonDetector(config.PersonPath);
});
builder.Services.AddSingleton<IPpeDetector>(sp => 
{
    var config = sp.GetRequiredService<IOptions<CvConfig>>().Value.Models;
    return new PpeDetector(config.PpePath);
});
builder.Services.AddSingleton<IFaceDetector>(sp => 
{
    var config = sp.GetRequiredService<IOptions<CvConfig>>().Value.Models;
    return new FaceDetector(config.YuNetPath);
});
builder.Services.AddSingleton<IFaceEmbedder>(sp => 
{
    var config = sp.GetRequiredService<IOptions<CvConfig>>().Value.Models;
    return new FaceEmbedder(config.SFacePath);
});
builder.Services.AddSingleton<IouTracker>();
builder.Services.AddSingleton<SpatialAssociator>();
builder.Services.AddTransient<FrameProcessor>();

// Register a background service per camera
foreach (var camera in cvConfig.Cameras)
{
    builder.Services.AddHostedService<CameraBackgroundService>(sp =>
    {
        var logger = sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<CameraBackgroundService>>();
        var apiClient = sp.GetRequiredService<BackendApiClient>();
        var processor = sp.GetRequiredService<FrameProcessor>();
        var config = sp.GetRequiredService<IOptions<CvConfig>>();
        
        return new CameraBackgroundService(camera, config, processor, apiClient, logger);
    });
}

var host = builder.Build();
host.Run();
