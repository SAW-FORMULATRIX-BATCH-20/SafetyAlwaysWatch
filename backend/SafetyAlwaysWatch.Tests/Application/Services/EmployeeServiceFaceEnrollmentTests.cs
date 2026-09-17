using Moq;
using NUnit.Framework;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Application.Services;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Interfaces;
using SafetyAlwaysWatch.Application.DTOs;
using MockQueryable.Moq;

namespace SafetyAlwaysWatch.Tests.Application.Services;

[TestFixture]
public class EmployeeServiceFaceEnrollmentTests
{
    private Mock<IRepository<Employee>> _employeeRepoMock;
    private Mock<IRepository<HazardousZone>> _zoneRepoMock;
    private Mock<IRepository<SystemSetting>> _settingRepoMock;
    private Mock<IRepository<SafetyScoreLedger>> _ledgerRepoMock;
    private Mock<IFaceRecognitionService> _faceServiceMock;
    private Mock<IPasswordHasher> _passwordHasherMock;
    private Mock<AutoMapper.IMapper> _mapperMock;
    private EmployeeService _service;

    [SetUp]
    public void Setup()
    {
        _employeeRepoMock = new Mock<IRepository<Employee>>();
        _zoneRepoMock = new Mock<IRepository<HazardousZone>>();
        _settingRepoMock = new Mock<IRepository<SystemSetting>>();
        _ledgerRepoMock = new Mock<IRepository<SafetyScoreLedger>>();
        _faceServiceMock = new Mock<IFaceRecognitionService>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _mapperMock = new Mock<AutoMapper.IMapper>();

        _service = new EmployeeService(
            _employeeRepoMock.Object,
            _zoneRepoMock.Object,
            _settingRepoMock.Object,
            _ledgerRepoMock.Object,
            _faceServiceMock.Object,
            _passwordHasherMock.Object,
            _mapperMock.Object
        );
    }

    [Test]
    public async Task EnrollFaceAsync_EmployeeNotFound_ReturnsError()
    {
        _employeeRepoMock.Setup(r => r.Query()).Returns(new List<Employee>().AsQueryable().BuildMock());

        var result = await _service.EnrollFaceAsync(Guid.NewGuid(), new MemoryStream(), "image/jpeg", Guid.NewGuid());

        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("Employee not found."));
    }

    [TestCase("application/pdf")]
    [TestCase("text/plain")]
    public async Task EnrollFaceAsync_InvalidContentType_ReturnsError(string contentType)
    {
        var result = await _service.EnrollFaceAsync(Guid.NewGuid(), new MemoryStream(), contentType, Guid.NewGuid());

        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("Only JPEG or PNG images are supported."));
    }

    [Test]
    public async Task EnrollFaceAsync_FaceServiceReturnsNull_ReturnsError()
    {
        var employee = new Employee("EMP1", "Test", Guid.NewGuid(), 100);
        _employeeRepoMock.Setup(r => r.Query()).Returns(new List<Employee> { employee }.AsQueryable().BuildMock());

        _faceServiceMock.Setup(s => s.ExtractFaceEmbeddingAsync(It.IsAny<Stream>()))
            .ReturnsAsync(((byte[], double)?)(null));

        var result = await _service.EnrollFaceAsync(employee.Id, new MemoryStream(), "image/png", Guid.NewGuid());

        Assert.That(result.IsSuccess, Is.False);
        Assert.That(result.ErrorMessage, Is.EqualTo("No face detected, multiple faces detected, or image quality too low."));
    }

    [Test]
    public async Task EnrollFaceAsync_Success_ReturnsDtoAndSaves()
    {
        var employeeId = Guid.NewGuid();
        var employee = new Employee(employeeId, "EMP1", "Test", Guid.NewGuid(), 100);
        _employeeRepoMock.Setup(r => r.Query()).Returns(new List<Employee> { employee }.AsQueryable().BuildMock());

        _faceServiceMock.Setup(s => s.ExtractFaceEmbeddingAsync(It.IsAny<Stream>()))
            .ReturnsAsync((new byte[] { 1, 2, 3 }, 0.95));

        var result = await _service.EnrollFaceAsync(employeeId, new MemoryStream(), "image/jpeg", Guid.NewGuid());

        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Data, Is.Not.Null);
        Assert.That(result.Data.ActiveSampleCount, Is.EqualTo(1));

        _employeeRepoMock.Verify(r => r.UpdateAsync(employee, default), Times.Once);
    }
}
