using Microsoft.EntityFrameworkCore;
using Moq;
using MockQueryable.Moq;
using NUnit.Framework;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Application.Services;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Enums;
using SafetyAlwaysWatch.Domain.Interfaces;

namespace SafetyAlwaysWatch.Tests.Application.Services;

[TestFixture]
public class ViolationStabilizationServiceTests
{
    private Mock<IRepository<ViolationCandidateState>> _stateRepoMock;
    private Mock<IRepository<ViolationEvent>> _eventRepoMock;
    private Mock<IRepository<SystemSetting>> _settingRepoMock;
    private Mock<ISafetyScoringService> _scoringServiceMock;
    private Mock<ITelegramEscalationService> _telegramServiceMock;
    private ViolationStabilizationService _service;

    private List<ViolationCandidateState> _states;
    private List<ViolationEvent> _events;

    [SetUp]
    public void Setup()
    {
        _states = new List<ViolationCandidateState>();
        _events = new List<ViolationEvent>();

        _stateRepoMock = new Mock<IRepository<ViolationCandidateState>>();
        _stateRepoMock.Setup(r => r.Query()).Returns(() => _states.AsQueryable().BuildMock());
        _stateRepoMock.Setup(r => r.AddAsync(It.IsAny<ViolationCandidateState>(), It.IsAny<CancellationToken>()))
            .Callback<ViolationCandidateState, CancellationToken>((s, c) => _states.Add(s))
            .ReturnsAsync((ViolationCandidateState s, CancellationToken c) => s);
        _stateRepoMock.Setup(r => r.DeleteAsync(It.IsAny<ViolationCandidateState>(), It.IsAny<CancellationToken>()))
            .Callback<ViolationCandidateState, CancellationToken>((s, c) => _states.Remove(s))
            .Returns(Task.CompletedTask);

        _eventRepoMock = new Mock<IRepository<ViolationEvent>>();
        _eventRepoMock.Setup(r => r.AddAsync(It.IsAny<ViolationEvent>(), It.IsAny<CancellationToken>()))
            .Callback<ViolationEvent, CancellationToken>((e, c) => _events.Add(e))
            .ReturnsAsync((ViolationEvent e, CancellationToken c) => e);

        var settings = new List<SystemSetting>
        {
            new SystemSetting { Key = "Violation:ConfirmThresholdSeconds", Value = "3" },
            new SystemSetting { Key = "Violation:ClearThresholdSeconds", Value = "5" },
            new SystemSetting { Key = "Detection:MinConfidenceThreshold", Value = "0.5" }
        };
        _settingRepoMock = new Mock<IRepository<SystemSetting>>();
        _settingRepoMock.Setup(r => r.Query()).Returns(settings.AsQueryable().BuildMock());

        _scoringServiceMock = new Mock<ISafetyScoringService>();
        _telegramServiceMock = new Mock<ITelegramEscalationService>();

        _service = new ViolationStabilizationService(
            _stateRepoMock.Object,
            _eventRepoMock.Object,
            _settingRepoMock.Object,
            _scoringServiceMock.Object,
            _telegramServiceMock.Object
        );
    }

    [Test]
    public async Task ProcessDetectionAsync_LowConfidence_Ignored()
    {
        await _service.ProcessDetectionAsync("T1", Guid.NewGuid(), Guid.NewGuid(), false, 0.4, DateTimeOffset.UtcNow, null);
        
        Assert.That(_states.Count, Is.EqualTo(0));
    }

    [Test]
    public async Task ProcessDetectionAsync_FirstNonCompliant_CreatesCandidate()
    {
        var timestamp = DateTimeOffset.UtcNow;
        var dangerZoneId = Guid.NewGuid();
        var missingPpeClassId = Guid.NewGuid();

        await _service.ProcessDetectionAsync("T1", dangerZoneId, missingPpeClassId, false, 0.8, timestamp, null);

        Assert.That(_states.Count, Is.EqualTo(1));
        var state = _states.First();
        Assert.That(state.Status, Is.EqualTo(ViolationStatus.Candidate));
        Assert.That(state.FirstDetectedAt, Is.EqualTo(timestamp));
    }

    [Test]
    public async Task ProcessDetectionAsync_DurationUnderConfirmThreshold_UpdatesCandidateButNoEvent()
    {
        var start = DateTimeOffset.UtcNow;
        var dangerZoneId = Guid.NewGuid();
        var ppeId = Guid.NewGuid();

        await _service.ProcessDetectionAsync("T1", dangerZoneId, ppeId, false, 0.8, start, null);
        await _service.ProcessDetectionAsync("T1", dangerZoneId, ppeId, false, 0.8, start.AddSeconds(2), null);

        Assert.That(_states.Count, Is.EqualTo(1));
        var state = _states.First();
        Assert.That(state.Status, Is.EqualTo(ViolationStatus.Candidate));
        Assert.That(_events.Count, Is.EqualTo(0));
    }

    [Test]
    public async Task ProcessDetectionAsync_DurationMeetsConfirmThreshold_SetsConfirmedAndCreatesEvent()
    {
        var start = DateTimeOffset.UtcNow;
        var dangerZoneId = Guid.NewGuid();
        var ppeId = Guid.NewGuid();
        var employeeId = Guid.NewGuid();

        await _service.ProcessDetectionAsync("T1", dangerZoneId, ppeId, false, 0.8, start, employeeId);
        await _service.ProcessDetectionAsync("T1", dangerZoneId, ppeId, false, 0.8, start.AddSeconds(3), employeeId);

        var state = _states.First();
        Assert.That(state.Status, Is.EqualTo(ViolationStatus.Confirmed));
        Assert.That(state.ConfirmedAt, Is.Not.Null);
        
        Assert.That(_events.Count, Is.EqualTo(1));
        var ev = _events.First();
        Assert.That(ev.EmployeeId, Is.EqualTo(employeeId));
        
        _scoringServiceMock.Verify(s => s.DeductScoreAsync(employeeId, ev.Id, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task ProcessDetectionAsync_DurationMeetsConfirmThreshold_SetsConfirmed_SendsTelegramEscalation()
    {
        var start = DateTimeOffset.UtcNow;
        var dangerZoneId = Guid.NewGuid();
        var ppeId = Guid.NewGuid();
        var employeeId = Guid.NewGuid();
        byte[] snapshot = new byte[] { 1, 2, 3 };

        _telegramServiceMock
            .Setup(t => t.SendEscalationAsync(It.IsAny<ViolationEvent>(), snapshot, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        await _service.ProcessDetectionAsync("T1", dangerZoneId, ppeId, false, 0.8, start, employeeId, null);
        await _service.ProcessDetectionAsync("T1", dangerZoneId, ppeId, false, 0.8, start.AddSeconds(3), employeeId, snapshot);

        var state = _states.First();
        Assert.That(state.Status, Is.EqualTo(ViolationStatus.Confirmed));
        
        Assert.That(_events.Count, Is.EqualTo(1));
        var ev = _events.First();
        
        _telegramServiceMock.Verify(t => t.SendEscalationAsync(ev, snapshot, It.IsAny<CancellationToken>()), Times.Once);
        Assert.That(ev.EvidenceDeliveryStatus, Is.EqualTo(SafetyAlwaysWatch.Domain.Enums.EvidenceDeliveryStatus.Sent));
        _eventRepoMock.Verify(r => r.UpdateAsync(ev, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task ProcessDetectionAsync_CompliantFrameOnConfirmed_SetsClearing()
    {
        var start = DateTimeOffset.UtcNow;
        var dangerZoneId = Guid.NewGuid();
        var ppeId = Guid.NewGuid();

        await _service.ProcessDetectionAsync("T1", dangerZoneId, ppeId, false, 0.8, start, null);
        await _service.ProcessDetectionAsync("T1", dangerZoneId, ppeId, false, 0.8, start.AddSeconds(3), null);
        
        await _service.ProcessDetectionAsync("T1", dangerZoneId, ppeId, true, 0.8, start.AddSeconds(4), null);

        var state = _states.First();
        Assert.That(state.Status, Is.EqualTo(ViolationStatus.Clearing));
        Assert.That(state.LastCompliantAt, Is.EqualTo(start.AddSeconds(4)));
    }

    [Test]
    public async Task ProcessDetectionAsync_CompliantFrameMeetsClearThreshold_SetsCleared()
    {
        var start = DateTimeOffset.UtcNow;
        var dangerZoneId = Guid.NewGuid();
        var ppeId = Guid.NewGuid();

        await _service.ProcessDetectionAsync("T1", dangerZoneId, ppeId, false, 0.8, start, null);
        await _service.ProcessDetectionAsync("T1", dangerZoneId, ppeId, false, 0.8, start.AddSeconds(3), null);
        
        await _service.ProcessDetectionAsync("T1", dangerZoneId, ppeId, true, 0.8, start.AddSeconds(4), null);
        await _service.ProcessDetectionAsync("T1", dangerZoneId, ppeId, true, 0.8, start.AddSeconds(9), null);

        var state = _states.First();
        Assert.That(state.Status, Is.EqualTo(ViolationStatus.Cleared));
        Assert.That(state.ClearedAt, Is.Not.Null);
    }

    [Test]
    public async Task ProcessDetectionAsync_NonCompliantWhileClearing_SetsConfirmedNoNewEvent()
    {
        var start = DateTimeOffset.UtcNow;
        var dangerZoneId = Guid.NewGuid();
        var ppeId = Guid.NewGuid();

        await _service.ProcessDetectionAsync("T1", dangerZoneId, ppeId, false, 0.8, start, null);
        await _service.ProcessDetectionAsync("T1", dangerZoneId, ppeId, false, 0.8, start.AddSeconds(3), null);
        
        await _service.ProcessDetectionAsync("T1", dangerZoneId, ppeId, true, 0.8, start.AddSeconds(4), null);
        Assert.That(_states.First().Status, Is.EqualTo(ViolationStatus.Clearing));

        await _service.ProcessDetectionAsync("T1", dangerZoneId, ppeId, false, 0.8, start.AddSeconds(5), null);

        var state = _states.First();
        Assert.That(state.Status, Is.EqualTo(ViolationStatus.Confirmed));
        Assert.That(state.LastCompliantAt, Is.Null);
        
        Assert.That(_events.Count, Is.EqualTo(1), "Should not create a second event.");
    }

    [Test]
    public async Task HandleLostTrackAsync_CandidateState_DeletesCandidate()
    {
        var start = DateTimeOffset.UtcNow;
        await _service.ProcessDetectionAsync("T1", Guid.NewGuid(), Guid.NewGuid(), false, 0.8, start, null);
        
        Assert.That(_states.Count, Is.EqualTo(1));
        
        await _service.HandleLostTrackAsync("T1", default);
        
        Assert.That(_states.Count, Is.EqualTo(0));
        Assert.That(_events.Count, Is.EqualTo(0));
    }
}
