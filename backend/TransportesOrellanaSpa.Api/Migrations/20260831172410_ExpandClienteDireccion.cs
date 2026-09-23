using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransportesOrellanaSpa.Api.Migrations
{
    /// <inheritdoc />
    public partial class ExpandClienteDireccion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Ubicacion",
                table: "Clientes",
                newName: "Direccion");

            migrationBuilder.AddColumn<string>(
                name: "Ciudad",
                table: "Clientes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Comuna",
                table: "Clientes",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Ciudad",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "Comuna",
                table: "Clientes");

            migrationBuilder.RenameColumn(
                name: "Direccion",
                table: "Clientes",
                newName: "Ubicacion");
        }
    }
}
