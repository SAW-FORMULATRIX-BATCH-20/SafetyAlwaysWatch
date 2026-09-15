using Moq;
using NUnit.Framework;
using SafetyAlwaysWatch.Application.DTOs.Requests;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Application.Services;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Enums;
using SafetyAlwaysWatch.Domain.Interfaces;
using System.Linq.Expressions;

namespace SafetyAlwaysWatch.Tests.Application.Services;

[TestFixture]
public class ScoreResetServiceTests
{
    private Mock<IRepository<Employee>> _employeeRepoMock;
    private Mock<IRepository<SystemSetting>> _settingRepoMock;
    private Mock<IRepository<SafetyScorePeriodSummary>> _summaryRepoMock;
    private Mock<IRepository<ScoreResetLog>> _resetLogRepoMock;
    private Mock<IRepository<SafetyScoreLedger>> _ledgerRepoMock;
    private Mock<IRepository<ViolationEvent>> _eventRepoMock;
    private Mock<IUnitOfWork> _unitOfWorkMock;
    private Mock<ICurrentUserService> _currentUserServiceMock;
    private ScoreResetService _service;

    [SetUp]
    public void Setup()
    {
        _employeeRepoMock = new Mock<IRepository<Employee>>();
        _settingRepoMock = new Mock<IRepository<SystemSetting>>();
        _summaryRepoMock = new Mock<IRepository<SafetyScorePeriodSummary>>();
        _resetLogRepoMock = new Mock<IRepository<ScoreResetLog>>();
        _ledgerRepoMock = new Mock<IRepository<SafetyScoreLedger>>();
        _eventRepoMock = new Mock<IRepository<ViolationEvent>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();

        _service = new ScoreResetService(
            _employeeRepoMock.Object,
            _settingRepoMock.Object,
            _summaryRepoMock.Object,
            _resetLogRepoMock.Object,
            _ledgerRepoMock.Object,
            _eventRepoMock.Object,
            _unitOfWorkMock.Object,
            _currentUserServiceMock.Object
        );

        _resetLogRepoMock.Setup(r => r.FindAsync(It.IsAny<Expression<Func<ScoreResetLog, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ScoreResetLog>());

        _eventRepoMock.Setup(r => r.FindAsync(It.IsAny<Expression<Func<ViolationEvent, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ViolationEvent>());
    }

    [Test]
    public async Task ResetScoreManuallyAsync_Success_ShouldResetScoreAndCreateLogs()
    {
        // Arrange
        var employeeId = Guid.NewGuid();
        var adminId = Guid.NewGuid();
        var employee = new Employee("EMP001", "John Doe", Guid.NewGuid(), 50.0);
        var req = new ResetScoreRequest { ResetReason = ScoreResetReason.TrainingSelesai };

        _employeeRepoMock.Setup(r => r.GetByIdAsync(employeeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(employee);

        _currentUserServiceMock.Setup(c => c.UserId).Returns(adminId);

        _settingRepoMock.Setup(r => r.FindAsync(It.IsAny<Expression<Func<SystemSetting, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<SystemSetting> { new SystemSetting { Key = "SafetyScore:InitialValue", Value = "100" } });

        // Act
        var result = await _service.ResetScoreManuallyAsync(employeeId, req);

        // Assert
        Assert.IsTrue(result.IsSuccess);
        Assert.AreEqual(100.0, employee.SafetyCreditScore);

        _unitOfWorkMock.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
        _summaryRepoMock.Verify(r => r.AddAsync(It.IsAny<SafetyScorePeriodSummary>(), It.IsAny<CancellationToken>()), Times.Once);
        _resetLogRepoMock.Verify(r => r.AddAsync(It.IsAny<ScoreResetLog>(), It.IsAny<CancellationToken>()), Times.Once);
        _ledgerRepoMock.Verify(r => r.AddAsync(It.IsAny<SafetyScoreLedger>(), It.IsAny<CancellationToken>()), Times.Once);
        _employeeRepoMock.Verify(r => r.UpdateAsync(employee, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task ExecuteScheduledResetAsync_Success_ShouldResetAllActiveEmployees()
    {
        // Arrange
        var employee1 = new Employee("EMP001", "John", Guid.NewGuid(), 40.0);
        var employee2 = new Employee("EMP002", "Jane", Guid.NewGuid(), 80.0);
        
        _employeeRepoMock.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Employee> { employee1, employee2 });

        _settingRepoMock.Setup(r => r.FindAsync(It.IsAny<Expression<Func<SystemSetting, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<SystemSetting> 
            { 
                new SystemSetting { Key = "SafetyScore:InitialValue", Value = "100" },
                new SystemSetting { Key = "SafetyScore:AutoResetEnabled", Value = "true" }
            });

        _resetLogRepoMock.Setup(r => r.FindAsync(It.IsAny<Expression<Func<ScoreResetLog, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ScoreResetLog>()); // No reset yet today

        // Act
        await _service.ExecuteScheduledResetAsync();

        // Assert
        Assert.AreEqual(100.0, employee1.SafetyCreditScore);
        Assert.AreEqual(100.0, employee2.SafetyCreditScore);

        _unitOfWorkMock.Verify(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
        _summaryRepoMock.Verify(r => r.AddAsync(It.IsAny<SafetyScorePeriodSummary>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
        _resetLogRepoMock.Verify(r => r.AddAsync(It.IsAny<ScoreResetLog>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
        _ledgerRepoMock.Verify(r => r.AddAsync(It.IsAny<SafetyScoreLedger>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }
}
