using SafetyAlwaysWatch.Domain.Enums;

namespace SafetyAlwaysWatch.Application.DTOs.Employees;

public class UpdateEmployeeDto
{
    public string FullName { get; set; } = string.Empty;
    public Guid DepartmentId { get; set; }
    public Guid? SupervisorId { get; set; }
    public EmployeeStatus Status { get; set; }
}
