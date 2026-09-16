namespace SafetyAlwaysWatch.Api.Services;

public interface IMockSimulationControl
{
    bool IsRunning { get; }
    void Start();
    void Stop();
}
