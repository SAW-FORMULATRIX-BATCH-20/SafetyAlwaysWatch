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
    private readonly IZoneComplianceEvaluator _zoneEvaluator;
    private readonly IInferenceResultPublisher _publisher;

    public InferenceIngestionService(
        IIdentityResolverService identityResolver,
        ITrackIdentityCache cache,
        IViolationStabilizationService stabilization,
        IUnitOfWork unitOfWork,
        IZoneComplianceEvaluator zoneEvaluator,
        IInferenceResultPublisher publisher)
    {
        _identityResolver = identityResolver;
        _cache = cache;
        _stabilization = stabilization;
        _unitOfWork = unitOfWork;
        _zoneEvaluator = zoneEvaluator;
        _publisher = publisher;
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
                    await _stabilization.HandleLostTrackAsync(person.TrackId, cancellationToken);
                    
                    outputPersons.Add(new DetectedPersonOutput(
                        person.TrackId, person.BoundingBox, person.Confidence, null, "Lost", null, false, false, new List<PpeItemOutput>(), true));
                }
                else
                {
                    var identity = await _identityResolver.ResolveIdentityAsync(person.TrackId, person.FaceEmbedding, cancellationToken);
                    var zoneCompliance = await _zoneEvaluator.EvaluateAsync(payload.CameraId, person, cancellationToken);

                    if (zoneCompliance.IsInZone && !zoneCompliance.IsCompliant && zoneCompliance.HazardousZoneId.HasValue && zoneCompliance.MissingPpeClassId.HasValue)
                    {
                        await _stabilization.ProcessDetectionAsync(
                            person.TrackId,
                            zoneCompliance.HazardousZoneId.Value,
                            zoneCompliance.MissingPpeClassId.Value,
                            zoneCompliance.IsCompliant,
                            person.Confidence,
                            payload.Timestamp,
                            identity.EmployeeId,
                            null, // frameSnapshot is not implemented yet
                            cancellationToken
                        );
                    }

                    outputPersons.Add(new DetectedPersonOutput(
                        person.TrackId, person.BoundingBox, person.Confidence, identity.EmployeeId, identity.DisplayName, identity.CurrentSafetyScore, identity.IsIdentified, zoneCompliance.IsCompliant, new List<PpeItemOutput>(), false));
                }
            }
            await _unitOfWork.CommitAsync(cancellationToken);

            var frameOutput = new DetectionFrameOutput(payload.CameraId, payload.Timestamp, outputPersons);
            await _publisher.PublishAsync(payload.CameraId, frameOutput, cancellationToken);
            return frameOutput;
        }
        catch
        {
            await _unitOfWork.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
