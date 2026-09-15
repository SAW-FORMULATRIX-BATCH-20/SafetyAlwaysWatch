using FluentValidation.TestHelper;
using NUnit.Framework;
using SafetyAlwaysWatch.Application.DTOs.Employees;
using SafetyAlwaysWatch.Application.Validators.Employees;

namespace SafetyAlwaysWatch.Tests.Application;

public class CreateEmployeeDtoValidatorTests
{
    private readonly CreateEmployeeDtoValidator _validator;

    public CreateEmployeeDtoValidatorTests()
    {
        _validator = new CreateEmployeeDtoValidator();
    }

    [Test]
    public void Should_Have_Error_When_EmployeeCode_Is_Empty()
    {
        var model = new CreateEmployeeDto { EmployeeCode = "" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.EmployeeCode);
    }

    [Test]
    public void Should_Have_Error_When_FullName_Is_Empty()
    {
        var model = new CreateEmployeeDto { FullName = "" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.FullName);
    }

    [Test]
    public void Should_Have_Error_When_DepartmentId_Is_Empty()
    {
        var model = new CreateEmployeeDto { DepartmentId = Guid.Empty };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.DepartmentId);
    }

    [Test]
    public void Should_Not_Have_Error_When_Model_Is_Valid()
    {
        var model = new CreateEmployeeDto 
        { 
            EmployeeCode = "EMP-001",
            FullName = "John Doe",
            DepartmentId = Guid.NewGuid()
        };
        var result = _validator.TestValidate(model);
        result.ShouldNotHaveValidationErrorFor(x => x.EmployeeCode);
        result.ShouldNotHaveValidationErrorFor(x => x.FullName);
        result.ShouldNotHaveValidationErrorFor(x => x.DepartmentId);
    }
}
