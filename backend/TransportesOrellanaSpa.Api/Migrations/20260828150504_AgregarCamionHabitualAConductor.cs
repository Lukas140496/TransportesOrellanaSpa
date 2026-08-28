using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransportesOrellanaSpa.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCamionHabitualAConductor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CamionHabitualId",
                table: "Conductores",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Conductores_CamionHabitualId",
                table: "Conductores",
                column: "CamionHabitualId");

            migrationBuilder.AddForeignKey(
                name: "FK_Conductores_Camiones_CamionHabitualId",
                table: "Conductores",
                column: "CamionHabitualId",
                principalTable: "Camiones",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Conductores_Camiones_CamionHabitualId",
                table: "Conductores");

            migrationBuilder.DropIndex(
                name: "IX_Conductores_CamionHabitualId",
                table: "Conductores");

            migrationBuilder.DropColumn(
                name: "CamionHabitualId",
                table: "Conductores");
        }
    }
}
