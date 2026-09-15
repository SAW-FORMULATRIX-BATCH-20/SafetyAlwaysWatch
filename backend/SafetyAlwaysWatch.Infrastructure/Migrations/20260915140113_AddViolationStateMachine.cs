using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SafetyAlwaysWatch.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddViolationStateMachine : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ViolationEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uuid", nullable: true),
                    DangerZoneId = table.Column<Guid>(type: "uuid", nullable: false),
                    MissingPpeClassIdsJson = table.Column<string>(type: "text", nullable: false),
                    DetectedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EvidenceDeliveryStatus = table.Column<int>(type: "integer", nullable: false),
                    ScoreDeducted = table.Column<double>(type: "double precision", nullable: false),
                    ViolationCandidateStateId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ViolationEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ViolationEvents_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ViolationEvents_HazardousZones_DangerZoneId",
                        column: x => x.DangerZoneId,
                        principalTable: "HazardousZones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ViolationCandidateStates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TrackId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DangerZoneId = table.Column<Guid>(type: "uuid", nullable: false),
                    MissingPpeClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    FirstDetectedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastNonCompliantAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastCompliantAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    EmployeeId = table.Column<Guid>(type: "uuid", nullable: true),
                    ViolationEventId = table.Column<Guid>(type: "uuid", nullable: true),
                    ConfirmedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ClearedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ViolationCandidateStates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ViolationCandidateStates_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ViolationCandidateStates_HazardousZones_DangerZoneId",
                        column: x => x.DangerZoneId,
                        principalTable: "HazardousZones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ViolationCandidateStates_ViolationEvents_ViolationEventId",
                        column: x => x.ViolationEventId,
                        principalTable: "ViolationEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Key", "CreatedAt", "CreatedBy", "IsDeleted", "UpdatedAt", "UpdatedBy", "Value" },
                values: new object[,]
                {
                    { "Detection:MinConfidenceThreshold", null, null, false, null, null, "0.5" },
                    { "SafetyScore:DeductionPerViolation", null, null, false, null, null, "5" },
                    { "SafetyScore:InitialValue", null, null, false, null, null, "100" },
                    { "Violation:ClearThresholdSeconds", null, null, false, null, null, "5" },
                    { "Violation:ConfirmThresholdSeconds", null, null, false, null, null, "3" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ViolationCandidateStates_DangerZoneId",
                table: "ViolationCandidateStates",
                column: "DangerZoneId");

            migrationBuilder.CreateIndex(
                name: "IX_ViolationCandidateStates_EmployeeId",
                table: "ViolationCandidateStates",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_ViolationCandidateStates_ViolationEventId",
                table: "ViolationCandidateStates",
                column: "ViolationEventId");

            migrationBuilder.CreateIndex(
                name: "IX_ViolationEvents_DangerZoneId",
                table: "ViolationEvents",
                column: "DangerZoneId");

            migrationBuilder.CreateIndex(
                name: "IX_ViolationEvents_EmployeeId",
                table: "ViolationEvents",
                column: "EmployeeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ViolationCandidateStates");

            migrationBuilder.DropTable(
                name: "ViolationEvents");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Key",
                keyValue: "Detection:MinConfidenceThreshold");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Key",
                keyValue: "SafetyScore:DeductionPerViolation");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Key",
                keyValue: "SafetyScore:InitialValue");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Key",
                keyValue: "Violation:ClearThresholdSeconds");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Key",
                keyValue: "Violation:ConfirmThresholdSeconds");
        }
    }
}
