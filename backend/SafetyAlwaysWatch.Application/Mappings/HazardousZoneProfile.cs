using AutoMapper;
using SafetyAlwaysWatch.Application.DTOs.HazardousZones;
using SafetyAlwaysWatch.Domain.Entities;

namespace SafetyAlwaysWatch.Application.Mappings;

public class HazardousZoneProfile : Profile
{
    public HazardousZoneProfile()
    {
        CreateMap<HazardousZone, HazardousZoneDto>();
    }
}
