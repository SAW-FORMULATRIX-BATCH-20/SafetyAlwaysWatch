using AutoMapper;
using SafetyAlwaysWatch.Application.DTOs.Employees;
using SafetyAlwaysWatch.Domain.Entities;

namespace SafetyAlwaysWatch.Application.Mappings;

public class EmployeeProfile : Profile
{
    public EmployeeProfile()
    {
        CreateMap<Employee, EmployeeDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id.ToString()))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.FullName))
            .ForMember(dest => dest.DepartmentId, opt => opt.MapFrom(src => src.Department))
            .ForMember(dest => dest.SafetyScore, opt => opt.MapFrom(src => src.SafetyCreditScore))
            .ForMember(dest => dest.EnrollmentStatus, opt => opt.MapFrom(src => src.HasFaceEnrolled ? "enrolled" : "not-enrolled"))
            .ForMember(dest => dest.SupervisorArea, opt => opt.Ignore())
            .ForMember(dest => dest.SafetyScorePeriodStartedAt, opt => opt.Ignore())
            .ForMember(dest => dest.LastAuditAt, opt => opt.Ignore())
            .ForMember(dest => dest.AuditSummary, opt => opt.Ignore());
    }
}
