using SafetyAlwaysWatch.Application.Interfaces;

using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Interfaces;
using System.Linq;
using System.Threading;

namespace SafetyAlwaysWatch.Infrastructure.Services;

public class DummyFaceRecognitionService : IFaceRecognitionService
{
    private readonly IRepository<EmployeeFaceEmbedding> _embeddingRepo;

    public DummyFaceRecognitionService(IRepository<EmployeeFaceEmbedding> embeddingRepo)
    {
        _embeddingRepo = embeddingRepo;
    }
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

    public async Task<Guid?> MatchEmbeddingAsync(byte[] embedding, CancellationToken cancellationToken = default)
    {
        // Dummy implementation: in reality this should use SFace cosine similarity.
        // We will fetch all active embeddings and find the closest match.
        var allEmbeddings = await _embeddingRepo.FindAsync(e => e.IsActive, cancellationToken);
        
        Guid? bestMatchId = null;
        double bestSimilarity = -1;

        foreach (var face in allEmbeddings)
        {
            // Simple mock cosine similarity (assumes normalized vectors)
            // For a dummy, we just do a mock sum product if lengths match.
            double similarity = 0;
            if (face.Embedding != null && face.Embedding.Length == embedding.Length)
            {
                for (int i = 0; i < embedding.Length; i++)
                {
                    similarity += embedding[i] * face.Embedding[i];
                }
            }

            // Mock threshold
            if (similarity > bestSimilarity && similarity > 0.6)
            {
                bestSimilarity = similarity;
                bestMatchId = face.EmployeeId;
            }
        }

        return bestMatchId;
    }
}
