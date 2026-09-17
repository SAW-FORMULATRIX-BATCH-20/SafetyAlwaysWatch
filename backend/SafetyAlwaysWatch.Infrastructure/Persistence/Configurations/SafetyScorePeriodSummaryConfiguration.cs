using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SafetyAlwaysWatch.Domain.Entities;

namespace SafetyAlwaysWatch.Infrastructure.Persistence.Configurations;

public class SafetyScorePeriodSummaryConfiguration : IEntityTypeConfiguration<SafetyScorePeriodSummary>
{
    public void Configure(EntityTypeBuilder<SafetyScorePeriodSummary> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.ViolationsByPpeClassJson)
            .IsRequired()
            .HasColumnType("jsonb");

        builder.HasOne<Employee>()
            .WithMany()
            .HasForeignKey(x => x.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
