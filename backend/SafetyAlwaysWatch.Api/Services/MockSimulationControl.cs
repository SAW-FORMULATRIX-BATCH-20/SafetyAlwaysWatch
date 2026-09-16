namespace SafetyAlwaysWatch.Api.Services;

public class MockSimulationControl : IMockSimulationControl
{
    public bool IsRunning { get; private set; } = false;

    public void Start()
    {
        IsRunning = true;
    }

    public void Stop()
    {
        IsRunning = false;
    }
}
