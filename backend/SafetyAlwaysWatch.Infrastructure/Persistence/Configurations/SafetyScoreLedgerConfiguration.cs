using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SafetyAlwaysWatch.Domain.Entities;

namespace SafetyAlwaysWatch.Infrastructure.Persistence.Configurations;

public class SafetyScoreLedgerConfiguration : IEntityTypeConfiguration<SafetyScoreLedger>
{
    public void Configure(EntityTypeBuilder<SafetyScoreLedger> builder)
    {
        builder.HasKey(x => x.Id);
        
        builder.HasIndex(x => x.EmployeeId);
        builder.HasIndex(x => x.Timestamp);
    }
}
