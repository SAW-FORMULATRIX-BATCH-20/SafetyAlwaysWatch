using MockQueryable.Moq;
using Moq;
using NUnit.Framework;
using SafetyAlwaysWatch.Application.DTOs.Auth;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Application.Services;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Enums;
using SafetyAlwaysWatch.Domain.Interfaces;

namespace SafetyAlwaysWatch.Tests.Application;

[TestFixture]
public class AuthServiceTests
{
    private Mock<IRepository<Employee>> _employeeRepoMock;
    private Mock<IPasswordHasher> _passwordHasherMock;
    private Mock<IJwtTokenService> _jwtTokenServiceMock;
    private AuthService _authService;

    [SetUp]
    public void SetUp()
    {
        _employeeRepoMock = new Mock<IRepository<Employee>>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _jwtTokenServiceMock = new Mock<IJwtTokenService>();

        _jwtTokenServiceMock.Setup(j => j.ExpirySeconds).Returns(3600);
        _jwtTokenServiceMock.Setup(j => j.GenerateToken(It.IsAny<Employee>())).Returns("mock_jwt_token_xyz");

        _authService = new AuthService(
            _employeeRepoMock.Object,
            _passwordHasherMock.Object,
            _jwtTokenServiceMock.Object);
    }

    private Employee CreateTestEmployee(
        string code = "ADM-001",
        string name = "Admin SAW",
        string email = "admin@saw.local",
        string passwordHash = "hashed_pw",
        EmployeeRole role = EmployeeRole.Admin,
        EmployeeStatus status = EmployeeStatus.Active,
        bool requiresPasswordChange = false)
    {
        var emp = new Employee(
            Guid.NewGuid(),
            code,
            name,
            Guid.NewGuid(),
            100.0,
            email,
            passwordHash,
            role,
            requiresPasswordChange);

        if (status != EmployeeStatus.Active)
        {
            var statusProp = typeof(Employee).GetProperty(nameof(Employee.Status));
            statusProp?.SetValue(emp, status);
        }

        return emp;
    }

    [Test]
    public async Task LoginAsync_WithValidEmailAndPassword_ReturnsSuccessAndToken()
    {
        // Arrange
        var employee = CreateTestEmployee(email: "admin@saw.local", passwordHash: "valid_hash");
        var employees = new List<Employee> { employee };

        _employeeRepoMock.Setup(r => r.Query()).Returns(employees.BuildMock());
        _passwordHasherMock.Setup(p => p.VerifyPassword("Password123!", "valid_hash")).Returns(true);

        var request = new LoginRequestDto
        {
            Identifier = "admin@saw.local",
            Password = "Password123!"
        };

        // Act
        var result = await _authService.LoginAsync(request, CancellationToken.None);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Data, Is.Not.Null);
        Assert.That(result.Data!.Token, Is.EqualTo("mock_jwt_token_xyz"));
        Assert.That(result.Data.User.EmployeeCode, Is.EqualTo("ADM-001"));
        Assert.That(result.Data.User.Email, Is.EqualTo("admin@saw.local"));
        Assert.That(result.Data.User.Role, Is.EqualTo("Admin"));
    }

    [Test]
    public async Task LoginAsync_WithValidEmployeeCodeAndPassword_ReturnsSuccessAndToken()
    {
        // Arrange
        var employee = CreateTestEmployee(code: "ADM-001", passwordHash: "valid_hash");
        var employees = new List<Employee> { employee };

        _employeeRepoMock.Setup(r => r.Query()).Returns(employees.BuildMock());
        _passwordHasherMock.Setup(p => p.VerifyPassword("Password123!", "valid_hash")).Returns(true);

        var request = new LoginRequestDto
        {
            Identifier = "ADM-001",
            Password = "Password123!"
        };

        // Act
        var result = await _authService.LoginAsync(request, CancellationToken.None);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Data, Is.Not.Null);
        Assert.That(result.Data!.Token, Is.EqualTo("mock_jwt_token_xyz"));
    }

    [Test]
    public async Task LoginAsync_WithInvalidPassword_ReturnsFailure()
    {
        // Arrange
        var employee = CreateTestEmployee(email: "admin@saw.local", passwordHash: "valid_hash");
        var employees = new List<Employee> { employee };

        _employeeRepoMock.Setup(r => r.Query()).Returns(employees.BuildMock());
        _passwordHasherMock.Setup(p => p.VerifyPassword("WrongPassword!", "valid_hash")).Returns(false);

        var request = new LoginRequestDto
        {
            Identifier = "admin@saw.local",
            Password = "WrongPassword!"
        };

        // Act
        var result = await _authService.LoginAsync(request, CancellationToken.None);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("Kredensial login tidak valid."));
    }

    [Test]
    public async Task LoginAsync_WithNonExistentUser_ReturnsFailure()
    {
        // Arrange
        var employees = new List<Employee>();
        _employeeRepoMock.Setup(r => r.Query()).Returns(employees.BuildMock());

        var request = new LoginRequestDto
        {
            Identifier = "nonexistent@saw.local",
            Password = "AnyPassword123!"
        };

        // Act
        var result = await _authService.LoginAsync(request, CancellationToken.None);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("Kredensial login tidak valid."));
    }

    [Test]
    public async Task LoginAsync_WithInactiveUser_ReturnsFailure()
    {
        // Arrange
        var employee = CreateTestEmployee(email: "inactive@saw.local", status: EmployeeStatus.Inactive);
        var employees = new List<Employee> { employee };

        _employeeRepoMock.Setup(r => r.Query()).Returns(employees.BuildMock());

        var request = new LoginRequestDto
        {
            Identifier = "inactive@saw.local",
            Password = "Password123!"
        };

        // Act
        var result = await _authService.LoginAsync(request, CancellationToken.None);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("Akun karyawan tidak aktif atau dinonaktifkan."));
    }

    [Test]
    public async Task ChangePasswordAsync_WithValidCurrentPassword_UpdatesPasswordAndClearsFlag()
    {
        // Arrange
        var empId = Guid.NewGuid();
        var employee = CreateTestEmployee(passwordHash: "old_hash", requiresPasswordChange: true);
        var propId = typeof(Employee).GetProperty(nameof(Employee.Id));
        propId?.SetValue(employee, empId);

        var employees = new List<Employee> { employee };
        _employeeRepoMock.Setup(r => r.Query()).Returns(employees.BuildMock());
        _passwordHasherMock.Setup(p => p.VerifyPassword("OldPassword123!", "old_hash")).Returns(true);
        _passwordHasherMock.Setup(p => p.HashPassword("NewPassword456!")).Returns("new_hash");

        var request = new ChangePasswordRequestDto
        {
            CurrentPassword = "OldPassword123!",
            NewPassword = "NewPassword456!"
        };

        // Act
        var result = await _authService.ChangePasswordAsync(empId, request, CancellationToken.None);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Data, Is.True);
        Assert.That(employee.PasswordHash, Is.EqualTo("new_hash"));
        Assert.That(employee.RequiresPasswordChange, Is.False);
        _employeeRepoMock.Verify(r => r.UpdateAsync(employee, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task ChangePasswordAsync_WithInvalidCurrentPassword_ReturnsFailure()
    {
        // Arrange
        var empId = Guid.NewGuid();
        var employee = CreateTestEmployee(passwordHash: "old_hash");
        var propId = typeof(Employee).GetProperty(nameof(Employee.Id));
        propId?.SetValue(employee, empId);

        var employees = new List<Employee> { employee };
        _employeeRepoMock.Setup(r => r.Query()).Returns(employees.BuildMock());
        _passwordHasherMock.Setup(p => p.VerifyPassword("WrongCurrentPassword!", "old_hash")).Returns(false);

        var request = new ChangePasswordRequestDto
        {
            CurrentPassword = "WrongCurrentPassword!",
            NewPassword = "NewPassword456!"
        };

        // Act
        var result = await _authService.ChangePasswordAsync(empId, request, CancellationToken.None);

        // Assert
        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("Password saat ini tidak valid."));
        _employeeRepoMock.Verify(r => r.UpdateAsync(It.IsAny<Employee>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
