using FluentValidation;
using SafetyAlwaysWatch.Application.DTOs.Requests;
using SafetyAlwaysWatch.Domain.Enums;

namespace SafetyAlwaysWatch.Application.Validators;

public class ResetScoreRequestValidator : AbstractValidator<ResetScoreRequest>
{
    public ResetScoreRequestValidator()
    {
        RuleFor(x => x.ResetReason)
            .IsInEnum().WithMessage("Invalid Reset Reason.");

        RuleFor(x => x.Note)
            .NotEmpty()
            .When(x => x.ResetReason == ScoreResetReason.Lainnya)
            .WithMessage("Note is required when ResetReason is 'Lainnya'.");
    }
}
