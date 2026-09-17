using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using SafetyAlwaysWatch.Application.Interfaces;
using System;

namespace SafetyAlwaysWatch.Infrastructure.Services;

public class FrameSnapshotBufferSettings
{
    public int TtlSeconds { get; set; } = 30;
}

public class FrameSnapshotBuffer : IFrameSnapshotBuffer
{
    private readonly IMemoryCache _cache;
    private readonly FrameSnapshotBufferSettings _settings;

    public FrameSnapshotBuffer(IMemoryCache cache, IOptions<FrameSnapshotBufferSettings> settings)
    {
        _cache = cache;
        _settings = settings.Value;
    }

    public void StoreSnapshot(string key, byte[] snapshot)
    {
        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(_settings.TtlSeconds)
        };
        _cache.Set($"Snapshot_{key}", snapshot, options);
    }

    public byte[]? GetSnapshot(string key)
    {
        _cache.TryGetValue($"Snapshot_{key}", out byte[]? snapshot);
        return snapshot;
    }
}
