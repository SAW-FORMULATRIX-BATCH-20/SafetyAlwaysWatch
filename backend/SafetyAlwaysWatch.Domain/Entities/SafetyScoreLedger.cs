using SafetyAlwaysWatch.Domain.Common;
using SafetyAlwaysWatch.Domain.Enums;

namespace SafetyAlwaysWatch.Domain.Entities;

public class SafetyScoreLedger : BaseEntity
{
    public Guid Id { get; private set; }
    public Guid EmployeeId { get; private set; }
    public double ChangeAmount { get; private set; }
    public double ScoreBefore { get; private set; }
    public double ScoreAfter { get; private set; }
    public Guid? RelatedViolationEventId { get; private set; }
    public Guid? RelatedScoreResetLogId { get; private set; }
    public LedgerChangeType ChangeType { get; private set; }
    public string? Description { get; private set; }
    public DateTimeOffset Timestamp { get; private set; }

    private SafetyScoreLedger()
    {
    }

    public SafetyScoreLedger(
        Guid employeeId,
        double changeAmount,
        double scoreBefore,
        double scoreAfter,
        LedgerChangeType changeType,
        string? description = null,
        Guid? relatedViolationEventId = null,
        Guid? relatedScoreResetLogId = null)
    {
        Id = Guid.NewGuid();
        EmployeeId = employeeId;
        ChangeAmount = changeAmount;
        ScoreBefore = scoreBefore;
        ScoreAfter = scoreAfter;
        RelatedViolationEventId = relatedViolationEventId;
        RelatedScoreResetLogId = relatedScoreResetLogId;
        ChangeType = changeType;
        Description = description;
        Timestamp = DateTimeOffset.UtcNow;
    }
}
