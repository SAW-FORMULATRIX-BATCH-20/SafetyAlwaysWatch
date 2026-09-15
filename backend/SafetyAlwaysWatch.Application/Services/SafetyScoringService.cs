using Microsoft.EntityFrameworkCore;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Application.Common;
using SafetyAlwaysWatch.Domain.Common;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Enums;
using SafetyAlwaysWatch.Domain.Interfaces;

using System.Globalization;

namespace SafetyAlwaysWatch.Application.Services;

public class SafetyScoringService : ISafetyScoringService
{
    private readonly IRepository<Employee> _employeeRepository;
    private readonly IRepository<SafetyScoreLedger> _ledgerRepository;
    private readonly IRepository<ViolationEvent> _eventRepository;

    public SafetyScoringService(
        IRepository<Employee> employeeRepository,
        IRepository<SafetyScoreLedger> ledgerRepository,
        IRepository<ViolationEvent> eventRepository)
    {
        _employeeRepository = employeeRepository;
        _ledgerRepository = ledgerRepository;
        _eventRepository = eventRepository;
    }

    public async Task<ServiceResult<double>> DeductScoreAsync(Guid employeeId, Guid violationEventId, CancellationToken cancellationToken = default)
    {
        var employee = await _employeeRepository.GetByIdAsync(employeeId, cancellationToken);
        if (employee == null) return ServiceResult<double>.Failure("Employee not found.");

        var violationEvent = await _eventRepository.GetByIdAsync(violationEventId, cancellationToken);
        if (violationEvent == null) return ServiceResult<double>.Failure("Violation event not found.");

        double deduction = violationEvent.ScoreDeducted;

        double scoreBefore = employee.SafetyCreditScore;
        double scoreAfter = scoreBefore - deduction;
        
        employee.UpdateScore(scoreAfter);
        await _employeeRepository.UpdateAsync(employee, cancellationToken);

        var ledger = new SafetyScoreLedger(
            employeeId,
            -deduction,
            scoreBefore,
            scoreAfter,
            LedgerChangeType.Violation,
            "Violation detected",
            violationEventId
        );
        
        await _ledgerRepository.AddAsync(ledger, cancellationToken);

        return ServiceResult<double>.Success(scoreAfter);
    }
}
