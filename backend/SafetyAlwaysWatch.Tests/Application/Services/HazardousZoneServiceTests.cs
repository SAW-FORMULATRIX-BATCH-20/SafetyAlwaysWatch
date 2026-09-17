using NUnit.Framework;
using Moq;
using AutoMapper;
using SafetyAlwaysWatch.Application.Services;
using SafetyAlwaysWatch.Domain.Interfaces;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Application.DTOs.HazardousZones;
using SafetyAlwaysWatch.Application.Mappings;

namespace SafetyAlwaysWatch.Tests.Application.Services;

[TestFixture]
public class HazardousZoneServiceTests
{
    private Mock<IRepository<HazardousZone>> _mockRepo;
    private IMapper _mapper;
    private HazardousZoneService _service;

    [SetUp]
    public void Setup()
    {
        _mockRepo = new Mock<IRepository<HazardousZone>>();

        var mapperMock = new Mock<IMapper>();
        mapperMock.Setup(m => m.Map<HazardousZoneDto>(It.IsAny<HazardousZone>()))
            .Returns((HazardousZone z) => new HazardousZoneDto { Id = z.Id, Name = z.Name });

        _mapper = mapperMock.Object;
        _service = new HazardousZoneService(_mockRepo.Object, _mapper);
    }

    [Test]
    public async Task CreateAsync_ValidRequest_ReturnsSuccess()
    {
        // Arrange
        var request = new CreateHazardousZoneDto
        {
            Name = "Zone A",
            RelativeX = 0.1,
            RelativeY = 0.1,
            RelativeWidth = 0.5,
            RelativeHeight = 0.5
        };

        HazardousZone capturedZone = null;
        _mockRepo.Setup(r => r.AddAsync(It.IsAny<HazardousZone>(), It.IsAny<CancellationToken>()))
            .Callback<HazardousZone, CancellationToken>((z, ct) => capturedZone = z)
            .ReturnsAsync((HazardousZone z, CancellationToken ct) => z);

        // Act
        var result = await _service.CreateAsync(request);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(result.Data, Is.Not.Null);
        Assert.That(result.Data.Name, Is.EqualTo("Zone A"));

        _mockRepo.Verify(r => r.AddAsync(It.IsAny<HazardousZone>(), It.IsAny<CancellationToken>()), Times.Once);
        Assert.That(capturedZone.RelativeX, Is.EqualTo(0.1));
        Assert.That(capturedZone.RelativeWidth, Is.EqualTo(0.5));
    }

    [Test]
    public async Task SoftDeleteAsync_ExistingZone_ReturnsSuccessAndFlagsDeleted()
    {
        // Arrange
        var zoneId = Guid.NewGuid();
        var zone = new HazardousZone("Old Zone", 0.0, 0.0, 0.5, 0.5, null);

        _mockRepo.Setup(r => r.GetByIdAsync(zoneId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(zone);
        _mockRepo.Setup(r => r.UpdateAsync(It.IsAny<HazardousZone>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.SoftDeleteAsync(zoneId);

        // Assert
        Assert.That(result.IsSuccess, Is.True);
        Assert.That(zone.IsDeleted, Is.True);
        _mockRepo.Verify(r => r.UpdateAsync(zone, It.IsAny<CancellationToken>()), Times.Once);
    }
}
