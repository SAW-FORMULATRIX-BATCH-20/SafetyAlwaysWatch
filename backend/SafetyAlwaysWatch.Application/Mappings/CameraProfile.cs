using AutoMapper;
using SafetyAlwaysWatch.Application.DTOs.Cameras;
using SafetyAlwaysWatch.Domain.Entities;

namespace SafetyAlwaysWatch.Application.Mappings;

public class CameraProfile : Profile
{
    public CameraProfile()
    {
        CreateMap<Camera, CameraDto>();
        // Custom mapping for CreateCameraDto as it uses parameterized constructor if AutoMapper has trouble, but AutoMapper works fine for properties if empty constructor exists. Actually, Camera has parameterized constructor and private empty constructor.
        // Let's use manual creation in service layer if needed, or ConstructUsing. We'll use service layer to instantiate.
    }
}
