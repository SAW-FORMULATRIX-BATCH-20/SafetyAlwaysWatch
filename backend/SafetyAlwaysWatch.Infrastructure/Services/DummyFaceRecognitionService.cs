using SafetyAlwaysWatch.Application.Interfaces;

namespace SafetyAlwaysWatch.Infrastructure.Services;

public class DummyFaceRecognitionService : IFaceRecognitionService
{
    public Task<(byte[] Embedding, double QualityScore)?> ExtractFaceEmbeddingAsync(Stream imageStream)
    {
        // Simulate missing YuNet/SFace logic
        // This is a dummy implementation for testing purposes
        var random = new Random();
        var dummyEmbedding = new byte[128];
        random.NextBytes(dummyEmbedding);

        // Simulate quality score between 0.8 and 1.0
        var dummyQuality = 0.8 + (random.NextDouble() * 0.2);

        return Task.FromResult<(byte[], double)?>((dummyEmbedding, dummyQuality));
    }
}
