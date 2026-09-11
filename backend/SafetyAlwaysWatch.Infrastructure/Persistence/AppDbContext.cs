using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using SafetyAlwaysWatch.Domain.Common;
using SafetyAlwaysWatch.Domain.Entities;
using System.Reflection;
using System.Linq.Expressions;

namespace SafetyAlwaysWatch.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<SystemSetting> SystemSettings { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<DangerZone> DangerZones { get; set; }
    public DbSet<SafetyScoreLedger> SafetyScoreLedgers { get; set; }
    public DbSet<Department> Departments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // Global Query Filter for Soft Delete
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .HasQueryFilter(GetIsDeletedRestriction(entityType.ClrType));
            }
        }

        // Seed Departments
        modelBuilder.Entity<Department>().HasData(
            new Department(Guid.Parse("11111111-1111-1111-1111-111111111111"), "Produksi"),
            new Department(Guid.Parse("22222222-2222-2222-2222-222222222222"), "Gudang"),
            new Department(Guid.Parse("33333333-3333-3333-3333-333333333333"), "IT")
        );
    }

    private static LambdaExpression GetIsDeletedRestriction(Type type)
    {
        var param = Expression.Parameter(type, "it");
        var prop = Expression.Property(param, nameof(BaseEntity.IsDeleted));
        var condition = Expression.MakeBinary(ExpressionType.Equal, prop, Expression.Constant(false));
        return Expression.Lambda(condition, param);
    }
}
