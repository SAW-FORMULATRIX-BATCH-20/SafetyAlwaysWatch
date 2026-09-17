using SafetyAlwaysWatch.Application.Common;
using SafetyAlwaysWatch.Application.DTOs.Requests;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Enums;
using SafetyAlwaysWatch.Domain.Interfaces;
using System.Text.Json;

namespace SafetyAlwaysWatch.Application.Services;

public class ScoreResetService : IScoreResetService
{
    private readonly IRepository<Employee> _employeeRepository;
    private readonly IRepository<SystemSetting> _settingRepository;
    private readonly IRepository<SafetyScorePeriodSummary> _summaryRepository;
    private readonly IRepository<ScoreResetLog> _resetLogRepository;
    private readonly IRepository<SafetyScoreLedger> _ledgerRepository;
    private readonly IRepository<ViolationEvent> _eventRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;

    public ScoreResetService(
        IRepository<Employee> employeeRepository,
        IRepository<SystemSetting> settingRepository,
        IRepository<SafetyScorePeriodSummary> summaryRepository,
        IRepository<ScoreResetLog> resetLogRepository,
        IRepository<SafetyScoreLedger> ledgerRepository,
        IRepository<ViolationEvent> eventRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService)
    {
        _employeeRepository = employeeRepository;
        _settingRepository = settingRepository;
        _summaryRepository = summaryRepository;
        _resetLogRepository = resetLogRepository;
        _ledgerRepository = ledgerRepository;
        _eventRepository = eventRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
    }

    public async Task<ServiceResult<bool>> ResetScoreManuallyAsync(Guid employeeId, ResetScoreRequest request, CancellationToken cancellationToken = default)
    {
        var employee = await _employeeRepository.GetByIdAsync(employeeId, cancellationToken);
        if (employee == null)
        {
            return ServiceResult<bool>.Failure("Employee not found.");
        }

        var adminId = _currentUserService.UserId;
        if (!adminId.HasValue)
        {
            return ServiceResult<bool>.Failure("Unauthorized.");
        }

        var initialValueSetting = (await _settingRepository.FindAsync(x => x.Key == "SafetyScore:InitialValue", cancellationToken)).FirstOrDefault();
        double initialScore = initialValueSetting != null && double.TryParse(initialValueSetting.Value, out var val) ? val : 100.0;

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            await ProcessEmployeeReset(employee, initialScore, adminId, request.ResetReason, request.Note, ScoreResetTriggerType.Manual, cancellationToken);

            await _unitOfWork.CommitAsync(cancellationToken);
            return ServiceResult<bool>.Success(true);
        }
        catch
        {
            await _unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task ExecuteScheduledResetAsync(CancellationToken cancellationToken = default)
    {
        var autoResetSetting = (await _settingRepository.FindAsync(x => x.Key == "SafetyScore:AutoResetEnabled", cancellationToken)).FirstOrDefault();
        if (autoResetSetting != null && autoResetSetting.Value.ToLower() == "false")
        {
            return;
        }

        var today = DateTimeOffset.UtcNow.Date;
        var existingLogs = await _resetLogRepository.FindAsync(x => x.TriggerType == ScoreResetTriggerType.Scheduled && x.ResetAt.Date == today, cancellationToken);
        if (existingLogs.Any())
        {
            return; // Idempotent check
        }

        var initialValueSetting = (await _settingRepository.FindAsync(x => x.Key == "SafetyScore:InitialValue", cancellationToken)).FirstOrDefault();
        double initialScore = initialValueSetting != null && double.TryParse(initialValueSetting.Value, out var val) ? val : 100.0;

        var employees = await _employeeRepository.GetAllAsync(cancellationToken);

        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            foreach (var employee in employees)
            {
                if (employee.Status == EmployeeStatus.Active)
                {
                    await ProcessEmployeeReset(employee, initialScore, null, ScoreResetReason.Lainnya, "Scheduled Auto Reset", ScoreResetTriggerType.Scheduled, cancellationToken);
                }
            }

            await _unitOfWork.CommitAsync(cancellationToken);
        }
        catch
        {
            await _unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private async Task ProcessEmployeeReset(Employee employee, double initialScore, Guid? adminId, ScoreResetReason reason, string? note, ScoreResetTriggerType type, CancellationToken cancellationToken)
    {
        // 1. Determine period start (since last reset or employee creation)
        var lastReset = (await _resetLogRepository.FindAsync(x => x.EmployeeId == employee.Id, cancellationToken))
            .OrderByDescending(x => x.ResetAt)
            .FirstOrDefault();

        var periodStart = lastReset?.ResetAt ?? DateTimeOffset.MinValue;
        var periodEnd = DateTimeOffset.UtcNow;

        // 2. Aggregate violations
        var violations = await _eventRepository.FindAsync(x => x.EmployeeId == employee.Id && x.DetectedAt >= periodStart && x.DetectedAt <= periodEnd, cancellationToken);
        var totalViolations = violations.Count;

        var violationsByClass = violations
            .SelectMany(x => x.MissingPpeClassIds)
            .GroupBy(id => id)
            .ToDictionary(g => g.Key, g => g.Count());

        var violationsJson = JsonSerializer.Serialize(violationsByClass);

        var scoreBefore = employee.SafetyCreditScore;

        // 3. Create Period Summary
        var summary = new SafetyScorePeriodSummary(
            employee.Id,
            periodStart,
            periodEnd,
            scoreBefore,
            totalViolations,
            violationsJson,
            type
        );
        await _summaryRepository.AddAsync(summary, cancellationToken);

        // 4. Create Reset Log
        var resetLog = new ScoreResetLog(
            employee.Id,
            adminId,
            reason,
            note,
            type,
            summary.Id
        );
        await _resetLogRepository.AddAsync(resetLog, cancellationToken);

        // 5. Update Score
        var changeAmount = initialScore - scoreBefore;
        employee.UpdateScore(initialScore);
        await _employeeRepository.UpdateAsync(employee, cancellationToken);

        // 6. Insert Ledger Entry
        var ledger = new SafetyScoreLedger(
            employee.Id,
            changeAmount,
            scoreBefore,
            initialScore,
            LedgerChangeType.Reset,
            "Score Reset",
            null,
            resetLog.Id
        );
        await _ledgerRepository.AddAsync(ledger, cancellationToken);
    }
}
