namespace SafetyAlwaysWatch.Application.DTOs.Employees;

public class EmployeeAuditSummaryDto
{
    public int ViolationCount { get; set; }
    public int ResetCount { get; set; }
}

public class EmployeeDto
{
    public string Id { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public double SafetyScore { get; set; }
    public string? SafetyScorePeriodStartedAt { get; set; }
    public string? Name { get; set; }
    public string? SupervisorArea { get; set; }
    public string? EnrollmentStatus { get; set; }
    public string? LastAuditAt { get; set; }
    public EmployeeAuditSummaryDto? AuditSummary { get; set; }
}
