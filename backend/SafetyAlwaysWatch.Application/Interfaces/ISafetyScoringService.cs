using SafetyAlwaysWatch.Domain.Common;
using SafetyAlwaysWatch.Application.Common;

namespace SafetyAlwaysWatch.Application.Interfaces;

public interface ISafetyScoringService
{
    Task<ServiceResult<double>> DeductScoreAsync(Guid employeeId, Guid violationEventId, CancellationToken cancellationToken = default);
}
