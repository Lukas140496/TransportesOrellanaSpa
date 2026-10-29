using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TransportesOrellanaSpa.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarDocumentosViajesConductoresRemolques : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DocumentoConductor",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ConductorId = table.Column<int>(type: "integer", nullable: false),
                    TipoDocumento = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NombreArchivo = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    BlobName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Periodo = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    FechaCarga = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentoConductor", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentoConductor_Conductores_ConductorId",
                        column: x => x.ConductorId,
                        principalTable: "Conductores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DocumentoRemolque",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RemolqueId = table.Column<int>(type: "integer", nullable: false),
                    TipoDocumento = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NombreArchivo = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    BlobName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    FechaCarga = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentoRemolque", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentoRemolque_Remolques_RemolqueId",
                        column: x => x.RemolqueId,
                        principalTable: "Remolques",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DocumentoViaje",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ViajeId = table.Column<int>(type: "integer", nullable: false),
                    TipoDocumento = table.Column<string>(type: "text", nullable: false),
                    NombreArchivo = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    BlobName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    FechaCarga = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentoViaje", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentoViaje_Viajes_ViajeId",
                        column: x => x.ViajeId,
                        principalTable: "Viajes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentoConductor_BlobName",
                table: "DocumentoConductor",
                column: "BlobName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentoConductor_ConductorId_TipoDocumento_Periodo",
                table: "DocumentoConductor",
                columns: new[] { "ConductorId", "TipoDocumento", "Periodo" });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentoRemolque_BlobName",
                table: "DocumentoRemolque",
                column: "BlobName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentoRemolque_RemolqueId_TipoDocumento",
                table: "DocumentoRemolque",
                columns: new[] { "RemolqueId", "TipoDocumento" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentoViaje_BlobName",
                table: "DocumentoViaje",
                column: "BlobName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentoViaje_ViajeId_TipoDocumento",
                table: "DocumentoViaje",
                columns: new[] { "ViajeId", "TipoDocumento" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DocumentoConductor");

            migrationBuilder.DropTable(
                name: "DocumentoRemolque");

            migrationBuilder.DropTable(
                name: "DocumentoViaje");
        }
    }
}
