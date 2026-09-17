using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Api.Hubs;

public class MonitoringHub : Hub
{
    public async Task JoinCamera(string cameraId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Camera_{cameraId}");
    }

    public async Task LeaveCamera(string cameraId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Camera_{cameraId}");
    }
}
