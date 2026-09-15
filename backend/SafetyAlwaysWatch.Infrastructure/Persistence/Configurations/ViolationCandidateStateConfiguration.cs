using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SafetyAlwaysWatch.Domain.Entities;

namespace SafetyAlwaysWatch.Infrastructure.Persistence.Configurations;

public class ViolationCandidateStateConfiguration : IEntityTypeConfiguration<ViolationCandidateState>
{
    public void Configure(EntityTypeBuilder<ViolationCandidateState> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TrackId).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Status).IsRequired();

        builder.HasOne<HazardousZone>()
            .WithMany()
            .HasForeignKey(x => x.DangerZoneId)
            .OnDelete(DeleteBehavior.Restrict);

        // Employee can be null
        builder.HasOne<Employee>()
            .WithMany()
            .HasForeignKey(x => x.EmployeeId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ViolationEvent>()
            .WithMany()
            .HasForeignKey(x => x.ViolationEventId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
