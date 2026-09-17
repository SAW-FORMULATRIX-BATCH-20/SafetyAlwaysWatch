using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SafetyAlwaysWatch.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthAndEmployeeCredentials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Employees",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "Employees",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "RequiresPasswordChange",
                table: "Employees",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "Employees",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.InsertData(
                table: "Employees",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DepartmentId", "Email", "EmployeeCode", "FullName", "HasFaceEnrolled", "IsDeleted", "PasswordHash", "Role", "SafetyCreditScore", "Status", "SupervisorId", "UpdatedAt", "UpdatedBy" },
                values: new object[] { new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), null, null, new Guid("33333333-3333-3333-3333-333333333333"), "admin@saw.local", "ADM-001", "Admin SAW", false, false, "ZwSkDi51ttJOzuV3FCIMhw==.HHGErah3ZRjpwAi3AoHjL+2aqn3cZH0W0agtD+WkMI4=", "Admin", 100.0, 1, null, null, null });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_Email",
                table: "Employees",
                column: "Email");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Employees_Email",
                table: "Employees");

            migrationBuilder.DeleteData(
                table: "Employees",
                keyColumn: "Id",
                keyValue: new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"));

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "RequiresPasswordChange",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "Employees");
        }
    }
}
