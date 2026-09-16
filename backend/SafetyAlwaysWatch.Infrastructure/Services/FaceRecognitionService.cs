using MathNet.Numerics.LinearAlgebra;
using MathNet.Numerics.LinearAlgebra.Single;
using SafetyAlwaysWatch.Application.Interfaces;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SafetyAlwaysWatch.Infrastructure.Services;

public class FaceRecognitionService : IFaceRecognitionService
{
    private readonly IRepository<EmployeeFaceEmbedding> _embeddingRepo;

    public FaceRecognitionService(IRepository<EmployeeFaceEmbedding> embeddingRepo)
    {
        _embeddingRepo = embeddingRepo;
    }

    public Task<(byte[] Embedding, double QualityScore)?> ExtractFaceEmbeddingAsync(System.IO.Stream imageStream)
    {
        // Extract logic not implemented for this TDD exercise
        throw new NotImplementedException();
    }

    public async Task<Guid?> MatchEmbeddingAsync(byte[] embedding, CancellationToken cancellationToken = default)
    {
        var allEmbeddings = await _embeddingRepo.FindAsync(e => e.IsActive, cancellationToken);

        Guid? bestMatchId = null;
        double bestSimilarity = -1;
        float[] inputFloats = BytesToFloats(embedding);

        foreach (var face in allEmbeddings)
        {
            if (face.Embedding != null && face.Embedding.Length == embedding.Length)
            {
                float[] faceFloats = BytesToFloats(face.Embedding);
                double distance = MathNet.Numerics.Distance.Cosine(inputFloats, faceFloats);
                double similarity = 1.0 - distance;

                if (similarity > bestSimilarity && similarity > 0.6)
                {
                    bestSimilarity = similarity;
                    bestMatchId = face.EmployeeId;
                }
            }
        }

        return bestMatchId;
    }

    private float[] BytesToFloats(byte[] bytes)
    {
        var floats = new float[bytes.Length / 4];
        Buffer.BlockCopy(bytes, 0, floats, 0, bytes.Length);
        return floats;
    }
}
