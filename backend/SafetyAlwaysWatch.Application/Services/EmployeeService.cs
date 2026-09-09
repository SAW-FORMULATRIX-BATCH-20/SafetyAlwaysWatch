using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SafetyAlwaysWatch.Application.Common;
using SafetyAlwaysWatch.Application.Common.Models;
using SafetyAlwaysWatch.Application.DTOs.Employees;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Interfaces;

namespace SafetyAlwaysWatch.Application.Services;

public class EmployeeService : IEmployeeService
{
    private readonly IRepository<Employee> _employeeRepository;
    private readonly IRepository<DangerZone> _dangerZoneRepository;
    private readonly IRepository<SystemSetting> _systemSettingRepository;
    private readonly IRepository<SafetyScoreLedger> _safetyScoreLedgerRepository;
    private readonly IMapper _mapper;

    public EmployeeService(
        IRepository<Employee> employeeRepository,
        IRepository<DangerZone> dangerZoneRepository,
        IRepository<SystemSetting> systemSettingRepository,
        IRepository<SafetyScoreLedger> safetyScoreLedgerRepository,
        IMapper mapper)
    {
        _employeeRepository = employeeRepository;
        _dangerZoneRepository = dangerZoneRepository;
        _systemSettingRepository = systemSettingRepository;
        _safetyScoreLedgerRepository = safetyScoreLedgerRepository;
        _mapper = mapper;
    }

    public async Task<ServiceResult<PaginatedList<EmployeeDto>>> GetEmployeesAsync(GetEmployeesQuery query, CancellationToken cancellationToken = default)
    {
        var settings = await _systemSettingRepository.Query().ToListAsync(cancellationToken);
        var escalationThresholdSetting = settings.FirstOrDefault(x => x.Key == "SafetyScore:EscalationThreshold");
        double escalationThreshold = escalationThresholdSetting != null ? double.Parse(escalationThresholdSetting.Value) : 60;

        var dbQuery = _employeeRepository.Query();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.ToLower();
            dbQuery = dbQuery.Where(x => x.FullName.ToLower().Contains(search) || x.EmployeeCode.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(query.Department))
        {
            dbQuery = dbQuery.Where(x => x.Department == query.Department);
        }

        if (!string.IsNullOrWhiteSpace(query.SafetyStatus))
        {
            if (query.SafetyStatus.Equals("Aman", StringComparison.OrdinalIgnoreCase))
            {
                dbQuery = dbQuery.Where(x => x.SafetyCreditScore >= escalationThreshold);
            }
            else if (query.SafetyStatus.Equals("Kritis", StringComparison.OrdinalIgnoreCase))
            {
                dbQuery = dbQuery.Where(x => x.SafetyCreditScore < escalationThreshold);
            }
        }

        dbQuery = query.SortBy?.ToLower() switch
        {
            "score" => query.SortDirection?.ToLower() == "desc"
                ? dbQuery.OrderByDescending(x => x.SafetyCreditScore)
                : dbQuery.OrderBy(x => x.SafetyCreditScore),
            _ => query.SortDirection?.ToLower() == "desc"
                ? dbQuery.OrderByDescending(x => x.FullName)
                : dbQuery.OrderBy(x => x.FullName)
        };

        var paginatedEmployees = await PaginatedList<Employee>.CreateAsync(dbQuery, query.PageNumber, query.PageSize);
        var employeeDtos = new List<EmployeeDto>();

        foreach (var emp in paginatedEmployees.Items)
        {
            var dto = _mapper.Map<EmployeeDto>(emp);

            // Supervisor Area: finding all DangerZones where this employee is a supervisor
            var supervisedZones = await _dangerZoneRepository.Query()
                .Where(z => z.SupervisorIds.Contains(emp.Id))
                .Select(z => z.Name)
                .ToListAsync(cancellationToken);

            dto.SupervisorArea = supervisedZones.Any() ? string.Join(", ", supervisedZones) : emp.Department;
            employeeDtos.Add(dto);
        }

        var paginatedDto = new PaginatedList<EmployeeDto>(
            employeeDtos,
            paginatedEmployees.TotalCount,
            paginatedEmployees.PageNumber,
            paginatedEmployees.PageSize);

        return ServiceResult<PaginatedList<EmployeeDto>>.Success(paginatedDto);
    }

    public async Task<ServiceResult<EmployeeDto>> GetEmployeeByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var emp = await _employeeRepository.GetByIdAsync(id, cancellationToken);
        if (emp == null)
        {
            return ServiceResult<EmployeeDto>.Failure("Karyawan tidak ditemukan.");
        }

        var dto = _mapper.Map<EmployeeDto>(emp);

        var supervisedZones = await _dangerZoneRepository.Query()
            .Where(z => z.SupervisorIds.Contains(emp.Id))
            .Select(z => z.Name)
            .ToListAsync(cancellationToken);

        dto.SupervisorArea = supervisedZones.Any() ? string.Join(", ", supervisedZones) : emp.Department;

        var ledgers = await _safetyScoreLedgerRepository.Query()
            .Where(x => x.EmployeeId == emp.Id)
            .OrderByDescending(x => x.Timestamp)
            .ToListAsync(cancellationToken);

        var violations = ledgers.Count(x => x.RelatedViolationEventId != null);
        var resets = ledgers.Count(x => x.RelatedScoreResetLogId != null);

        var lastAudit = ledgers.FirstOrDefault();
        if (lastAudit != null)
        {
            dto.LastAuditAt = lastAudit.Timestamp.ToString("O");
        }

        dto.AuditSummary = new EmployeeAuditSummaryDto
        {
            ViolationCount = violations,
            ResetCount = resets
        };

        return ServiceResult<EmployeeDto>.Success(dto);
    }
}
