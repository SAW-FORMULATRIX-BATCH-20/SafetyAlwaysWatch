using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;
using SafetyAlwaysWatch.Infrastructure.Services;

namespace SafetyAlwaysWatch.Tests.Infrastructure.Services;

[TestFixture]
public class FrameSnapshotBufferTests
{
    private IMemoryCache _cache;
    private FrameSnapshotBuffer _buffer;

    [SetUp]
    public void Setup()
    {
        var services = new ServiceCollection();
        services.AddMemoryCache();
        var serviceProvider = services.BuildServiceProvider();

        _cache = serviceProvider.GetRequiredService<IMemoryCache>();
        _buffer = new FrameSnapshotBuffer(_cache);
    }

    [TearDown]
    public void TearDown()
    {
        _cache?.Dispose();
    }

    [Test]
    public void StoreAndGetLatest_ValidData_ReturnsStoredJpeg()
    {
        // Arrange
        var cameraId = "camera1";
        var jpegData = new byte[] { 1, 2, 3 };

        // Act
        _buffer.Store(cameraId, jpegData);
        var result = _buffer.GetLatest(cameraId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.EqualTo(jpegData));
    }

    [Test]
    public void GetLatest_NoDataStored_ReturnsNull()
    {
        // Act
        var result = _buffer.GetLatest("camera2");

        // Assert
        Assert.That(result, Is.Null);
    }
}
