using AutoMapper;
using Moq;
using NUnit.Framework;
using SafetyAlwaysWatch.Application.DTOs.Employees;
using SafetyAlwaysWatch.Application.Mappings;
using SafetyAlwaysWatch.Application.Services;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Enums;
using SafetyAlwaysWatch.Domain.Interfaces;
using SafetyAlwaysWatch.Application.Interfaces;
using MockQueryable.Moq;
using System.Reflection;

namespace SafetyAlwaysWatch.Tests.Application;

[TestFixture]
public class EmployeeServiceTests
{
    private Mock<IRepository<Employee>> _employeeRepoMock;
    private Mock<IRepository<HazardousZone>> _dangerZoneRepoMock;
    private Mock<IRepository<SystemSetting>> _systemSettingRepoMock;
    private Mock<IRepository<SafetyScoreLedger>> _ledgerRepoMock;
    private Mock<IFaceRecognitionService> _faceServiceMock;
    private Mock<IPasswordHasher> _passwordHasherMock;
    private IMapper _mapper;
    private EmployeeService _employeeService;

    [SetUp]
    public void Setup()
    {
        _employeeRepoMock = new Mock<IRepository<Employee>>();
        _dangerZoneRepoMock = new Mock<IRepository<HazardousZone>>();
        _systemSettingRepoMock = new Mock<IRepository<SystemSetting>>();
        _ledgerRepoMock = new Mock<IRepository<SafetyScoreLedger>>();
        _faceServiceMock = new Mock<IFaceRecognitionService>();
        _passwordHasherMock = new Mock<IPasswordHasher>();

        var mapperMock = new Mock<IMapper>();
        mapperMock.Setup(m => m.Map<EmployeeDto>(It.IsAny<Employee>()))
            .Returns((Employee src) => new EmployeeDto
            {
                Id = src.Id.ToString(),
                Name = src.FullName,
                Department = src.Department?.Name ?? string.Empty,
                SafetyScore = src.SafetyCreditScore
            });
        _mapper = mapperMock.Object;

        _employeeService = new EmployeeService(
            _employeeRepoMock.Object,
            _dangerZoneRepoMock.Object,
            _systemSettingRepoMock.Object,
            _ledgerRepoMock.Object,
            _faceServiceMock.Object,
            _passwordHasherMock.Object,
            _mapper);
    }

    private Employee CreateEmployee(string code, string name, string departmentName, double score)
    {
        var deptId = Guid.NewGuid();
        var dept = new Department(deptId, departmentName);
        var emp = new Employee(code, name, deptId, score);

        // Use reflection to set Department navigation property
        var prop = typeof(Employee).GetProperty("Department", BindingFlags.Public | BindingFlags.Instance);
        prop?.SetValue(emp, dept);

        return emp;
    }

    [Test]
    public async Task GetEmployeesAsync_ReturnsPaginatedList()
    {
        // Arrange
        var settings = new List<SystemSetting>
        {
            new SystemSetting { Key = "SafetyScore:EscalationThreshold", Value = "60" }
        };

        var emp1 = CreateEmployee("EMP01", "John Doe", "IT", 100);
        var emp2 = CreateEmployee("EMP02", "Jane Smith", "HR", 50);

        var employees = new List<Employee> { emp1, emp2 };
        var zones = new List<HazardousZone>();

        _systemSettingRepoMock.Setup(repo => repo.Query()).Returns(settings.BuildMock());
        _employeeRepoMock.Setup(repo => repo.Query()).Returns(employees.BuildMock());
        _dangerZoneRepoMock.Setup(repo => repo.Query()).Returns(zones.BuildMock());

        var query = new GetEmployeesQuery { PageNumber = 1, PageSize = 10 };

        // Act
        var result = await _employeeService.GetEmployeesAsync(query, CancellationToken.None);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Data, Is.Not.Null);
        Assert.That(result.Data!.TotalCount, Is.EqualTo(2));
        Assert.That(result.Data.PageNumber, Is.EqualTo(1));
    }

    [Test]
    public async Task GetEmployeesAsync_WithSearch_ReturnsFilteredList()
    {
        // Arrange
        var emp1 = CreateEmployee("EMP01", "John Doe", "IT", 100);
        var emp2 = CreateEmployee("EMP02", "Jane Smith", "HR", 50);

        var employees = new List<Employee> { emp1, emp2 };

        _systemSettingRepoMock.Setup(repo => repo.Query()).Returns(new List<SystemSetting>().BuildMock());
        _employeeRepoMock.Setup(repo => repo.Query()).Returns(employees.BuildMock());
        _dangerZoneRepoMock.Setup(repo => repo.Query()).Returns(new List<HazardousZone>().BuildMock());

        var query = new GetEmployeesQuery { PageNumber = 1, PageSize = 10, Search = "jane" };

        // Act
        var result = await _employeeService.GetEmployeesAsync(query, CancellationToken.None);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Data!.TotalCount, Is.EqualTo(1));
        Assert.That(result.Data.Items.First().Name, Is.EqualTo("Jane Smith"));
    }

    [Test]
    public async Task GetEmployeeByIdAsync_ValidId_ReturnsEmployeeDto()
    {
        // Arrange
        var employee = CreateEmployee("EMP01", "John Doe", "IT", 100);

        var zone = new HazardousZone("Gudang Kimia", 0.0, 0.0, 1.0, 1.0, null);
        zone.AddSupervisor(employee.Id);
        var zones = new List<HazardousZone> { zone };

        var ledger = new SafetyScoreLedger(employee.Id, -10, 100, 90, LedgerChangeType.Violation, "Violation", Guid.NewGuid(), null);
        var ledgers = new List<SafetyScoreLedger> { ledger };

        var employees = new List<Employee> { employee };
        _employeeRepoMock.Setup(repo => repo.Query()).Returns(employees.BuildMock());
        _dangerZoneRepoMock.Setup(repo => repo.Query()).Returns(zones.BuildMock());
        _ledgerRepoMock.Setup(repo => repo.Query()).Returns(ledgers.BuildMock());

        // Act
        var result = await _employeeService.GetEmployeeByIdAsync(employee.Id, CancellationToken.None);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Data, Is.Not.Null);
        Assert.That(result.Data!.Name, Is.EqualTo("John Doe"));
        Assert.That(result.Data.SupervisorArea, Is.EqualTo("Gudang Kimia"));
        Assert.That(result.Data.AuditSummary!.ViolationCount, Is.EqualTo(1));
    }

    [Test]
    public async Task GetEmployeeByIdAsync_InvalidId_ReturnsFailure()
    {
        // Arrange
        var employeeId = Guid.NewGuid();
        var employees = new List<Employee>();
        _employeeRepoMock.Setup(repo => repo.Query()).Returns(employees.BuildMock());

        // Act
        var result = await _employeeService.GetEmployeeByIdAsync(employeeId, CancellationToken.None);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("Karyawan tidak ditemukan."));
    }

    [Test]
    public async Task CreateEmployeeAsync_ShouldFail_WhenEmployeeCodeExists()
    {
        // Arrange
        var existingEmployee = CreateEmployee("EMP01", "Existing", "IT", 100);
        var employees = new List<Employee> { existingEmployee };
        _employeeRepoMock.Setup(repo => repo.Query()).Returns(employees.BuildMock());

        var dto = new CreateEmployeeDto
        {
            EmployeeCode = "EMP01",
            FullName = "New Employee",
            DepartmentId = Guid.NewGuid()
        };

        // Act
        var result = await _employeeService.CreateEmployeeAsync(dto, CancellationToken.None);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("Kode karyawan sudah digunakan."));
    }

    [Test]
    public async Task CreateEmployeeAsync_ShouldSucceed_AndCreateLedger()
    {
        // Arrange
        var employees = new List<Employee>();
        _employeeRepoMock.Setup(repo => repo.Query()).Returns(employees.BuildMock());

        var settings = new List<SystemSetting>
        {
            new SystemSetting { Key = "SafetyScore:InitialScore", Value = "100" }
        };
        _systemSettingRepoMock.Setup(repo => repo.Query()).Returns(settings.BuildMock());
        _passwordHasherMock.Setup(p => p.HashPassword(It.IsAny<string>())).Returns("hashed_password");

        var dto = new CreateEmployeeDto
        {
            EmployeeCode = "EMP02",
            FullName = "New Employee",
            DepartmentId = Guid.NewGuid(),
            Password = "password123",
            Role = EmployeeRole.Admin
        };

        // Act
        var result = await _employeeService.CreateEmployeeAsync(dto, CancellationToken.None);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        _employeeRepoMock.Verify(x => x.AddAsync(It.Is<Employee>(e => e.EmployeeCode == "EMP02" && e.SafetyCreditScore == 100 && e.Role == EmployeeRole.Admin), It.IsAny<CancellationToken>()), Times.Once);
        _ledgerRepoMock.Verify(x => x.AddAsync(It.Is<SafetyScoreLedger>(l => l.ChangeType == LedgerChangeType.Initialization && l.ScoreAfter == 100), It.IsAny<CancellationToken>()), Times.Once);
    }
    [Test]
    public async Task UpdateEmployeeAsync_ShouldFail_WhenNotFound()
    {
        // Arrange
        var employeeId = Guid.NewGuid();
        var dto = new UpdateEmployeeDto { FullName = "Update" };
        var employees = new List<Employee>();
        _employeeRepoMock.Setup(repo => repo.Query()).Returns(employees.BuildMock());

        // Act
        var result = await _employeeService.UpdateEmployeeAsync(employeeId, dto, CancellationToken.None);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("Karyawan tidak ditemukan."));
    }

    [Test]
    public async Task UpdateEmployeeAsync_ShouldSucceed()
    {
        // Arrange
        var employeeId = Guid.NewGuid();
        var employee = CreateEmployee("EMP01", "Old Name", "IT", 100);
        // Force the ID to be what we want by reflection since the constructor generates a new one
        typeof(Employee).GetProperty("Id")?.SetValue(employee, employeeId);

        var employees = new List<Employee> { employee };
        _employeeRepoMock.Setup(repo => repo.Query()).Returns(employees.BuildMock());

        var newDeptId = Guid.NewGuid();
        var dto = new UpdateEmployeeDto
        {
            FullName = "New Name",
            DepartmentId = newDeptId,
            SupervisorId = null,
            Status = EmployeeStatus.Inactive
        };

        // Act
        var result = await _employeeService.UpdateEmployeeAsync(employeeId, dto, CancellationToken.None);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        _employeeRepoMock.Verify(x => x.UpdateAsync(It.Is<Employee>(e =>
            e.Id == employeeId &&
            e.FullName == "New Name" &&
            e.DepartmentId == newDeptId &&
            e.Status == EmployeeStatus.Inactive), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task DeleteEmployeeAsync_ShouldFail_WhenNotFound()
    {
        // Arrange
        var employeeId = Guid.NewGuid();
        var employees = new List<Employee>();
        _employeeRepoMock.Setup(repo => repo.Query()).Returns(employees.BuildMock());

        // Act
        var result = await _employeeService.DeleteEmployeeAsync(employeeId, CancellationToken.None);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("Karyawan tidak ditemukan."));
    }

    [Test]
    public async Task DeleteEmployeeAsync_ShouldSucceed()
    {
        // Arrange
        var employeeId = Guid.NewGuid();
        var employee = CreateEmployee("EMP01", "To Delete", "IT", 100);
        typeof(Employee).GetProperty("Id")?.SetValue(employee, employeeId);

        var employees = new List<Employee> { employee };
        _employeeRepoMock.Setup(repo => repo.Query()).Returns(employees.BuildMock());

        // Act
        var result = await _employeeService.DeleteEmployeeAsync(employeeId, CancellationToken.None);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        _employeeRepoMock.Verify(x => x.DeleteAsync(It.Is<Employee>(e => e.Id == employeeId), It.IsAny<CancellationToken>()), Times.Once);
    }
}
