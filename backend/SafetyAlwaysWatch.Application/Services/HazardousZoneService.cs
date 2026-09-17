using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SafetyAlwaysWatch.Application.Common;
using SafetyAlwaysWatch.Application.Common.Models;
using SafetyAlwaysWatch.Application.DTOs.HazardousZones;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Interfaces;

namespace SafetyAlwaysWatch.Application.Services;

public class HazardousZoneService : IHazardousZoneService
{
    private readonly IRepository<HazardousZone> _repository;
    private readonly IMapper _mapper;

    public HazardousZoneService(IRepository<HazardousZone> repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<ServiceResult<HazardousZoneDto>> CreateAsync(CreateHazardousZoneDto request)
    {
        var entity = new HazardousZone(
            request.Name,
            request.RelativeX,
            request.RelativeY,
            request.RelativeWidth,
            request.RelativeHeight,
            request.CameraSourceId);

        entity.SetSupervisors(request.SupervisorIds);
        entity.SetRequiredPpeClasses(request.RequiredPpeClassIds);

        await _repository.AddAsync(entity);

        var dto = _mapper.Map<HazardousZoneDto>(entity);
        return ServiceResult<HazardousZoneDto>.Success(dto);
    }

    public async Task<ServiceResult<HazardousZoneDto>> UpdateAsync(UpdateHazardousZoneDto request)
    {
        var entity = await _repository.GetByIdAsync(request.Id);
        if (entity == null)
        {
            return ServiceResult<HazardousZoneDto>.Failure("Hazardous Zone not found.");
        }

        entity.UpdateDetails(
            request.Name,
            request.RelativeX,
            request.RelativeY,
            request.RelativeWidth,
            request.RelativeHeight,
            request.CameraSourceId);

        if (request.IsActive) entity.Activate();
        else entity.Deactivate();

        entity.SetSupervisors(request.SupervisorIds);
        entity.SetRequiredPpeClasses(request.RequiredPpeClassIds);

        await _repository.UpdateAsync(entity);

        var dto = _mapper.Map<HazardousZoneDto>(entity);
        return ServiceResult<HazardousZoneDto>.Success(dto);
    }

    public async Task<ServiceResult<HazardousZoneDto>> GetByIdAsync(Guid id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null)
        {
            return ServiceResult<HazardousZoneDto>.Failure("Hazardous Zone not found.");
        }

        var dto = _mapper.Map<HazardousZoneDto>(entity);
        return ServiceResult<HazardousZoneDto>.Success(dto);
    }

    public async Task<ServiceResult<PaginatedList<HazardousZoneDto>>> GetPaginatedAsync(GetHazardousZonesQuery query)
    {
        var queryable = _repository.Query();

        if (query.IsActive.HasValue)
        {
            queryable = queryable.Where(x => x.IsActive == query.IsActive.Value);
        }

        // Just sorting by Name for now
        queryable = queryable.OrderBy(x => x.Name);

        var count = await queryable.CountAsync();
        var items = await queryable
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        var dtos = _mapper.Map<List<HazardousZoneDto>>(items);
        var paginated = new PaginatedList<HazardousZoneDto>(dtos, count, query.PageNumber, query.PageSize);

        return ServiceResult<PaginatedList<HazardousZoneDto>>.Success(paginated);
    }

    public async Task<ServiceResult<bool>> SoftDeleteAsync(Guid id)
    {
        var entity = await _repository.GetByIdAsync(id);
        if (entity == null)
        {
            return ServiceResult<bool>.Failure("Hazardous Zone not found.");
        }

        entity.IsDeleted = true;
        await _repository.UpdateAsync(entity);

        return ServiceResult<bool>.Success(true);
    }
}
