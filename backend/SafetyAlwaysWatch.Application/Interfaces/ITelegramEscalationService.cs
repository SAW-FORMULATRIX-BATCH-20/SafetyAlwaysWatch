using SafetyAlwaysWatch.Domain.Entities;

namespace SafetyAlwaysWatch.Application.Interfaces;

public interface ITelegramEscalationService
{
    Task<bool> SendEscalationAsync(ViolationEvent violationEvent, byte[] snapshot, CancellationToken cancellationToken = default);
}
