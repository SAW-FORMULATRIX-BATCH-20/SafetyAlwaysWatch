using SafetyAlwaysWatch.Domain.Common;

namespace SafetyAlwaysWatch.Domain.Entities;

public class EmployeeFaceEmbedding : BaseEntity
{
    public Guid Id { get; private set; }
    public Guid EmployeeId { get; private set; }
    public Employee Employee { get; private set; } = null!;
    public byte[] Embedding { get; private set; }
    public bool IsActive { get; private set; }
    public double? QualityScore { get; private set; }

    private EmployeeFaceEmbedding()
    {
        Embedding = null!;
    }

    public EmployeeFaceEmbedding(Guid id, Guid employeeId, byte[] embedding, bool isActive, double? qualityScore)
    {
        Id = id;
        EmployeeId = employeeId;
        Embedding = embedding;
        IsActive = isActive;
        QualityScore = qualityScore;
    }

    public EmployeeFaceEmbedding(Guid employeeId, byte[] embedding, double? qualityScore = null)
        : this(Guid.NewGuid(), employeeId, embedding, true, qualityScore)
    {
    }

    public void Deactivate()
    {
        IsActive = false;
    }
}
