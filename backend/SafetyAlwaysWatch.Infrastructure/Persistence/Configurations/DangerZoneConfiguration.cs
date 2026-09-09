using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SafetyAlwaysWatch.Domain.Entities;

namespace SafetyAlwaysWatch.Infrastructure.Persistence.Configurations;

public class DangerZoneConfiguration : IEntityTypeConfiguration<DangerZone>
{
    public void Configure(EntityTypeBuilder<DangerZone> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(200);

        // Map primitive collection as JSON array (EF Core 8+ on PG)
        builder.PrimitiveCollection(x => x.SupervisorIds);
    }
}
