using FluentValidation;
using SafetyAlwaysWatch.Application.DTOs.Employees;

namespace SafetyAlwaysWatch.Application.Validators;

public class GetEmployeesQueryValidator : AbstractValidator<GetEmployeesQuery>
{
    public GetEmployeesQueryValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1).WithMessage("PageNumber must at least be 1.");

        RuleFor(x => x.PageSize)
            .GreaterThanOrEqualTo(1).WithMessage("PageSize must at least be 1.")
            .LessThanOrEqualTo(100).WithMessage("PageSize must not exceed 100.");

        RuleFor(x => x.SafetyStatus)
            .Must(s => string.IsNullOrEmpty(s) || s == "Aman" || s == "Kritis")
            .WithMessage("SafetyStatus must be either 'Aman', 'Kritis' or empty.");
    }
}
