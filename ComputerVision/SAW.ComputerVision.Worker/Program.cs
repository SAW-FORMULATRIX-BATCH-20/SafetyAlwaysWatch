using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using SAW.ComputerVision.Core.Pipeline;

namespace SAW.ComputerVision.Worker;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = Host.CreateApplicationBuilder(args);

        // Bind config
        builder.Services.Configure<WorkerOptions>(builder.Configuration.GetSection("WorkerOptions"));

        // Register Core Pipeline
        builder.Services.AddSingleton<IFrameProcessor, StubFrameProcessor>();

        // Register HttpClient
        builder.Services.AddHttpClient();

        // Add Worker Service
        builder.Services.AddHostedService<CameraWorker>();

        var host = builder.Build();
        host.Run();
    }
}
