using NUnit.Framework;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Infrastructure.Services;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Tests.Application.Services;

[TestFixture]
public class TrackIdentityCacheTests
{
    private TrackIdentityCache _cache;

    [SetUp]
    public void Setup()
    {
        // Using a short TTL for testing
        var memoryCache = new Microsoft.Extensions.Caching.Memory.MemoryCache(new Microsoft.Extensions.Caching.Memory.MemoryCacheOptions());
        _cache = new TrackIdentityCache(memoryCache, TimeSpan.FromMilliseconds(100));
    }

    [Test]
    public void SetAndGet_ReturnsCachedResult()
    {
        // Arrange
        var trackId = "track1";
        var result = new IdentityResult(Guid.NewGuid(), "John Doe", 100, true);

        // Act
        _cache.Set(trackId, result);
        var cached = _cache.Get(trackId);

        // Assert
        Assert.That(cached, Is.EqualTo(result));
    }

    [Test]
    public async Task Get_AfterTTLExpires_ReturnsNull()
    {
        // Arrange
        var trackId = "track1";
        var result = new IdentityResult(Guid.NewGuid(), "John Doe", 100, true);
        _cache.Set(trackId, result);

        // Act
        await Task.Delay(150); // Wait for TTL to expire
        var cached = _cache.Get(trackId);

        // Assert
        Assert.That(cached, Is.Null);
    }

    [Test]
    public void Remove_RemovesFromCache()
    {
        // Arrange
        var trackId = "track1";
        var result = new IdentityResult(Guid.NewGuid(), "John Doe", 100, true);
        _cache.Set(trackId, result);

        // Act
        _cache.Remove(trackId);
        var cached = _cache.Get(trackId);

        // Assert
        Assert.That(cached, Is.Null);
    }
}
