using SafetyAlwaysWatch.Domain.Common;
using SafetyAlwaysWatch.Domain.Enums;

namespace SafetyAlwaysWatch.Domain.Entities;

public class ViolationEvent : BaseEntity
{
    public Guid Id { get; private set; }
    public Guid? EmployeeId { get; private set; }
    public Guid DangerZoneId { get; private set; }

    private readonly List<Guid> _missingPpeClassIds = new();
    public IReadOnlyCollection<Guid> MissingPpeClassIds => _missingPpeClassIds.AsReadOnly();

    public DateTimeOffset DetectedAt { get; private set; }
    public EvidenceDeliveryStatus EvidenceDeliveryStatus { get; private set; }
    public double ScoreDeducted { get; private set; }
    public Guid? ViolationCandidateStateId { get; private set; }

    // For EF Core
    private ViolationEvent() { }

    public ViolationEvent(
        Guid? employeeId,
        Guid dangerZoneId,
        IEnumerable<Guid> missingPpeClassIds,
        DateTimeOffset detectedAt,
        double scoreDeducted,
        Guid? violationCandidateStateId)
    {
        Id = Guid.NewGuid();
        EmployeeId = employeeId;
        DangerZoneId = dangerZoneId;
        _missingPpeClassIds.AddRange(missingPpeClassIds);
        DetectedAt = detectedAt;
        EvidenceDeliveryStatus = EvidenceDeliveryStatus.Pending;
        ScoreDeducted = scoreDeducted;
        ViolationCandidateStateId = violationCandidateStateId;
    }

    public void UpdateEvidenceDeliveryStatus(EvidenceDeliveryStatus status)
    {
        EvidenceDeliveryStatus = status;
    }
}
