using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using NUnit.Framework;
using SafetyAlwaysWatch.Infrastructure.Services;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Tests.Infrastructure.Services;

[TestFixture]
public class FrameSnapshotBufferTests
{
    private IMemoryCache _cache;
    private FrameSnapshotBuffer _buffer;

    [SetUp]
    public void Setup()
    {
        _cache = new MemoryCache(new MemoryCacheOptions());
        var settings = Options.Create(new FrameSnapshotBufferSettings { TtlSeconds = 1 });
        _buffer = new FrameSnapshotBuffer(_cache, settings);
    }

    [TearDown]
    public void TearDown()
    {
        _cache.Dispose();
    }

    [Test]
    public void StoreSnapshot_StoresSuccessfully()
    {
        // Arrange
        var key = "cam1";
        var snapshot = new byte[] { 1, 2, 3 };

        // Act
        _buffer.StoreSnapshot(key, snapshot);
        var result = _buffer.GetSnapshot(key);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result, Is.EqualTo(snapshot));
    }

    [Test]
    public async Task StoreSnapshot_ExpiresAfterTtl()
    {
        // Arrange
        var key = "cam1";
        var snapshot = new byte[] { 1, 2, 3 };

        // Act
        _buffer.StoreSnapshot(key, snapshot);
        await Task.Delay(1500); // Wait for TTL (1 second) to expire
        var result = _buffer.GetSnapshot(key);

        // Assert
        Assert.That(result, Is.Null);
    }
}
