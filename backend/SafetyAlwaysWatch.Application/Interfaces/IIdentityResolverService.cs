namespace SafetyAlwaysWatch.Application.Interfaces;

public record IdentityResult(
    Guid? EmployeeId,
    string DisplayName,
    int? CurrentSafetyScore,
    bool IsIdentified
);

public interface IIdentityResolverService
{
    Task<IdentityResult> ResolveIdentityAsync(string trackId, byte[]? faceEmbedding, Guid? simulatedEmployeeId, CancellationToken cancellationToken = default);
}
