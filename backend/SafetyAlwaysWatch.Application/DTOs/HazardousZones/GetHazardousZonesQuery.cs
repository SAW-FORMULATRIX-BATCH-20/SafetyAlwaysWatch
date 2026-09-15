namespace SafetyAlwaysWatch.Application.DTOs.HazardousZones;

public class GetHazardousZonesQuery
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public bool? IsActive { get; set; }
}
