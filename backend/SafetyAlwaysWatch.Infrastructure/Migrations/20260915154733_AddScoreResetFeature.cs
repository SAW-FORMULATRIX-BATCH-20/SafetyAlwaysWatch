using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SafetyAlwaysWatch.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddScoreResetFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SafetyScorePeriodSummaries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uuid", nullable: false),
                    PeriodStart = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    PeriodEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    FinalScoreBeforeReset = table.Column<double>(type: "double precision", nullable: false),
                    TotalViolations = table.Column<int>(type: "integer", nullable: false),
                    ViolationsByPpeClassJson = table.Column<string>(type: "jsonb", nullable: false),
                    TriggerType = table.Column<int>(type: "integer", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SafetyScorePeriodSummaries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SafetyScorePeriodSummaries_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ScoreResetLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResetAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ResetBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ResetReason = table.Column<string>(type: "text", nullable: false),
                    Note = table.Column<string>(type: "text", nullable: true),
                    TriggerType = table.Column<string>(type: "text", nullable: false),
                    RelatedPeriodSummaryId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScoreResetLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScoreResetLogs_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ScoreResetLogs_SafetyScorePeriodSummaries_RelatedPeriodSumm~",
                        column: x => x.RelatedPeriodSummaryId,
                        principalTable: "SafetyScorePeriodSummaries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SafetyScorePeriodSummaries_EmployeeId",
                table: "SafetyScorePeriodSummaries",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_ScoreResetLogs_EmployeeId",
                table: "ScoreResetLogs",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_ScoreResetLogs_RelatedPeriodSummaryId",
                table: "ScoreResetLogs",
                column: "RelatedPeriodSummaryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ScoreResetLogs");

            migrationBuilder.DropTable(
                name: "SafetyScorePeriodSummaries");
        }
    }
}
