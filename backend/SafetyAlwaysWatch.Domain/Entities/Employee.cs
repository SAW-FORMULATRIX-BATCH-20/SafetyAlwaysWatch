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
    public string Department { get; private set; } = string.Empty;
    public bool HasFaceEnrolled { get; private set; }

    private Employee()
    {
    }

    public Employee(string employeeCode, string fullName, string department, double initialSafetyScore)
    {
        Id = Guid.NewGuid();
        EmployeeCode = employeeCode;
        FullName = fullName;
        Department = department;
        Status = EmployeeStatus.Active;
        SafetyCreditScore = initialSafetyScore;
        HasFaceEnrolled = false;
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
}
