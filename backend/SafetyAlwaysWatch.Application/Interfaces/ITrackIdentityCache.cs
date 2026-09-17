namespace SafetyAlwaysWatch.Application.Interfaces;

public interface ITrackIdentityCache
{
    IdentityResult? Get(string trackId);
    void Set(string trackId, IdentityResult result);
    void Remove(string trackId);
}
