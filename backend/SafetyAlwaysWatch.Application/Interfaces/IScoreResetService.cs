using SafetyAlwaysWatch.Application.Common;
using SafetyAlwaysWatch.Application.DTOs.Requests;

namespace SafetyAlwaysWatch.Application.Interfaces;

public interface IScoreResetService
{
    Task<ServiceResult<bool>> ResetScoreManuallyAsync(Guid employeeId, ResetScoreRequest request, CancellationToken cancellationToken = default);
    Task ExecuteScheduledResetAsync(CancellationToken cancellationToken = default);
}
