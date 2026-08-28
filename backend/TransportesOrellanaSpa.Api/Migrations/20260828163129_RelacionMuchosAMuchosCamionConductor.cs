using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransportesOrellanaSpa.Api.Migrations
{
    /// <inheritdoc />
    public partial class RelacionMuchosAMuchosCamionConductor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Camiones_Conductores_ConductorHabitualId",
                table: "Camiones");

            migrationBuilder.DropForeignKey(
                name: "FK_Conductores_Camiones_CamionHabitualId",
                table: "Conductores");

            migrationBuilder.DropIndex(
                name: "IX_Conductores_CamionHabitualId",
                table: "Conductores");

            migrationBuilder.DropIndex(
                name: "IX_Camiones_ConductorHabitualId",
                table: "Camiones");

            migrationBuilder.DropColumn(
                name: "CamionHabitualId",
                table: "Conductores");

            migrationBuilder.DropColumn(
                name: "ConductorHabitualId",
                table: "Camiones");

            migrationBuilder.CreateTable(
                name: "CamionConductor",
                columns: table => new
                {
                    CamionId = table.Column<int>(type: "integer", nullable: false),
                    ConductorId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CamionConductor", x => new { x.CamionId, x.ConductorId });
                    table.ForeignKey(
                        name: "FK_CamionConductor_Camiones_CamionId",
                        column: x => x.CamionId,
                        principalTable: "Camiones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CamionConductor_Conductores_ConductorId",
                        column: x => x.ConductorId,
                        principalTable: "Conductores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CamionConductor_ConductorId",
                table: "CamionConductor",
                column: "ConductorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CamionConductor");

            migrationBuilder.AddColumn<int>(
                name: "CamionHabitualId",
                table: "Conductores",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ConductorHabitualId",
                table: "Camiones",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Conductores_CamionHabitualId",
                table: "Conductores",
                column: "CamionHabitualId");

            migrationBuilder.CreateIndex(
                name: "IX_Camiones_ConductorHabitualId",
                table: "Camiones",
                column: "ConductorHabitualId");

            migrationBuilder.AddForeignKey(
                name: "FK_Camiones_Conductores_ConductorHabitualId",
                table: "Camiones",
                column: "ConductorHabitualId",
                principalTable: "Conductores",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Conductores_Camiones_CamionHabitualId",
                table: "Conductores",
                column: "CamionHabitualId",
                principalTable: "Camiones",
                principalColumn: "Id");
        }
    }
}
