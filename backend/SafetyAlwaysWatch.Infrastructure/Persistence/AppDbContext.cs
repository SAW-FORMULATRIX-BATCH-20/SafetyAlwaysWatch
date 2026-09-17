using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using SafetyAlwaysWatch.Domain.Common;
using SafetyAlwaysWatch.Domain.Entities;
using SafetyAlwaysWatch.Domain.Enums;
using System.Reflection;
using System.Linq.Expressions;

using SafetyAlwaysWatch.Domain.Interfaces;

namespace SafetyAlwaysWatch.Infrastructure.Persistence;

public class AppDbContext : DbContext, IUnitOfWork
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<SystemSetting> SystemSettings { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<Camera> Cameras { get; set; }
    public DbSet<HazardousZone> HazardousZones { get; set; }
    public DbSet<SafetyScoreLedger> SafetyScoreLedgers { get; set; }
    public DbSet<Department> Departments { get; set; }
    public DbSet<EmployeeFaceEmbedding> EmployeeFaceEmbeddings { get; set; }
    public DbSet<ViolationCandidateState> ViolationCandidateStates { get; set; }
    public DbSet<ViolationEvent> ViolationEvents { get; set; }
    public DbSet<SafetyScorePeriodSummary> SafetyScorePeriodSummaries { get; set; }
    public DbSet<ScoreResetLog> ScoreResetLogs { get; set; }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        await Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitAsync(CancellationToken cancellationToken = default)
    {
        await SaveChangesAsync(cancellationToken);
        if (Database.CurrentTransaction != null)
        {
            await Database.CurrentTransaction.CommitAsync(cancellationToken);
        }
    }

    public async Task RollbackAsync(CancellationToken cancellationToken = default)
    {
        if (Database.CurrentTransaction != null)
        {
            await Database.CurrentTransaction.RollbackAsync(cancellationToken);
        }
    }

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

        // Seed SystemSettings
        modelBuilder.Entity<SystemSetting>().HasData(
            new SystemSetting { Key = "SafetyScore:InitialValue", Value = "100" },
            new SystemSetting { Key = "SafetyScore:DeductionPerViolation", Value = "5" },
            new SystemSetting { Key = "Violation:ConfirmThresholdSeconds", Value = "3" },
            new SystemSetting { Key = "Violation:ClearThresholdSeconds", Value = "5" },
            new SystemSetting { Key = "Detection:MinConfidenceThreshold", Value = "0.5" }
        );

        // Seed Departments
        modelBuilder.Entity<Department>().HasData(
            new Department(Guid.Parse("11111111-1111-1111-1111-111111111111"), "Produksi"),
            new Department(Guid.Parse("22222222-2222-2222-2222-222222222222"), "Gudang"),
            new Department(Guid.Parse("33333333-3333-3333-3333-333333333333"), "IT")
        );

        // Seed Initial Admin Account (Issue #47)
        modelBuilder.Entity<Employee>().HasData(
            new Employee(
                Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                "ADM-001",
                "Admin SAW",
                Guid.Parse("33333333-3333-3333-3333-333333333333"),
                100.0,
                "admin@saw.local",
                "ZwSkDi51ttJOzuV3FCIMhw==.HHGErah3ZRjpwAi3AoHjL+2aqn3cZH0W0agtD+WkMI4=",
                EmployeeRole.Admin,
                false)
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
