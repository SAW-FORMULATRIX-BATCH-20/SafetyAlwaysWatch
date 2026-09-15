using SafetyAlwaysWatch.Domain.Common;
using SafetyAlwaysWatch.Domain.Enums;

namespace SafetyAlwaysWatch.Domain.Entities;

public class SafetyScorePeriodSummary : BaseEntity
{
    public Guid Id { get; private set; }
    public Guid EmployeeId { get; private set; }
    public DateTimeOffset PeriodStart { get; private set; }
    public DateTimeOffset PeriodEnd { get; private set; }
    public double FinalScoreBeforeReset { get; private set; }
    public int TotalViolations { get; private set; }
    public string ViolationsByPpeClassJson { get; private set; } = string.Empty;
    public ScoreResetTriggerType TriggerType { get; private set; }

    private SafetyScorePeriodSummary() { }

    public SafetyScorePeriodSummary(
        Guid employeeId,
        DateTimeOffset periodStart,
        DateTimeOffset periodEnd,
        double finalScoreBeforeReset,
        int totalViolations,
        string violationsByPpeClassJson,
        ScoreResetTriggerType triggerType)
    {
        Id = Guid.NewGuid();
        EmployeeId = employeeId;
        PeriodStart = periodStart;
        PeriodEnd = periodEnd;
        FinalScoreBeforeReset = finalScoreBeforeReset;
        TotalViolations = totalViolations;
        ViolationsByPpeClassJson = violationsByPpeClassJson;
        TriggerType = triggerType;
    }
}
