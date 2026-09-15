using FluentValidation;
using SafetyAlwaysWatch.Application.DTOs.Employees;

namespace SafetyAlwaysWatch.Application.Validators.Employees;

public class UpdateEmployeeDtoValidator : AbstractValidator<UpdateEmployeeDto>
{
    public UpdateEmployeeDtoValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Nama lengkap tidak boleh kosong.")
            .MaximumLength(100).WithMessage("Nama lengkap maksimal 100 karakter.");

        RuleFor(x => x.DepartmentId)
            .NotEmpty().WithMessage("ID Departemen tidak boleh kosong.");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Status tidak valid.");
    }
}
