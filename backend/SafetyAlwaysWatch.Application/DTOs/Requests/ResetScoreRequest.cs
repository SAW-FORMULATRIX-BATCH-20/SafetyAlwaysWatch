using SafetyAlwaysWatch.Domain.Enums;

namespace SafetyAlwaysWatch.Application.DTOs.Requests;

public class ResetScoreRequest
{
    public ScoreResetReason ResetReason { get; set; }
    public string? Note { get; set; }
}
