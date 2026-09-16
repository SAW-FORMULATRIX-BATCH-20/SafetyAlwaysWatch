using SafetyAlwaysWatch.Domain.Common;
using SafetyAlwaysWatch.Domain.Enums;

namespace SafetyAlwaysWatch.Domain.Entities;

public class ViolationCandidateState : BaseEntity
{
    public Guid Id { get; private set; }
    public string TrackId { get; private set; } = string.Empty;
    public Guid DangerZoneId { get; private set; }
    public Guid MissingPpeClassId { get; private set; }
    public ViolationStatus Status { get; private set; }
    public DateTimeOffset FirstDetectedAt { get; private set; }
    public DateTimeOffset LastNonCompliantAt { get; private set; }
    public DateTimeOffset? LastCompliantAt { get; private set; }
    public Guid? EmployeeId { get; private set; }
    public Guid? ViolationEventId { get; private set; }
    public DateTimeOffset? ConfirmedAt { get; private set; }
    public DateTimeOffset? ClearedAt { get; private set; }

    // For EF Core
    private ViolationCandidateState() { }

    public ViolationCandidateState(string trackId, Guid dangerZoneId, Guid missingPpeClassId, DateTimeOffset timestamp)
    {
        Id = Guid.NewGuid();
        TrackId = trackId;
        DangerZoneId = dangerZoneId;
        MissingPpeClassId = missingPpeClassId;
        Status = ViolationStatus.Candidate;
        FirstDetectedAt = timestamp;
        LastNonCompliantAt = timestamp;
    }

    public void UpdateNonCompliant(DateTimeOffset timestamp)
    {
        if (Status == ViolationStatus.Cleared)
        {
            throw new InvalidOperationException("Cannot update a cleared state.");
        }

        LastNonCompliantAt = timestamp;

        if (Status == ViolationStatus.Clearing)
        {
            Status = ViolationStatus.Confirmed;
            LastCompliantAt = null;
        }
    }

    public void UpdateCompliant(DateTimeOffset timestamp)
    {
        if (Status == ViolationStatus.Candidate || Status == ViolationStatus.Confirmed)
        {
            if (Status == ViolationStatus.Confirmed)
            {
                Status = ViolationStatus.Clearing;
            }

            if (LastCompliantAt == null)
            {
                LastCompliantAt = timestamp;
            }
        }
    }

    public void Confirm(Guid? employeeId, Guid violationEventId, DateTimeOffset timestamp)
    {
        if (Status != ViolationStatus.Candidate)
        {
            throw new InvalidOperationException("Only Candidate state can be confirmed.");
        }

        Status = ViolationStatus.Confirmed;
        EmployeeId = employeeId;
        ViolationEventId = violationEventId;
        ConfirmedAt = timestamp;
    }

    public void Clear(DateTimeOffset timestamp)
    {
        if (Status != ViolationStatus.Clearing)
        {
            throw new InvalidOperationException("Only Clearing state can be cleared.");
        }

        Status = ViolationStatus.Cleared;
        ClearedAt = timestamp;
    }

    public bool IsReadyForConfirmation(double confirmThresholdSeconds)
    {
        return Status == ViolationStatus.Candidate &&
               (LastNonCompliantAt - FirstDetectedAt).TotalSeconds >= confirmThresholdSeconds;
    }

    public bool IsReadyForClearing(DateTimeOffset currentTimestamp, double clearThresholdSeconds)
    {
        return Status == ViolationStatus.Clearing &&
               LastCompliantAt.HasValue &&
               (currentTimestamp - LastCompliantAt.Value).TotalSeconds >= clearThresholdSeconds;
    }
}
