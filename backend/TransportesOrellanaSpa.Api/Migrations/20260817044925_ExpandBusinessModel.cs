using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TransportesOrellanaSpa.Api.Migrations
{
    /// <inheritdoc />
    public partial class ExpandBusinessModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Camiones_Conductores_ConductorId",
                table: "Camiones");

            migrationBuilder.DropIndex(
                name: "IX_Camiones_ConductorId",
                table: "Camiones");

            migrationBuilder.DropColumn(
                name: "ConductorId",
                table: "Camiones");

            // ============================================================
            // CONDUCTOR - convertir LicenciaAlDia de text a boolean
            // ============================================================

            migrationBuilder.Sql("""
                ALTER TABLE "Conductores"
                ALTER COLUMN "LicenciaAlDia"
                TYPE boolean
                USING CASE
                    WHEN LOWER(TRIM("LicenciaAlDia")) IN ('true', '1', 'si', 'sí')
                        THEN true
                    ELSE false
                END;
            """);


            // ============================================================
            // CONDUCTOR - convertir fechas de text a timestamp
            // ============================================================

            migrationBuilder.Sql("""
                ALTER TABLE "Conductores"
                ALTER COLUMN "FechaNacimiento"
                TYPE timestamp with time zone
                USING "FechaNacimiento"::timestamp with time zone;
            """);

            migrationBuilder.Sql("""
                ALTER TABLE "Conductores"
                ALTER COLUMN "FechaIngreso"
                TYPE timestamp with time zone
                USING "FechaIngreso"::timestamp with time zone;
            """);

            migrationBuilder.Sql("""
                ALTER TABLE "Conductores"
                ALTER COLUMN "FechaControlLicencia"
                TYPE timestamp with time zone
                USING "FechaControlLicencia"::timestamp with time zone;
            """);


            // ============================================================
            // CAMIÓN - convertir fechas de text a timestamp
            // ============================================================

            migrationBuilder.Sql("""
                ALTER TABLE "Camiones"
                ALTER COLUMN "FechaRevisionTecnica"
                TYPE timestamp with time zone
                USING "FechaRevisionTecnica"::timestamp with time zone;
            """);

            migrationBuilder.Sql("""
                ALTER TABLE "Camiones"
                ALTER COLUMN "FechaPermisoCirculacion"
                TYPE timestamp with time zone
                USING "FechaPermisoCirculacion"::timestamp with time zone;
            """);

            migrationBuilder.Sql("""
                ALTER TABLE "Camiones"
                ALTER COLUMN "FechaSeguroObligatorio"
                TYPE timestamp with time zone
                USING "FechaSeguroObligatorio"::timestamp with time zone;
            """);

            migrationBuilder.AddColumn<int>(
                name: "ConductorHabitualId",
                table: "Camiones",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Clientes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nombre = table.Column<string>(type: "text", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clientes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Remolques",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Patente = table.Column<string>(type: "text", nullable: false),
                    Marca = table.Column<string>(type: "text", nullable: false),
                    Modelo = table.Column<string>(type: "text", nullable: false),
                    Ano = table.Column<int>(type: "integer", nullable: false),
                    Tipo = table.Column<string>(type: "text", nullable: false),
                    CapacidadToneladas = table.Column<double>(type: "double precision", nullable: false),
                    Activa = table.Column<bool>(type: "boolean", nullable: false),
                    CamionHabitualId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Remolques", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Remolques_Camiones_CamionHabitualId",
                        column: x => x.CamionHabitualId,
                        principalTable: "Camiones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Viajes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ClienteId = table.Column<int>(type: "integer", nullable: false),
                    CamionId = table.Column<int>(type: "integer", nullable: false),
                    ConductorId = table.Column<int>(type: "integer", nullable: false),
                    RemolqueId = table.Column<int>(type: "integer", nullable: true),
                    Origen = table.Column<string>(type: "text", nullable: false),
                    Destino = table.Column<string>(type: "text", nullable: false),
                    ComunaOrigen = table.Column<string>(type: "text", nullable: false),
                    ComunaDestino = table.Column<string>(type: "text", nullable: false),
                    TipoCarga = table.Column<string>(type: "text", nullable: false),
                    Kilometros = table.Column<double>(type: "double precision", nullable: true),
                    Tarifa = table.Column<decimal>(type: "numeric", nullable: false),
                    Observaciones = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Viajes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Viajes_Camiones_CamionId",
                        column: x => x.CamionId,
                        principalTable: "Camiones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Viajes_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Viajes_Conductores_ConductorId",
                        column: x => x.ConductorId,
                        principalTable: "Conductores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Viajes_Remolques_RemolqueId",
                        column: x => x.RemolqueId,
                        principalTable: "Remolques",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Conductores_Rut",
                table: "Conductores",
                column: "Rut",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Camiones_ConductorHabitualId",
                table: "Camiones",
                column: "ConductorHabitualId");

            migrationBuilder.CreateIndex(
                name: "IX_Camiones_Patente",
                table: "Camiones",
                column: "Patente",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Remolques_CamionHabitualId",
                table: "Remolques",
                column: "CamionHabitualId");

            migrationBuilder.CreateIndex(
                name: "IX_Remolques_Patente",
                table: "Remolques",
                column: "Patente",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Viajes_CamionId",
                table: "Viajes",
                column: "CamionId");

            migrationBuilder.CreateIndex(
                name: "IX_Viajes_ClienteId",
                table: "Viajes",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Viajes_ConductorId",
                table: "Viajes",
                column: "ConductorId");

            migrationBuilder.CreateIndex(
                name: "IX_Viajes_RemolqueId",
                table: "Viajes",
                column: "RemolqueId");

            migrationBuilder.AddForeignKey(
                name: "FK_Camiones_Conductores_ConductorHabitualId",
                table: "Camiones",
                column: "ConductorHabitualId",
                principalTable: "Conductores",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Camiones_Conductores_ConductorHabitualId",
                table: "Camiones");

            migrationBuilder.DropTable(
                name: "Viajes");

            migrationBuilder.DropTable(
                name: "Clientes");

            migrationBuilder.DropTable(
                name: "Remolques");

            migrationBuilder.DropIndex(
                name: "IX_Conductores_Rut",
                table: "Conductores");

            migrationBuilder.DropIndex(
                name: "IX_Camiones_ConductorHabitualId",
                table: "Camiones");

            migrationBuilder.DropIndex(
                name: "IX_Camiones_Patente",
                table: "Camiones");

            migrationBuilder.DropColumn(
                name: "ConductorHabitualId",
                table: "Camiones");

            migrationBuilder.AlterColumn<string>(
                name: "LicenciaAlDia",
                table: "Conductores",
                type: "text",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<string>(
                name: "FechaNacimiento",
                table: "Conductores",
                type: "text",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<string>(
                name: "FechaIngreso",
                table: "Conductores",
                type: "text",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<string>(
                name: "FechaControlLicencia",
                table: "Conductores",
                type: "text",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<string>(
                name: "FechaSeguroObligatorio",
                table: "Camiones",
                type: "text",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<string>(
                name: "FechaRevisionTecnica",
                table: "Camiones",
                type: "text",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<string>(
                name: "FechaPermisoCirculacion",
                table: "Camiones",
                type: "text",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AddColumn<int>(
                name: "ConductorId",
                table: "Camiones",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Camiones_ConductorId",
                table: "Camiones",
                column: "ConductorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Camiones_Conductores_ConductorId",
                table: "Camiones",
                column: "ConductorId",
                principalTable: "Conductores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
