using SafetyAlwaysWatch.Application.Common;
using SafetyAlwaysWatch.Application.Common.Models;
using SafetyAlwaysWatch.Application.DTOs.HazardousZones;

namespace SafetyAlwaysWatch.Application.Interfaces;

public interface IHazardousZoneService
{
    Task<ServiceResult<HazardousZoneDto>> CreateAsync(CreateHazardousZoneDto request);
    Task<ServiceResult<HazardousZoneDto>> UpdateAsync(UpdateHazardousZoneDto request);
    Task<ServiceResult<HazardousZoneDto>> GetByIdAsync(Guid id);
    Task<ServiceResult<PaginatedList<HazardousZoneDto>>> GetPaginatedAsync(GetHazardousZonesQuery query);
    Task<ServiceResult<bool>> SoftDeleteAsync(Guid id);
}
