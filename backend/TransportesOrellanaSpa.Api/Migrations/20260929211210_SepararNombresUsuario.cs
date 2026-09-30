using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TransportesOrellanaSpa.Api.Migrations
{
    /// <inheritdoc />
    public partial class SepararNombresUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Renombramos el campo existente.
            // "TPT Orellana" pasa temporalmente a quedar en "Nombres".
            migrationBuilder.RenameColumn(
                name: "Nombre",
                table: "Usuarios",
                newName: "Nombres");

            // Agregamos los apellidos como campos temporales.
            migrationBuilder.AddColumn<string>(
                name: "ApellidoMaterno",
                table: "Usuarios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ApellidoPaterno",
                table: "Usuarios",
                type: "text",
                nullable: true);

            // Migramos los datos del administrador existente.
            migrationBuilder.Sql("""
                UPDATE "Usuarios"
                SET
                    "Nombres" = 'TPT',
                    "ApellidoPaterno" = 'Orellana',
                    "ApellidoMaterno" = 'SpA'
                WHERE "Rut" = '78210028-9';
                """);

            // Una vez migrado el dato existente,
            // hacemos obligatorios los tres campos.
            migrationBuilder.AlterColumn<string>(
                name: "ApellidoMaterno",
                table: "Usuarios",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ApellidoPaterno",
                table: "Usuarios",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Restauramos el nombre original del usuario existente.
            migrationBuilder.Sql("""
                UPDATE "Usuarios"
                SET
                    "Nombres" =
                        TRIM(
                            COALESCE("Nombres", '') || ' ' ||
                            COALESCE("ApellidoPaterno", '')
                        )
                WHERE "Rut" = '78210028-9';
                """);

            migrationBuilder.DropColumn(
                name: "ApellidoMaterno",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "ApellidoPaterno",
                table: "Usuarios");

            migrationBuilder.RenameColumn(
                name: "Nombres",
                table: "Usuarios",
                newName: "Nombre");
        }
    }
}
