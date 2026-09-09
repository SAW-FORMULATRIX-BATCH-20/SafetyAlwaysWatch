using AutoMapper;
using Moq;
using NUnit.Framework;
using SafetyAlwaysWatch.Application.DTOs.Employees;
using SafetyAlwaysWatch.Application.Mappings;
using SafetyAlwaysWatch.Application.Services;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using MockQueryable.Moq;

namespace SafetyAlwaysWatch.Tests.Application;

[TestFixture]
public class EmployeeServiceTests
{
    private Mock<IRepository<Employee>> _employeeRepoMock;
    private Mock<IRepository<DangerZone>> _dangerZoneRepoMock;
    private Mock<IRepository<SystemSetting>> _systemSettingRepoMock;
    private Mock<IRepository<SafetyScoreLedger>> _ledgerRepoMock;
    private IMapper _mapper;
    private EmployeeService _employeeService;

    [SetUp]
    public void Setup()
    {
        _employeeRepoMock = new Mock<IRepository<Employee>>();
        _dangerZoneRepoMock = new Mock<IRepository<DangerZone>>();
        _systemSettingRepoMock = new Mock<IRepository<SystemSetting>>();
        _ledgerRepoMock = new Mock<IRepository<SafetyScoreLedger>>();

        var mapperMock = new Mock<IMapper>();
        mapperMock.Setup(m => m.Map<EmployeeDto>(It.IsAny<Employee>()))
            .Returns((Employee src) => new EmployeeDto
            {
                Id = src.Id.ToString(),
                Name = src.FullName,
                DepartmentId = src.Department,
                SafetyScore = src.SafetyCreditScore
            });
        _mapper = mapperMock.Object;

        _employeeService = new EmployeeService(
            _employeeRepoMock.Object,
            _dangerZoneRepoMock.Object,
            _systemSettingRepoMock.Object,
            _ledgerRepoMock.Object,
            _mapper);
    }

    [Test]
    public async Task GetEmployeesAsync_ReturnsPaginatedList()
    {
        // Arrange
        var settings = new List<SystemSetting>
        {
            new SystemSetting { Key = "SafetyScore:EscalationThreshold", Value = "60" }
        };

        var emp1 = new Employee("EMP01", "John Doe", "IT", 100);
        var emp2 = new Employee("EMP02", "Jane Smith", "HR", 50);

        var employees = new List<Employee> { emp1, emp2 };
        var zones = new List<DangerZone>();

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
        var emp1 = new Employee("EMP01", "John Doe", "IT", 100);
        var emp2 = new Employee("EMP02", "Jane Smith", "HR", 50);

        var employees = new List<Employee> { emp1, emp2 };

        _systemSettingRepoMock.Setup(repo => repo.Query()).Returns(new List<SystemSetting>().BuildMock());
        _employeeRepoMock.Setup(repo => repo.Query()).Returns(employees.BuildMock());
        _dangerZoneRepoMock.Setup(repo => repo.Query()).Returns(new List<DangerZone>().BuildMock());

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
        var employee = new Employee("EMP01", "John Doe", "IT", 100);

        var zone = new DangerZone("Gudang Kimia", null);
        zone.AddSupervisor(employee.Id);
        var zones = new List<DangerZone> { zone };

        var ledger = new SafetyScoreLedger(employee.Id, -10, 100, 90, Guid.NewGuid(), null);
        var ledgers = new List<SafetyScoreLedger> { ledger };

        _employeeRepoMock.Setup(repo => repo.GetByIdAsync(employee.Id, It.IsAny<CancellationToken>())).ReturnsAsync(employee);
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
        _employeeRepoMock.Setup(repo => repo.GetByIdAsync(employeeId, It.IsAny<CancellationToken>())).ReturnsAsync((Employee)null!);

        // Act
        var result = await _employeeService.GetEmployeeByIdAsync(employeeId, CancellationToken.None);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("Karyawan tidak ditemukan."));
    }
}
