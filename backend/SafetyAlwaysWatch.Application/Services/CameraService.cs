using AutoMapper;
using SafetyAlwaysWatch.Application.DTOs.Cameras;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Interfaces;

namespace SafetyAlwaysWatch.Application.Services;

public class CameraService : ICameraService
{
    private readonly IRepository<Camera> _cameraRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CameraService(
        IRepository<Camera> cameraRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _cameraRepository = cameraRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<CameraDto> CreateCameraAsync(CreateCameraDto dto, CancellationToken cancellationToken = default)
    {
        var camera = new Camera(dto.Name, dto.Location, dto.StreamUrl);
        
        await _cameraRepository.AddAsync(camera, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);
        
        return _mapper.Map<CameraDto>(camera);
    }

    public async Task<IEnumerable<CameraDto>> GetCamerasAsync(CancellationToken cancellationToken = default)
    {
        var cameras = await _cameraRepository.GetAllAsync(cancellationToken);
        return _mapper.Map<IEnumerable<CameraDto>>(cameras);
    }

    public async Task<CameraDto?> GetCameraByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var camera = await _cameraRepository.GetByIdAsync(id, cancellationToken);
        if (camera == null) return null;
        
        return _mapper.Map<CameraDto>(camera);
    }
}
