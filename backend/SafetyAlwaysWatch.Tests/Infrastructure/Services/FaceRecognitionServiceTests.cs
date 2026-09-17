using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Interfaces;
using SafetyAlwaysWatch.Infrastructure.Services;

namespace SafetyAlwaysWatch.Tests.Infrastructure.Services;

[TestFixture]
public class FaceRecognitionServiceTests
{
    private Mock<IRepository<EmployeeFaceEmbedding>> _mockEmbeddingRepo;
    private FaceRecognitionService _service;

    [SetUp]
    public void Setup()
    {
        _mockEmbeddingRepo = new Mock<IRepository<EmployeeFaceEmbedding>>();
        _service = new FaceRecognitionService(_mockEmbeddingRepo.Object);
    }

    private byte[] FloatsToBytes(float[] floats)
    {
        var bytes = new byte[floats.Length * 4];
        Buffer.BlockCopy(floats, 0, bytes, 0, bytes.Length);
        return bytes;
    }

    [Test]
    public async Task MatchEmbeddingAsync_WhenExactMatchFound_ReturnsEmployeeId()
    {
        // Arrange
        var employeeId = Guid.NewGuid();
        // A simple vector [1, 0, 0]
        var targetEmbedding = FloatsToBytes(new float[] { 1f, 0f, 0f });

        var embeddings = new List<EmployeeFaceEmbedding>
        {
            new EmployeeFaceEmbedding(employeeId, targetEmbedding, 0.9)
        };

        _mockEmbeddingRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<System.Func<EmployeeFaceEmbedding, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(embeddings);

        // Act
        // We pass the exact same vector
        var result = await _service.MatchEmbeddingAsync(targetEmbedding);

        // Assert
        Assert.That(result, Is.EqualTo(employeeId));
    }

    [Test]
    public async Task MatchEmbeddingAsync_WhenSimilarityIsBelowThreshold_ReturnsNull()
    {
        // Arrange
        var employeeId = Guid.NewGuid();
        // Target is [1, 0]
        var dbEmbedding = FloatsToBytes(new float[] { 1f, 0f });

        var embeddings = new List<EmployeeFaceEmbedding>
        {
            new EmployeeFaceEmbedding(employeeId, dbEmbedding, 0.9)
        };

        _mockEmbeddingRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<System.Func<EmployeeFaceEmbedding, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(embeddings);

        // Act
        // Input is [0, 1] which is orthogonal (cosine similarity = 0), below the threshold
        var inputEmbedding = FloatsToBytes(new float[] { 0f, 1f });
        var result = await _service.MatchEmbeddingAsync(inputEmbedding);

        // Assert
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task MatchEmbeddingAsync_WithMultipleFaces_ReturnsHighestSimilarityAboveThreshold()
    {
        // Arrange
        var employeeId1 = Guid.NewGuid();
        var employeeId2 = Guid.NewGuid();

        // Base vectors
        var dbEmbedding1 = FloatsToBytes(new float[] { 1f, 0f, 0f }); // Cosine to input: 0.5
        var dbEmbedding2 = FloatsToBytes(new float[] { 0.9f, 0.435f, 0f }); // Cosine to input: ~0.9

        var embeddings = new List<EmployeeFaceEmbedding>
        {
            new EmployeeFaceEmbedding(employeeId1, dbEmbedding1, 0.9),
            new EmployeeFaceEmbedding(employeeId2, dbEmbedding2, 0.9)
        };

        _mockEmbeddingRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<System.Func<EmployeeFaceEmbedding, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(embeddings);

        // Act
        // Input vector
        var inputEmbedding = FloatsToBytes(new float[] { 0.5f, 0.866f, 0f });
        var result = await _service.MatchEmbeddingAsync(inputEmbedding);

        // Assert
        Assert.That(result, Is.EqualTo(employeeId2));
    }

    [Test]
    public async Task MatchEmbeddingAsync_WhenDbHasNoEmbeddings_ReturnsNull()
    {
        // Arrange
        _mockEmbeddingRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<System.Func<EmployeeFaceEmbedding, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<EmployeeFaceEmbedding>());

        // Act
        var inputEmbedding = FloatsToBytes(new float[] { 1f, 0f, 0f });
        var result = await _service.MatchEmbeddingAsync(inputEmbedding);

        // Assert
        Assert.That(result, Is.Null);
    }
}
