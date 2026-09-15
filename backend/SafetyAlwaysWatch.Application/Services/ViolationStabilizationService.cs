using Microsoft.EntityFrameworkCore;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Enums;
using SafetyAlwaysWatch.Domain.Interfaces;

using System.Globalization;

namespace SafetyAlwaysWatch.Application.Services;

public class ViolationStabilizationService : IViolationStabilizationService
{
    private readonly IRepository<ViolationCandidateState> _stateRepository;
    private readonly IRepository<ViolationEvent> _eventRepository;
    private readonly IRepository<SystemSetting> _settingRepository;
    private readonly ISafetyScoringService _scoringService;

    public ViolationStabilizationService(
        IRepository<ViolationCandidateState> stateRepository,
        IRepository<ViolationEvent> eventRepository,
        IRepository<SystemSetting> settingRepository,
        ISafetyScoringService scoringService)
    {
        _stateRepository = stateRepository;
        _eventRepository = eventRepository;
        _settingRepository = settingRepository;
        _scoringService = scoringService;
    }

    public async Task ProcessDetectionAsync(
        string trackId,
        Guid dangerZoneId,
        Guid missingPpeClassId,
        bool isCompliant,
        double confidence,
        DateTimeOffset timestamp,
        Guid? resolvedEmployeeId,
        CancellationToken cancellationToken = default)
    {
        var settings = await _settingRepository.Query().ToListAsync(cancellationToken);
        
        double minConfidence = ParseSettingDouble(settings, "Detection:MinConfidenceThreshold", 0.5);

        if (confidence < minConfidence)
        {
            return;
        }

        double confirmThreshold = ParseSettingDouble(settings, "Violation:ConfirmThresholdSeconds", 3.0);
        double clearThreshold = ParseSettingDouble(settings, "Violation:ClearThresholdSeconds", 5.0);

        var states = await _stateRepository.Query()
            .Where(s => s.TrackId == trackId && s.DangerZoneId == dangerZoneId && s.MissingPpeClassId == missingPpeClassId)
            .ToListAsync(cancellationToken);
            
        var state = states.FirstOrDefault(s => s.Status != ViolationStatus.Cleared);

        if (state == null)
        {
            if (!isCompliant)
            {
                state = new ViolationCandidateState(trackId, dangerZoneId, missingPpeClassId, timestamp);
                await _stateRepository.AddAsync(state, cancellationToken);
            }
            return;
        }

        if (!isCompliant)
        {
            state.UpdateNonCompliant(timestamp);

            if (state.IsReadyForConfirmation(confirmThreshold))
            {
                double deduction = ParseSettingDouble(settings, "SafetyScore:DeductionPerViolation", 5.0);

                var violationEvent = new ViolationEvent(
                    resolvedEmployeeId,
                    dangerZoneId,
                    new[] { missingPpeClassId },
                    timestamp,
                    deduction,
                    state.Id
                );

                await _eventRepository.AddAsync(violationEvent, cancellationToken);
                state.Confirm(resolvedEmployeeId, violationEvent.Id, timestamp);

                if (resolvedEmployeeId.HasValue)
                {
                    await _scoringService.DeductScoreAsync(resolvedEmployeeId.Value, violationEvent.Id, cancellationToken);
                }
            }
        }
        else
        {
            state.UpdateCompliant(timestamp);

            if (state.IsReadyForClearing(timestamp, clearThreshold))
            {
                state.Clear(timestamp);
            }
        }

        await _stateRepository.UpdateAsync(state, cancellationToken);
    }

    public async Task HandleLostTrackAsync(string trackId, CancellationToken cancellationToken = default)
    {
        var states = await _stateRepository.Query()
            .Where(s => s.TrackId == trackId && s.Status == ViolationStatus.Candidate)
            .ToListAsync(cancellationToken);

        foreach (var state in states)
        {
            await _stateRepository.DeleteAsync(state, cancellationToken);
        }
    }

    private double ParseSettingDouble(List<SystemSetting> settings, string key, double defaultValue)
    {
        var strValue = settings.FirstOrDefault(s => s.Key == key)?.Value;
        if (strValue != null && double.TryParse(strValue, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed))
        {
            return parsed;
        }
        return defaultValue;
    }
}
