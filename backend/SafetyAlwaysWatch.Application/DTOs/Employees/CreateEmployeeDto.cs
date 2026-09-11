using SafetyAlwaysWatch.Domain.Enums;

namespace SafetyAlwaysWatch.Application.DTOs.Employees;

public class CreateEmployeeDto
{
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public Guid DepartmentId { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public EmployeeRole? Role { get; set; }
}
