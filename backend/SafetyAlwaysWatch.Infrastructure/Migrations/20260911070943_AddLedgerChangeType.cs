using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SafetyAlwaysWatch.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLedgerChangeType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ChangeType",
                table: "SafetyScoreLedgers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "SafetyScoreLedgers",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ChangeType",
                table: "SafetyScoreLedgers");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "SafetyScoreLedgers");
        }
    }
}
