using Microsoft.Extensions.Caching.Memory;
using SafetyAlwaysWatch.Application.Interfaces;
using System;

namespace SafetyAlwaysWatch.Infrastructure.Services;

public class FrameSnapshotBuffer : IFrameSnapshotBuffer
{
    private readonly IMemoryCache _cache;
    private readonly TimeSpan _ttl = TimeSpan.FromSeconds(30);

    public FrameSnapshotBuffer(IMemoryCache cache)
    {
        _cache = cache;
    }

    public void Store(string cameraId, byte[] jpeg)
    {
        var key = GetCacheKey(cameraId);
        _cache.Set(key, jpeg, _ttl);
    }

    public byte[]? GetLatest(string cameraId)
    {
        var key = GetCacheKey(cameraId);
        _cache.TryGetValue(key, out byte[]? jpeg);
        return jpeg;
    }

    private string GetCacheKey(string cameraId) => $"snapshot:{cameraId}";
}
