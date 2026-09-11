using FluentValidation;
using SafetyAlwaysWatch.Application.DTOs.Employees;

namespace SafetyAlwaysWatch.Application.Validators.Employees;

public class CreateEmployeeDtoValidator : AbstractValidator<CreateEmployeeDto>
{
    public CreateEmployeeDtoValidator()
    {
        RuleFor(x => x.EmployeeCode)
            .NotEmpty().WithMessage("Kode karyawan tidak boleh kosong.");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Nama lengkap tidak boleh kosong.")
            .MaximumLength(100).WithMessage("Nama lengkap maksimal 100 karakter.");

        RuleFor(x => x.DepartmentId)
            .NotEmpty().WithMessage("ID Departemen tidak boleh kosong.");
            
        When(x => !string.IsNullOrEmpty(x.Email), () =>
        {
            RuleFor(x => x.Email).EmailAddress().WithMessage("Format email tidak valid.");
        });
    }
}
