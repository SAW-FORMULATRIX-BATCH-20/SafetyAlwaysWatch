using FluentValidation;
using SafetyAlwaysWatch.Application.DTOs.Auth;

namespace SafetyAlwaysWatch.Application.Validators;

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequestDto>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Password saat ini wajib diisi.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Password baru wajib diisi.")
            .MinimumLength(6).WithMessage("Password baru minimal 6 karakter.");
    }
}
