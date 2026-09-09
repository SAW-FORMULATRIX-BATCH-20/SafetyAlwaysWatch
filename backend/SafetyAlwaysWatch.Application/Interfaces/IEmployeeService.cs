using SafetyAlwaysWatch.Application.Common;
using SafetyAlwaysWatch.Application.Common.Models;
using SafetyAlwaysWatch.Application.DTOs.Employees;

namespace SafetyAlwaysWatch.Application.Interfaces;

public interface IEmployeeService
{
    Task<ServiceResult<PaginatedList<EmployeeDto>>> GetEmployeesAsync(GetEmployeesQuery query, CancellationToken cancellationToken = default);
    Task<ServiceResult<EmployeeDto>> GetEmployeeByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
