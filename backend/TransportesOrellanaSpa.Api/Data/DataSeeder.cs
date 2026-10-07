using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Models;
using TransportesOrellanaSpa.Api.Services;

namespace TransportesOrellanaSpa.Api.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(
        AppDbContext context,
        PasswordService passwordService,
        IConfiguration configuration)
    {
        // =========================
        // ROLES
        // =========================

        var administrador = await context.Roles
            .FirstOrDefaultAsync(r => r.Nombre == "Administrador");

        if (administrador == null)
        {
            administrador = new Rol
            {
                Nombre = "Administrador",
                Descripcion = "Acceso completo al sistema",
                Activo = true
            };

            context.Roles.Add(administrador);
        }

        var usuario = await context.Roles
            .FirstOrDefaultAsync(r => r.Nombre == "Usuario");

        if (usuario == null)
        {
            usuario = new Rol
            {
                Nombre = "Usuario",
                Descripcion = "Acceso general al sistema",
                Activo = true
            };

            context.Roles.Add(usuario);
        }

        await context.SaveChangesAsync();

        // =========================
        // MÓDULOS
        // =========================

        var modulos = new[]
        {
            new
            {
                Nombre = "Dashboard",
                Codigo = "DASHBOARD",
                Descripcion = "Panel principal del sistema"
            },
            new
            {
                Nombre = "Clientes",
                Codigo = "CLIENTES",
                Descripcion = "Gestión de clientes"
            },
            new
            {
                Nombre = "Conductores",
                Codigo = "CONDUCTORES",
                Descripcion = "Gestión de conductores"
            },
            new
            {
                Nombre = "Camiones",
                Codigo = "CAMIONES",
                Descripcion = "Gestión de camiones"
            },
            new
            {
                Nombre = "Remolques",
                Codigo = "REMOLQUES",
                Descripcion = "Gestión de remolques"
            },
            new
            {
                Nombre = "Gastos",
                Codigo = "GASTOS",
                Descripcion = "Gestión de gastos"
            },
            new
            {
                Nombre = "Viajes",
                Codigo = "VIAJES",
                Descripcion = "Gestión de viajes"
            },
            new
            {
                Nombre = "Usuarios",
                Codigo = "USUARIOS",
                Descripcion = "Gestión de usuarios y permisos"
            }
        };

        foreach (var moduloData in modulos)
        {
            var moduloExiste = await context.Modulos
                .AnyAsync(m => m.Codigo == moduloData.Codigo);

            if (!moduloExiste)
            {
                context.Modulos.Add(new Modulo
                {
                    Nombre = moduloData.Nombre,
                    Codigo = moduloData.Codigo,
                    Descripcion = moduloData.Descripcion,
                    Activo = true
                });
            }
        }

        await context.SaveChangesAsync();

        // =========================
        // PERMISOS
        // =========================

        var modulosDb = await context.Modulos.ToListAsync();

        foreach (var modulo in modulosDb)
        {
            if (modulo.Codigo == "DASHBOARD")
            {
                await CrearPermisoAsync(
                    context,
                    modulo,
                    "DASHBOARD_VER",
                    "Ver dashboard"
                );

                continue;
            }

            await CrearPermisoAsync(
                context,
                modulo,
                $"{modulo.Codigo}_VER",
                $"Ver {modulo.Nombre.ToLower()}"
            );

            await CrearPermisoAsync(
                context,
                modulo,
                $"{modulo.Codigo}_CREAR",
                $"Crear {modulo.Nombre.ToLower()}"
            );

            await CrearPermisoAsync(
                context,
                modulo,
                $"{modulo.Codigo}_EDITAR",
                $"Editar {modulo.Nombre.ToLower()}"
            );

            await CrearPermisoAsync(
                context,
                modulo,
                $"{modulo.Codigo}_ELIMINAR",
                $"Eliminar {modulo.Nombre.ToLower()}"
            );
        }

        await context.SaveChangesAsync();

        // =========================
        // PERMISOS DEL ADMINISTRADOR
        // =========================

        var permisos = await context.Permisos.ToListAsync();

        foreach (var permiso in permisos)
        {
            var existeRelacion = await context.RolesPermisos
                .AnyAsync(rp =>
                    rp.RolId == administrador.Id &&
                    rp.PermisoId == permiso.Id);

            if (!existeRelacion)
            {
                context.RolesPermisos.Add(new RolPermiso
                {
                    RolId = administrador.Id,
                    PermisoId = permiso.Id
                });
            }
        }

        // =========================
        // PERMISOS DEL USUARIO
        // =========================

        var permisosVer = permisos
            .Where(p => p.Codigo.EndsWith("_VER"))
            .ToList();

        foreach (var permiso in permisosVer)
        {
            var existeRelacion = await context.RolesPermisos
                .AnyAsync(rp =>
                    rp.RolId == usuario.Id &&
                    rp.PermisoId == permiso.Id);

            if (!existeRelacion)
            {
                context.RolesPermisos.Add(new RolPermiso
                {
                    RolId = usuario.Id,
                    PermisoId = permiso.Id
                });
            }
        }

        await context.SaveChangesAsync();

        // =========================
        // USUARIO ADMINISTRADOR INICIAL
        // =========================

        var administradorInicial =
            configuration
                .GetSection("AdministradorInicial");

        var rut = administradorInicial["Rut"];
        var nombres = administradorInicial["Nombres"];
        var apellidoPaterno = administradorInicial["ApellidoPaterno"];
        var apellidoMaterno = administradorInicial["ApellidoMaterno"];
        var email = administradorInicial["Email"];
        var password = administradorInicial["Password"];

        if (string.IsNullOrWhiteSpace(rut) ||
            string.IsNullOrWhiteSpace(nombres) ||
            string.IsNullOrWhiteSpace(apellidoPaterno) ||
            string.IsNullOrWhiteSpace(apellidoMaterno) ||
            string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException(
                "La configuración 'AdministradorInicial' está incompleta en appsettings.Development.json."
            );
        }

        var emailNormalizado = email.Trim().ToLower();

        var usuarioAdministrador = await context.Usuarios
            .Include(u => u.UsuariosRoles)
            .FirstOrDefaultAsync(u =>
                u.Email.ToLower() == emailNormalizado);

        if (usuarioAdministrador == null)
        {
            usuarioAdministrador = new Usuario
            {
                Rut = rut.Trim().ToUpper(),
                Nombres = nombres.Trim(),
                ApellidoPaterno = apellidoPaterno.Trim(),
                ApellidoMaterno = apellidoMaterno.Trim(),
                Email = emailNormalizado,
                PasswordHash = passwordService.HashPassword(
                    new Usuario(),
                    password
                ),
                Activo = true,
                FechaCreacion = DateTime.UtcNow,
                UltimoAcceso = null
            };

            context.Usuarios.Add(usuarioAdministrador);

            await context.SaveChangesAsync();
        }

        // =========================
        // ASIGNAR ROL ADMINISTRADOR
        // =========================

        var tieneRolAdministrador =
            await context.UsuariosRoles
                .AnyAsync(ur =>
                    ur.UsuarioId == usuarioAdministrador.Id &&
                    ur.RolId == administrador.Id);

        if (!tieneRolAdministrador)
        {
            context.UsuariosRoles.Add(new UsuarioRol
            {
                UsuarioId = usuarioAdministrador.Id,
                RolId = administrador.Id
            });

            await context.SaveChangesAsync();
        }
    }

    private static async Task CrearPermisoAsync(
        AppDbContext context,
        Modulo modulo,
        string codigo,
        string nombre)
    {
        var existe = await context.Permisos
            .AnyAsync(p => p.Codigo == codigo);

        if (!existe)
        {
            context.Permisos.Add(new Permiso
            {
                ModuloId = modulo.Id,
                Codigo = codigo,
                Nombre = nombre
            });
        }
    }
}