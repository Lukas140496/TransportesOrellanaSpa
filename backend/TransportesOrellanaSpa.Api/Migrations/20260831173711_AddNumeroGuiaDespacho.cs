using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransportesOrellanaSpa.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNumeroGuiaDespacho : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NumeroGuiaDespacho",
                table: "Viajes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql("""
                UPDATE "Viajes"
                SET "NumeroGuiaDespacho" = 'GD-' || "Id"::text
                WHERE "NumeroGuiaDespacho" = '';
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Viajes_NumeroGuiaDespacho",
                table: "Viajes",
                column: "NumeroGuiaDespacho",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Viajes_NumeroGuiaDespacho",
                table: "Viajes");

            migrationBuilder.DropColumn(
                name: "NumeroGuiaDespacho",
                table: "Viajes");
        }
    }
}
