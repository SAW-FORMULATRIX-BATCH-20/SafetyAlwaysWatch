using SafetyAlwaysWatch.Domain.Common;
using SafetyAlwaysWatch.Domain.Enums;

namespace SafetyAlwaysWatch.Domain.Entities;

public class ScoreResetLog : BaseEntity
{
    public Guid Id { get; private set; }
    public Guid EmployeeId { get; private set; }
    public DateTimeOffset ResetAt { get; private set; }
    public Guid? ResetBy { get; private set; }
    public ScoreResetReason ResetReason { get; private set; }
    public string? Note { get; private set; }
    public ScoreResetTriggerType TriggerType { get; private set; }
    public Guid RelatedPeriodSummaryId { get; private set; }

    private ScoreResetLog() { }

    public ScoreResetLog(
        Guid employeeId,
        Guid? resetBy,
        ScoreResetReason resetReason,
        string? note,
        ScoreResetTriggerType triggerType,
        Guid relatedPeriodSummaryId)
    {
        Id = Guid.NewGuid();
        EmployeeId = employeeId;
        ResetAt = DateTimeOffset.UtcNow;
        ResetBy = resetBy;
        ResetReason = resetReason;
        Note = note;
        TriggerType = triggerType;
        RelatedPeriodSummaryId = relatedPeriodSummaryId;
    }
}
