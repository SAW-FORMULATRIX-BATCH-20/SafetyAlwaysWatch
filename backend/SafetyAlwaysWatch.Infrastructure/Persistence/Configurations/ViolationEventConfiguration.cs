using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SafetyAlwaysWatch.Domain.Entities;
using System.Text.Json;

namespace SafetyAlwaysWatch.Infrastructure.Persistence.Configurations;

public class ViolationEventConfiguration : IEntityTypeConfiguration<ViolationEvent>
{
    public void Configure(EntityTypeBuilder<ViolationEvent> builder)
    {
        builder.HasKey(x => x.Id);

        // Required relation
        builder.HasOne<HazardousZone>()
            .WithMany()
            .HasForeignKey(x => x.DangerZoneId)
            .OnDelete(DeleteBehavior.Restrict);

        // Optional relation
        builder.HasOne<Employee>()
            .WithMany()
            .HasForeignKey(x => x.EmployeeId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        // Map collection to JSON column (primitive collections in EF Core 8)
        builder.Property(x => x.MissingPpeClassIds)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                v => JsonSerializer.Deserialize<List<Guid>>(v, (JsonSerializerOptions)null) ?? new List<Guid>()
            )
            .HasColumnName("MissingPpeClassIdsJson");
    }
}
