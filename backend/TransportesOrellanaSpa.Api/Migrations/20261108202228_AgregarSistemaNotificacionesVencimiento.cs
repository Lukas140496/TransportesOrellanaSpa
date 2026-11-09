using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TransportesOrellanaSpa.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarSistemaNotificacionesVencimiento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PermisoAlDia",
                table: "Camiones");

            migrationBuilder.DropColumn(
                name: "RevisionAlDia",
                table: "Camiones");

            migrationBuilder.DropColumn(
                name: "SeguroAlDia",
                table: "Camiones");

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaPermisoCirculacion",
                table: "Remolques",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaRevisionTecnica",
                table: "Remolques",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaSeguro",
                table: "Remolques",
                type: "date",
                nullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaSeguroObligatorio",
                table: "Camiones",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "date");

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaRevisionTecnica",
                table: "Camiones",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "date");

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaPermisoCirculacion",
                table: "Camiones",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "date");

            migrationBuilder.CreateTable(
                name: "EnvioNotificacion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TipoEntidad = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    EntidadId = table.Column<int>(type: "integer", nullable: false),
                    TipoDocumento = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FechaVencimiento = table.Column<DateTime>(type: "date", nullable: false),
                    DiasAnticipacion = table.Column<int>(type: "integer", nullable: false),
                    Destinatario = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    Estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Intentos = table.Column<int>(type: "integer", nullable: false),
                    FechaCreacionUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaUltimoIntentoUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaProximoIntentoUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaEnvioUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UltimoError = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnvioNotificacion", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NotificacionVencimientoDocumentoCamion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CamionId = table.Column<int>(type: "integer", nullable: false),
                    TipoDocumento = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FechaVencimiento = table.Column<DateTime>(type: "date", nullable: false),
                    FechaCreacionUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DiasAnticipacion = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificacionVencimientoDocumentoCamion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotificacionVencimientoDocumentoCamion_Camiones_CamionId",
                        column: x => x.CamionId,
                        principalTable: "Camiones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NotificacionVencimientoDocumentoConductor",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ConductorId = table.Column<int>(type: "integer", nullable: false),
                    TipoDocumento = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FechaVencimiento = table.Column<DateTime>(type: "date", nullable: false),
                    DiasAnticipacion = table.Column<int>(type: "integer", nullable: false),
                    FechaCreacionUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificacionVencimientoDocumentoConductor", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotificacionVencimientoDocumentoConductor_Conductores_Condu~",
                        column: x => x.ConductorId,
                        principalTable: "Conductores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NotificacionVencimientoDocumentoRemolque",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RemolqueId = table.Column<int>(type: "integer", nullable: false),
                    TipoDocumento = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FechaVencimiento = table.Column<DateTime>(type: "date", nullable: false),
                    DiasAnticipacion = table.Column<int>(type: "integer", nullable: false),
                    FechaCreacionUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificacionVencimientoDocumentoRemolque", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotificacionVencimientoDocumentoRemolque_Remolques_Remolque~",
                        column: x => x.RemolqueId,
                        principalTable: "Remolques",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EnvioNotificacion_TipoEntidad_EntidadId_TipoDocumento_Fecha~",
                table: "EnvioNotificacion",
                columns: new[] { "TipoEntidad", "EntidadId", "TipoDocumento", "FechaVencimiento", "DiasAnticipacion", "Destinatario" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NotificacionVencimientoDocumentoCamion_CamionId_TipoDocumen~",
                table: "NotificacionVencimientoDocumentoCamion",
                columns: new[] { "CamionId", "TipoDocumento", "FechaVencimiento", "DiasAnticipacion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NotificacionVencimientoDocumentoConductor_ConductorId_TipoD~",
                table: "NotificacionVencimientoDocumentoConductor",
                columns: new[] { "ConductorId", "TipoDocumento", "FechaVencimiento", "DiasAnticipacion" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NotificacionVencimientoDocumentoRemolque_RemolqueId_TipoDoc~",
                table: "NotificacionVencimientoDocumentoRemolque",
                columns: new[] { "RemolqueId", "TipoDocumento", "FechaVencimiento", "DiasAnticipacion" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EnvioNotificacion");

            migrationBuilder.DropTable(
                name: "NotificacionVencimientoDocumentoCamion");

            migrationBuilder.DropTable(
                name: "NotificacionVencimientoDocumentoConductor");

            migrationBuilder.DropTable(
                name: "NotificacionVencimientoDocumentoRemolque");

            migrationBuilder.DropColumn(
                name: "FechaPermisoCirculacion",
                table: "Remolques");

            migrationBuilder.DropColumn(
                name: "FechaRevisionTecnica",
                table: "Remolques");

            migrationBuilder.DropColumn(
                name: "FechaSeguro",
                table: "Remolques");

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaSeguroObligatorio",
                table: "Camiones",
                type: "date",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "date",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaRevisionTecnica",
                table: "Camiones",
                type: "date",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "date",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaPermisoCirculacion",
                table: "Camiones",
                type: "date",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "date",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PermisoAlDia",
                table: "Camiones",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "RevisionAlDia",
                table: "Camiones",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SeguroAlDia",
                table: "Camiones",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
