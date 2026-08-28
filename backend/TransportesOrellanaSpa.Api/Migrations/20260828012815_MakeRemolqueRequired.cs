using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransportesOrellanaSpa.Api.Migrations
{
    /// <inheritdoc />
    public partial class MakeRemolqueRequired : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Viajes_Remolques_RemolqueId",
                table: "Viajes");

            migrationBuilder.AlterColumn<int>(
                name: "RemolqueId",
                table: "Viajes",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Viajes_Remolques_RemolqueId",
                table: "Viajes",
                column: "RemolqueId",
                principalTable: "Remolques",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Viajes_Remolques_RemolqueId",
                table: "Viajes");

            migrationBuilder.AlterColumn<int>(
                name: "RemolqueId",
                table: "Viajes",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "FK_Viajes_Remolques_RemolqueId",
                table: "Viajes",
                column: "RemolqueId",
                principalTable: "Remolques",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
