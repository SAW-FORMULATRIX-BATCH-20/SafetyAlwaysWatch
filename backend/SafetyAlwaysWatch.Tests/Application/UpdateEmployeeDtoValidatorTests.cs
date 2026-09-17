using FluentValidation.TestHelper;
using NUnit.Framework;
using SafetyAlwaysWatch.Application.DTOs.Employees;
using SafetyAlwaysWatch.Application.Validators.Employees;
using SafetyAlwaysWatch.Domain.Enums;

namespace SafetyAlwaysWatch.Tests.Application;

[TestFixture]
public class UpdateEmployeeDtoValidatorTests
{
    private readonly UpdateEmployeeDtoValidator _validator;

    public UpdateEmployeeDtoValidatorTests()
    {
        _validator = new UpdateEmployeeDtoValidator();
    }

    [Test]
    public void Should_Have_Error_When_FullName_Is_Empty()
    {
        var model = new UpdateEmployeeDto { FullName = "" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.FullName);
    }

    [Test]
    public void Should_Have_Error_When_DepartmentId_Is_Empty()
    {
        var model = new UpdateEmployeeDto { DepartmentId = Guid.Empty };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.DepartmentId);
    }

    [Test]
    public void Should_Have_Error_When_Status_Is_Invalid()
    {
        var model = new UpdateEmployeeDto { Status = (EmployeeStatus)999 };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Status);
    }

    [Test]
    public void Should_Not_Have_Error_When_Model_Is_Valid()
    {
        var model = new UpdateEmployeeDto
        {
            FullName = "John Doe",
            DepartmentId = Guid.NewGuid(),
            SupervisorId = Guid.NewGuid(),
            Status = EmployeeStatus.Active
        };
        var result = _validator.TestValidate(model);
        result.ShouldNotHaveValidationErrorFor(x => x.FullName);
        result.ShouldNotHaveValidationErrorFor(x => x.DepartmentId);
        result.ShouldNotHaveValidationErrorFor(x => x.Status);
    }
}
