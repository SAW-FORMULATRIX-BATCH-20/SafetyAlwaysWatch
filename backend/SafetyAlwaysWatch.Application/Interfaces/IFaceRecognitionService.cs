namespace SafetyAlwaysWatch.Application.Interfaces;

public interface IFaceRecognitionService
{
    Task<(byte[] Embedding, double QualityScore)?> ExtractFaceEmbeddingAsync(Stream imageStream);
    Task<Guid?> MatchEmbeddingAsync(byte[] embedding, CancellationToken cancellationToken = default);
}
