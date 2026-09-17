using System;

namespace SafetyAlwaysWatch.Application.Interfaces;

public interface IFrameSnapshotBuffer
{
    void StoreSnapshot(string key, byte[] snapshot);
    byte[]? GetSnapshot(string key);
}
