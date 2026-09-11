using SafetyAlwaysWatch.Domain.Common;

namespace SafetyAlwaysWatch.Domain.Entities;

public class Department : BaseEntity
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;

    private Department() { }

    public Department(Guid id, string name)
    {
        Id = id;
        Name = name;
    }
}
