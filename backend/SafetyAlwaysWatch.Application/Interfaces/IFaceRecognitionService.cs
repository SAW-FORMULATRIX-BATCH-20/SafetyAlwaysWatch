namespace SafetyAlwaysWatch.Application.Interfaces;

public interface IFaceRecognitionService
{
    Task<(byte[] Embedding, double QualityScore)?> ExtractFaceEmbeddingAsync(Stream imageStream);
}
