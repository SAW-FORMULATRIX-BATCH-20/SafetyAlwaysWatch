using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Application.Services;

public class IdentityResolverService : IIdentityResolverService
{
    private readonly ITrackIdentityCache _cache;
    private readonly IFaceRecognitionService _faceRecognitionService;
    private readonly IRepository<Employee> _employeeRepository;

    public IdentityResolverService(
        ITrackIdentityCache cache,
        IFaceRecognitionService faceRecognitionService,
        IRepository<Employee> employeeRepository)
    {
        _cache = cache;
        _faceRecognitionService = faceRecognitionService;
        _employeeRepository = employeeRepository;
    }

    public async Task<IdentityResult> ResolveIdentityAsync(string trackId, byte[]? faceEmbedding, CancellationToken cancellationToken = default)
    {
        var cached = _cache.Get(trackId);
        if (cached != null)
        {
            return cached;
        }


        if (faceEmbedding != null && faceEmbedding.Length > 0)
        {
            var matchedId = await _faceRecognitionService.MatchEmbeddingAsync(faceEmbedding, cancellationToken);
            if (matchedId.HasValue)
            {
                var employee = await _employeeRepository.GetByIdAsync(matchedId.Value, cancellationToken);
                if (employee != null)
                {
                    var result = new IdentityResult(employee.Id, employee.FullName, (int)employee.SafetyCreditScore, true);
                    _cache.Set(trackId, result);
                    return result;
                }
            }
        }

        // Unknown
        return new IdentityResult(null, "Unknown", null, false);
    }
}
