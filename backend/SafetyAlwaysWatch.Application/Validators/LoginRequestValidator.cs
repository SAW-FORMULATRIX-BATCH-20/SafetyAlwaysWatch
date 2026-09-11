using FluentValidation;
using SafetyAlwaysWatch.Application.DTOs.Auth;

namespace SafetyAlwaysWatch.Application.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequestDto>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Identifier)
            .NotEmpty().WithMessage("Email atau kode karyawan wajib diisi.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password wajib diisi.");
    }
}
