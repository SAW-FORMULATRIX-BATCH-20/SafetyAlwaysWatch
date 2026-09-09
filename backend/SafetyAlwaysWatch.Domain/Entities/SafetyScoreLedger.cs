using SafetyAlwaysWatch.Domain.Common;

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
    public DateTimeOffset Timestamp { get; private set; }

    private SafetyScoreLedger()
    {
    }

    public SafetyScoreLedger(
        Guid employeeId,
        double changeAmount,
        double scoreBefore,
        double scoreAfter,
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
        Timestamp = DateTimeOffset.UtcNow;
    }
}
