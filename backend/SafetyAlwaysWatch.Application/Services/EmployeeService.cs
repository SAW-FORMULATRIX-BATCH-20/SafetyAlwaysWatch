using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SafetyAlwaysWatch.Application.Common;
using SafetyAlwaysWatch.Application.Common.Models;
using SafetyAlwaysWatch.Application.DTOs.Employees;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Enums;
using SafetyAlwaysWatch.Domain.Interfaces;

namespace SafetyAlwaysWatch.Application.Services;

public class EmployeeService : IEmployeeService
{
    private readonly IRepository<Employee> _employeeRepository;
    private readonly IRepository<DangerZone> _dangerZoneRepository;
    private readonly IRepository<SystemSetting> _systemSettingRepository;
    private readonly IRepository<SafetyScoreLedger> _safetyScoreLedgerRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IMapper _mapper;

    public EmployeeService(
        IRepository<Employee> employeeRepository,
        IRepository<DangerZone> dangerZoneRepository,
        IRepository<SystemSetting> systemSettingRepository,
        IRepository<SafetyScoreLedger> safetyScoreLedgerRepository,
        IPasswordHasher passwordHasher,
        IMapper mapper)
    {
        _employeeRepository = employeeRepository;
        _dangerZoneRepository = dangerZoneRepository;
        _systemSettingRepository = systemSettingRepository;
        _safetyScoreLedgerRepository = safetyScoreLedgerRepository;
        _passwordHasher = passwordHasher;
        _mapper = mapper;
    }

    public async Task<ServiceResult<PaginatedList<EmployeeDto>>> GetEmployeesAsync(GetEmployeesQuery query, CancellationToken cancellationToken = default)
    {
        var settings = await _systemSettingRepository.Query().ToListAsync(cancellationToken);
        var escalationThresholdSetting = settings.FirstOrDefault(x => x.Key == "SafetyScore:EscalationThreshold");
        double escalationThreshold = escalationThresholdSetting != null ? double.Parse(escalationThresholdSetting.Value) : 60;

        var dbQuery = _employeeRepository.Query().Include(x => x.Department).AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.ToLower();
            dbQuery = dbQuery.Where(x => x.FullName.ToLower().Contains(search) || x.EmployeeCode.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(query.Department))
        {
            dbQuery = dbQuery.Where(x => x.Department.Name == query.Department);
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

            dto.SupervisorArea = supervisedZones.Any() ? string.Join(", ", supervisedZones) : emp.Department.Name;
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
        var emp = await _employeeRepository.Query().Include(x => x.Department).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (emp == null)
        {
            return ServiceResult<EmployeeDto>.Failure("Karyawan tidak ditemukan.");
        }

        var dto = _mapper.Map<EmployeeDto>(emp);

        var supervisedZones = await _dangerZoneRepository.Query()
            .Where(z => z.SupervisorIds.Contains(emp.Id))
            .Select(z => z.Name)
            .ToListAsync(cancellationToken);

        dto.SupervisorArea = supervisedZones.Any() ? string.Join(", ", supervisedZones) : emp.Department?.Name ?? string.Empty;

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

    public async Task<ServiceResult<Guid>> CreateEmployeeAsync(CreateEmployeeDto dto, CancellationToken cancellationToken = default)
    {
        var existingEmployee = await _employeeRepository.Query()
            .FirstOrDefaultAsync(x => x.EmployeeCode == dto.EmployeeCode, cancellationToken);

        if (existingEmployee != null)
        {
            return ServiceResult<Guid>.Failure("Kode karyawan sudah digunakan.");
        }

        var settings = await _systemSettingRepository.Query().ToListAsync(cancellationToken);
        var initialScoreSetting = settings.FirstOrDefault(x => x.Key == "SafetyScore:InitialScore");
        double initialScore = initialScoreSetting != null ? double.Parse(initialScoreSetting.Value) : 100;

        var employee = new Employee(dto.EmployeeCode, dto.FullName, dto.DepartmentId, initialScore);

        if (dto.Role.HasValue)
        {
            var hash = !string.IsNullOrWhiteSpace(dto.Password) ? _passwordHasher.HashPassword(dto.Password) : string.Empty;
            employee.SetCredentials(hash, dto.Role.Value, requiresPasswordChange: true, email: dto.Email);
        }
        else if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            employee.SetEmail(dto.Email);
        }

        await _employeeRepository.AddAsync(employee, cancellationToken);

        var ledger = new SafetyScoreLedger(
            employee.Id,
            initialScore,
            0,
            initialScore,
            LedgerChangeType.Initialization,
            "Initial score assignment"
        );
        await _safetyScoreLedgerRepository.AddAsync(ledger, cancellationToken);

        return ServiceResult<Guid>.Success(employee.Id);
    }
}
