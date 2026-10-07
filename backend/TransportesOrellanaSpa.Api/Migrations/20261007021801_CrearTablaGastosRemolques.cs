using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TransportesOrellanaSpa.Api.Migrations
{
    /// <inheritdoc />
    public partial class CrearTablaGastosRemolques : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GastosRemolque",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RemolqueId = table.Column<int>(type: "integer", nullable: false),
                    Fecha = table.Column<DateTime>(type: "date", nullable: false),
                    TipoGasto = table.Column<string>(type: "text", nullable: false),
                    Descripcion = table.Column<string>(type: "text", nullable: false),
                    Monto = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    Observaciones = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GastosRemolque", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GastosRemolque_Remolques_RemolqueId",
                        column: x => x.RemolqueId,
                        principalTable: "Remolques",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GastosRemolque_RemolqueId",
                table: "GastosRemolque",
                column: "RemolqueId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GastosRemolque");
        }
    }
}
