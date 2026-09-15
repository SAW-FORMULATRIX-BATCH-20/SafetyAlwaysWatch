using SafetyAlwaysWatch.Application.DTOs.Inference;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Domain.Interfaces;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Application.Services;

public class InferenceIngestionService : IInferenceIngestionService
{
    private readonly IIdentityResolverService _identityResolver;
    private readonly ITrackIdentityCache _cache;
    private readonly IViolationStabilizationService _stabilization;
    private readonly IUnitOfWork _unitOfWork;

    public InferenceIngestionService(
        IIdentityResolverService identityResolver,
        ITrackIdentityCache cache,
        IViolationStabilizationService stabilization,
        IUnitOfWork unitOfWork)
    {
        _identityResolver = identityResolver;
        _cache = cache;
        _stabilization = stabilization;
        _unitOfWork = unitOfWork;
    }

    public async Task<DetectionFrameOutput> ProcessFrameAsync(IngestFrameDto payload, CancellationToken cancellationToken = default)
    {
        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var outputPersons = new List<DetectedPersonOutput>();

            foreach (var person in payload.Persons)
            {
                if (person.IsTrackLost)
                {
                    _cache.Remove(person.TrackId);
                    outputPersons.Add(new DetectedPersonOutput(
                        person.TrackId, person.BoundingBox, person.Confidence, null, "Lost", null, false, false, new List<PpeItemOutput>(), true));
                }
                else
                {
                    var identity = await _identityResolver.ResolveIdentityAsync(person.TrackId, person.FaceEmbedding, person.SimulatedEmployeeId, cancellationToken);
                    outputPersons.Add(new DetectedPersonOutput(
                        person.TrackId, person.BoundingBox, person.Confidence, identity.EmployeeId, identity.DisplayName, identity.CurrentSafetyScore, identity.IsIdentified, true, new List<PpeItemOutput>(), false));
                }
            }
            await _unitOfWork.CommitAsync(cancellationToken);

            var frameOutput = new DetectionFrameOutput(payload.CameraId, payload.Timestamp, outputPersons);
            return frameOutput;
        }
        catch
        {
            await _unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
