using SafetyAlwaysWatch.Domain.Common;
using SafetyAlwaysWatch.Domain.Enums;

namespace SafetyAlwaysWatch.Domain.Entities;

public class Employee : BaseEntity
{
    public Guid Id { get; private set; }
    public string EmployeeCode { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public EmployeeStatus Status { get; private set; }

    // Extensions for V2
    public double SafetyCreditScore { get; private set; }
    public Guid? SupervisorId { get; private set; }
    public Guid DepartmentId { get; private set; }
    public Department Department { get; private set; } = null!;
    public bool HasFaceEnrolled { get; private set; }

    // Authentication & Account credentials (Issue #47)
    public string? Email { get; private set; }
    public string? PasswordHash { get; private set; }
    public EmployeeRole? Role { get; private set; }
    public bool RequiresPasswordChange { get; private set; }

    private Employee()
    {
    }

    public Employee(
        Guid id,
        string employeeCode,
        string fullName,
        Guid departmentId,
        double initialSafetyScore,
        string? email = null,
        string? passwordHash = null,
        EmployeeRole? role = null,
        bool requiresPasswordChange = false)
    {
        Id = id;
        EmployeeCode = employeeCode;
        FullName = fullName;
        DepartmentId = departmentId;
        Status = EmployeeStatus.Active;
        SafetyCreditScore = initialSafetyScore;
        HasFaceEnrolled = false;
        Email = email;
        PasswordHash = passwordHash;
        Role = role;
        RequiresPasswordChange = requiresPasswordChange;
    }

    public Employee(string employeeCode, string fullName, Guid departmentId, double initialSafetyScore)
        : this(Guid.NewGuid(), employeeCode, fullName, departmentId, initialSafetyScore)
    {
    }

    public void UpdateScore(double newScore)
    {
        SafetyCreditScore = newScore;
    }

    public void SetEnrollmentStatus(bool isEnrolled)
    {
        HasFaceEnrolled = isEnrolled;
    }

    public void SetSupervisor(Guid? supervisorId)
    {
        SupervisorId = supervisorId;
    }

    public void SetCredentials(string passwordHash, EmployeeRole role, bool requiresPasswordChange = false, string? email = null)
    {
        PasswordHash = passwordHash;
        Role = role;
        RequiresPasswordChange = requiresPasswordChange;
        if (!string.IsNullOrWhiteSpace(email))
        {
            Email = email;
        }
    }

    public void UpdatePassword(string newPasswordHash)
    {
        PasswordHash = newPasswordHash;
        RequiresPasswordChange = false;
    }

    public void SetEmail(string email)
    {
        Email = email;
    }
}
