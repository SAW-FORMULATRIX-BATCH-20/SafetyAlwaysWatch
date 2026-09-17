using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SafetyAlwaysWatch.Domain.Entities;

namespace SafetyAlwaysWatch.Infrastructure.Persistence.Configurations;

public class ScoreResetLogConfiguration : IEntityTypeConfiguration<ScoreResetLog>
{
    public void Configure(EntityTypeBuilder<ScoreResetLog> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.ResetReason)
            .HasConversion<string>();

        builder.Property(x => x.TriggerType)
            .HasConversion<string>();

        builder.HasOne<Employee>()
            .WithMany()
            .HasForeignKey(x => x.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<SafetyScorePeriodSummary>()
            .WithMany()
            .HasForeignKey(x => x.RelatedPeriodSummaryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
