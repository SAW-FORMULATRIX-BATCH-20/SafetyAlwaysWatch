namespace SafetyAlwaysWatch.Application.Interfaces;

public interface IFrameSnapshotBuffer
{
    void Store(string cameraId, byte[] jpeg);
    byte[]? GetLatest(string cameraId);
}
