using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransportesOrellanaSpa.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddViajeStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Estado",
                table: "Viajes",
                type: "text",
                nullable: false,
                defaultValue: "Pendiente");

            migrationBuilder.AddColumn<string>(
                name: "EstadoPago",
                table: "Viajes",
                type: "text",
                nullable: false,
                defaultValue: "Pendiente");

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaPago",
                table: "Viajes",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Estado",
                table: "Viajes");

            migrationBuilder.DropColumn(
                name: "EstadoPago",
                table: "Viajes");

            migrationBuilder.DropColumn(
                name: "FechaPago",
                table: "Viajes");
        }
    }
}
