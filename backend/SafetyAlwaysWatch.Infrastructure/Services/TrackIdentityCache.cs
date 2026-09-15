using Microsoft.Extensions.Caching.Memory;
using SafetyAlwaysWatch.Application.Interfaces;
using System;

namespace SafetyAlwaysWatch.Infrastructure.Services;

public class TrackIdentityCache : ITrackIdentityCache
{
    private readonly IMemoryCache _cache;
    private readonly TimeSpan _ttl;

    public TrackIdentityCache(IMemoryCache cache, TimeSpan ttl)
    {
        _cache = cache;
        _ttl = ttl;
    }

    public IdentityResult? Get(string trackId)
    {
        if (_cache.TryGetValue(trackId, out IdentityResult result))
        {
            return result;
        }
        return null;
    }

    public void Set(string trackId, IdentityResult result)
    {
        _cache.Set(trackId, result, _ttl);
    }

    public void Remove(string trackId)
    {
        _cache.Remove(trackId);
    }
}
