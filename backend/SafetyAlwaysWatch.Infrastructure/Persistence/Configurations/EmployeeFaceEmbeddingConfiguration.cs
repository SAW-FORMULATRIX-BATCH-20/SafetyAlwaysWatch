using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SafetyAlwaysWatch.Domain.Entities;

namespace SafetyAlwaysWatch.Infrastructure.Persistence.Configurations;

public class EmployeeFaceEmbeddingConfiguration : IEntityTypeConfiguration<EmployeeFaceEmbedding>
{
    public void Configure(EntityTypeBuilder<EmployeeFaceEmbedding> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Embedding)
            .IsRequired();

        builder.HasOne(e => e.Employee)
            .WithMany(e => e.FaceEmbeddings)
            .HasForeignKey(e => e.EmployeeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
