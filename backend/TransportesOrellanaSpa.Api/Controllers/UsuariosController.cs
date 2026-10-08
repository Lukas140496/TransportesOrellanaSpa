using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.DTOs.Usuarios;
using TransportesOrellanaSpa.Api.Authorization;
using TransportesOrellanaSpa.Api.Services;

namespace TransportesOrellanaSpa.Api.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize]
public class UsuariosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly PasswordService _passwordService;

    public UsuariosController(
        AppDbContext context,
        PasswordService passwordService)
    {
        _context = context;
        _passwordService = passwordService;
    }

    // =========================
    // LISTAR USUARIOS
    // =========================

    [HttpGet]
    [RequirePermission("USUARIOS_VER")]
    public async Task<IActionResult> ObtenerUsuarios()
    {
        var usuarios = await _context.Usuarios
            .Include(u => u.UsuariosRoles)
                .ThenInclude(ur => ur.Rol)
            .OrderBy(u => u.Nombres)
            .ThenBy(u => u.ApellidoPaterno)
            .ToListAsync();

        var response = usuarios
            .Select(usuario => new UsuarioListaDto
            {
                UsuarioId = usuario.Id,
                Rut = usuario.Rut,
                Nombres = usuario.Nombres,
                ApellidoPaterno = usuario.ApellidoPaterno,
                ApellidoMaterno = usuario.ApellidoMaterno,
                NombreCompleto =
                    $"{usuario.Nombres} {usuario.ApellidoPaterno} {usuario.ApellidoMaterno}"
                        .Trim(),
                Email = usuario.Email,
                Roles = usuario.UsuariosRoles
                    .Where(ur => ur.Rol.Activo)
                    .Select(ur => ur.Rol.Nombre)
                    .Distinct()
                    .ToList(),
                FechaCreacion = usuario.FechaCreacion,
                UltimoAcceso = usuario.UltimoAcceso,
                Activo = usuario.Activo
            })
            .ToList();

        return Ok(response);
    }

    // =========================
    // EDITAR USUARIO
    // =========================

    [HttpPut("{id:int}")]
    [RequirePermission("USUARIOS_EDITAR")]
    public async Task<IActionResult> EditarUsuario(
        int id,
        EditarUsuarioDto request)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Id == id);

        if (usuario == null)
        {
            return NotFound(new
            {
                mensaje = "Usuario no encontrado."
            });
        }

        var rut = request.Rut?.Trim().ToUpperInvariant() ?? string.Empty;
        var nombres = request.Nombres?.Trim() ?? string.Empty;
        var apellidoPaterno = request.ApellidoPaterno?.Trim() ?? string.Empty;
        var apellidoMaterno = request.ApellidoMaterno?.Trim() ?? string.Empty;
        var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;

        // =========================
        // VALIDACIONES
        // =========================

        if (string.IsNullOrWhiteSpace(rut) ||
            string.IsNullOrWhiteSpace(nombres) ||
            string.IsNullOrWhiteSpace(apellidoPaterno) ||
            string.IsNullOrWhiteSpace(apellidoMaterno) ||
            string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new
            {
                mensaje = "Todos los campos son obligatorios."
            });
        }

        if (request.RolId <= 0)
        {
            return BadRequest(new
            {
                mensaje = "Debe seleccionar un rol."
            });
        }

        // =========================
        // VALIDAR EMAIL
        // =========================

        var emailExiste = await _context.Usuarios
            .AnyAsync(u =>
                u.Email == email &&
                u.Id != id);

        if (emailExiste)
        {
            return Conflict(new
            {
                mensaje = "El correo electrónico ya está registrado."
            });
        }

        // =========================
        // VALIDAR RUT
        // =========================

        var rutExiste = await _context.Usuarios
            .AnyAsync(u =>
                u.Rut == rut &&
                u.Id != id);

        if (rutExiste)
        {
            return Conflict(new
            {
                mensaje = "El RUT ya está registrado."
            });
        }

        // =========================
        // VALIDAR ROL
        // =========================

        var rol = await _context.Roles
            .FirstOrDefaultAsync(r =>
                r.Id == request.RolId &&
                r.Activo);

        if (rol == null)
        {
            return BadRequest(new
            {
                mensaje = "El rol seleccionado no existe o está inactivo."
            });
        }

        // =========================
        // ACTUALIZAR USUARIO
        // =========================

        usuario.Rut = rut;
        usuario.Nombres = nombres;
        usuario.ApellidoPaterno = apellidoPaterno;
        usuario.ApellidoMaterno = apellidoMaterno;
        usuario.Email = email;

        await _context.SaveChangesAsync();

        // =========================
        // ACTUALIZAR ROL
        // =========================

        var rolesActuales = await _context.UsuariosRoles
            .Where(ur => ur.UsuarioId == usuario.Id)
            .ToListAsync();

        _context.UsuariosRoles.RemoveRange(rolesActuales);

        _context.UsuariosRoles.Add(new Models.UsuarioRol
        {
            UsuarioId = usuario.Id,
            RolId = rol.Id
        });

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "Usuario actualizado correctamente."
        });
    }

    // =========================
    // CAMBIAR ESTADO USUARIO
    // =========================

    [HttpPut("{id:int}/estado")]
    [RequirePermission("USUARIOS_EDITAR")]
    public async Task<IActionResult> CambiarEstadoUsuario(
        int id,
        CambiarEstadoUsuarioDto request)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Id == id);

        if (usuario == null)
        {
            return NotFound(new
            {
                mensaje = "Usuario no encontrado."
            });
        }

        // =========================
        // EVITAR DESACTIVAR AL PROPIO USUARIO
        // =========================

        var usuarioIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirst("sub");

        if (usuarioIdClaim != null &&
            int.TryParse(usuarioIdClaim.Value, out var usuarioAutenticadoId) &&
            usuario.Id == usuarioAutenticadoId &&
            !request.Activo)
        {
            return BadRequest(new
            {
                mensaje = "No puedes desactivar tu propio usuario."
            });
        }

        // =========================
        // ACTUALIZAR ESTADO
        // =========================

        usuario.Activo = request.Activo;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = request.Activo
                ? "Usuario activado correctamente."
                : "Usuario desactivado correctamente."
        });
    }

    // =========================
    // CAMBIAR CONTRASEÑA USUARIO
    // =========================

    [HttpPut("{id:int}/password")]
    [RequirePermission("USUARIOS_EDITAR")]
    public async Task<IActionResult> CambiarPasswordUsuario(
        int id,
        CambiarPasswordUsuarioDto request)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Id == id);

        if (usuario == null)
        {
            return NotFound(new
            {
                mensaje = "Usuario no encontrado."
            });
        }

        var password = request.Password ?? string.Empty;

        if (string.IsNullOrWhiteSpace(password))
        {
            return BadRequest(new
            {
                mensaje = "La contraseña es obligatoria."
            });
        }

        if (password.Length < 6)
        {
            return BadRequest(new
            {
                mensaje = "La contraseña debe tener al menos 6 caracteres."
            });
        }

        usuario.PasswordHash =
            _passwordService.HashPassword(usuario, password);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "Contraseña actualizada correctamente."
        });
    }

    // =========================
    // ELIMINAR USUARIO
    // =========================

    [HttpDelete("{id:int}")]
    [RequirePermission("USUARIOS_ELIMINAR")]
    public async Task<IActionResult> EliminarUsuario(int id)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Id == id);

        if (usuario == null)
        {
            return NotFound(new
            {
                mensaje = "Usuario no encontrado."
            });
        }

        // =========================
        // EVITAR ELIMINAR AL PROPIO USUARIO
        // =========================

        var usuarioIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirst("sub");

        if (usuarioIdClaim != null &&
            int.TryParse(usuarioIdClaim.Value, out var usuarioAutenticadoId) &&
            usuario.Id == usuarioAutenticadoId)
        {
            return BadRequest(new
            {
                mensaje = "No puedes eliminar tu propio usuario."
            });
        }

        // =========================
        // ELIMINACIÓN LÓGICA
        // =========================

        usuario.Activo = false;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "Usuario eliminado correctamente."
        });
    }

    // =========================
    // OBTENER ROLES
    // =========================

    [HttpGet("roles")]
    [RequirePermission("USUARIOS_VER")]
    public async Task<IActionResult> ObtenerRoles()
    {
        var roles = await _context.Roles
            .Where(r => r.Activo)
            .OrderBy(r => r.Nombre)
            .Select(r => new
            {
                id = r.Id,
                nombre = r.Nombre
            })
            .ToListAsync();

        return Ok(roles);
    }

    // =========================
    // MI PERFIL
    // =========================

    [HttpGet("me")]
    public async Task<IActionResult> ObtenerMiPerfil()
    {
        var usuarioIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirst("sub");

        if (usuarioIdClaim == null ||
            !int.TryParse(usuarioIdClaim.Value, out var usuarioId))
        {
            return Unauthorized(new
            {
                mensaje = "No se pudo identificar al usuario autenticado."
            });
        }

        var usuario = await _context.Usuarios
            .Include(u => u.UsuariosRoles)
                .ThenInclude(ur => ur.Rol)
            .FirstOrDefaultAsync(u => u.Id == usuarioId);

        if (usuario == null)
        {
            return NotFound(new
            {
                mensaje = "Usuario no encontrado."
            });
        }

        var roles = usuario.UsuariosRoles
            .Where(ur => ur.Rol.Activo)
            .Select(ur => ur.Rol.Nombre)
            .Distinct()
            .ToList();

        var nombreCompleto =
            $"{usuario.Nombres} {usuario.ApellidoPaterno} {usuario.ApellidoMaterno}"
                .Trim();

        var response = new UsuarioPerfilResponse
        {
            UsuarioId = usuario.Id,

            Rut = usuario.Rut,

            Nombres = usuario.Nombres,
            ApellidoPaterno = usuario.ApellidoPaterno,
            ApellidoMaterno = usuario.ApellidoMaterno,

            NombreCompleto = nombreCompleto,

            Email = usuario.Email,

            Roles = roles,

            FechaCreacion = usuario.FechaCreacion,
            UltimoAcceso = usuario.UltimoAcceso,

            Activo = usuario.Activo
        };

        return Ok(response);
    }

    [HttpPut("me/password")]
    public async Task<IActionResult> CambiarMiPassword(
    CambiarMiPasswordDto request)
    {
        var usuarioIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirst("sub");

        if (usuarioIdClaim == null ||
            !int.TryParse(usuarioIdClaim.Value, out var usuarioId))
        {
            return Unauthorized(new
            {
                mensaje = "No se pudo identificar al usuario autenticado."
            });
        }

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u =>
                u.Id == usuarioId &&
                u.Activo);

        if (usuario == null)
        {
            return Unauthorized(new
            {
                mensaje = "El usuario no existe o está inactivo."
            });
        }

        var passwordActual = request.PasswordActual ?? string.Empty;
        var passwordNueva = request.PasswordNueva ?? string.Empty;
        var confirmarPasswordNueva =
            request.ConfirmarPasswordNueva ?? string.Empty;

        if (string.IsNullOrWhiteSpace(passwordActual))
        {
            return BadRequest(new
            {
                mensaje = "Debes ingresar tu contraseña actual."
            });
        }

        if (string.IsNullOrWhiteSpace(passwordNueva))
        {
            return BadRequest(new
            {
                mensaje = "Debes ingresar una nueva contraseña."
            });
        }

        if (passwordNueva.Length < 6)
        {
            return BadRequest(new
            {
                mensaje = "La nueva contraseña debe tener al menos 6 caracteres."
            });
        }

        if (passwordNueva != confirmarPasswordNueva)
        {
            return BadRequest(new
            {
                mensaje = "Las nuevas contraseñas no coinciden."
            });
        }

        var passwordCorrecta = _passwordService.VerifyPassword(
            usuario,
            passwordActual,
            usuario.PasswordHash);

        if (!passwordCorrecta)
        {
            return BadRequest(new
            {
                mensaje = "La contraseña actual es incorrecta."
            });
        }

        usuario.PasswordHash =
            _passwordService.HashPassword(usuario, passwordNueva);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "Contraseña actualizada correctamente."
        });
    }

    // =========================
    // OBTENER MIS PERMISOS
    // =========================

    [HttpGet("me/permisos")]
    public async Task<IActionResult> ObtenerMisPermisos()
    {
        var usuarioIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirst("sub");

        if (usuarioIdClaim == null ||
            !int.TryParse(usuarioIdClaim.Value, out var usuarioId))
        {
            return Unauthorized(new
            {
                mensaje = "No se pudo identificar al usuario autenticado."
            });
        }

        var usuarioExiste = await _context.Usuarios
            .AnyAsync(u =>
                u.Id == usuarioId &&
                u.Activo);

        if (!usuarioExiste)
        {
            return Unauthorized(new
            {
                mensaje = "El usuario no existe o está inactivo."
            });
        }

        var permisos = await _context.UsuariosRoles
            .Where(ur =>
                ur.UsuarioId == usuarioId &&
                ur.Rol.Activo)
            .SelectMany(ur => ur.Rol.RolesPermisos)
            .Where(rp =>
                rp.Permiso.Modulo.Activo)
            .Select(rp => rp.Permiso.Codigo)
            .Distinct()
            .OrderBy(codigo => codigo)
            .ToListAsync();

        return Ok(permisos);
    }

    // =========================
    // CREAR USUARIO
    // =========================

    [HttpPost]
    [RequirePermission("USUARIOS_CREAR")]
    public async Task<IActionResult> CrearUsuario(
        CrearUsuarioDto request)
    {
        var rut = request.Rut?.Trim().ToUpperInvariant() ?? string.Empty;
        var nombres = request.Nombres?.Trim() ?? string.Empty;
        var apellidoPaterno = request.ApellidoPaterno?.Trim() ?? string.Empty;
        var apellidoMaterno = request.ApellidoMaterno?.Trim() ?? string.Empty;
        var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        var password = request.Password ?? string.Empty;

        // =========================
        // VALIDACIONES
        // =========================

        if (string.IsNullOrWhiteSpace(rut) ||
            string.IsNullOrWhiteSpace(nombres) ||
            string.IsNullOrWhiteSpace(apellidoPaterno) ||
            string.IsNullOrWhiteSpace(apellidoMaterno) ||
            string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(password))
        {
            return BadRequest(new
            {
                mensaje = "Todos los campos son obligatorios."
            });
        }

        if (request.RolId <= 0)
        {
            return BadRequest(new
            {
                mensaje = "Debe seleccionar un rol."
            });
        }

        // =========================
        // VALIDAR EMAIL
        // =========================

        var emailExiste = await _context.Usuarios
            .AnyAsync(u => u.Email == email);

        if (emailExiste)
        {
            return Conflict(new
            {
                mensaje = "El correo electrónico ya está registrado."
            });
        }

        // =========================
        // VALIDAR RUT
        // =========================

        var rutExiste = await _context.Usuarios
            .AnyAsync(u => u.Rut == rut);

        if (rutExiste)
        {
            return Conflict(new
            {
                mensaje = "El RUT ya está registrado."
            });
        }

        // =========================
        // VALIDAR ROL
        // =========================

        var rol = await _context.Roles
            .FirstOrDefaultAsync(r =>
                r.Id == request.RolId &&
                r.Activo);

        if (rol == null)
        {
            return BadRequest(new
            {
                mensaje = "El rol seleccionado no existe o está inactivo."
            });
        }

        // =========================
        // CREAR USUARIO
        // =========================

        var usuario = new Models.Usuario
        {
            Rut = rut,
            Nombres = nombres,
            ApellidoPaterno = apellidoPaterno,
            ApellidoMaterno = apellidoMaterno,
            Email = email,
            PasswordHash = _passwordService.HashPassword(
                new Models.Usuario(),
                password),
            Activo = true,
            FechaCreacion = DateTime.UtcNow,
            UltimoAcceso = null
        };

        _context.Usuarios.Add(usuario);

        await _context.SaveChangesAsync();

        // =========================
        // ASIGNAR ROL
        // =========================

        var usuarioRol = new Models.UsuarioRol
        {
            UsuarioId = usuario.Id,
            RolId = rol.Id
        };

        _context.UsuariosRoles.Add(usuarioRol);

        await _context.SaveChangesAsync();

        return StatusCode(201, new
        {
            mensaje = "Usuario creado correctamente.",
            usuarioId = usuario.Id
        });
    }

    // =========================
    // ACTUALIZAR MI PERFIL
    // =========================

    [HttpPut("me")]
    public async Task<IActionResult> ActualizarMiPerfil(
        ActualizarMiPerfilRequest request)
    {
        var usuarioIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirst("sub");

        if (usuarioIdClaim == null ||
            !int.TryParse(usuarioIdClaim.Value, out var usuarioId))
        {
            return Unauthorized(new
            {
                mensaje = "No se pudo identificar al usuario autenticado."
            });
        }

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Id == usuarioId);

        if (usuario == null)
        {
            return NotFound(new
            {
                mensaje = "Usuario no encontrado."
            });
        }

        var nombres = request.Nombres?.Trim() ?? string.Empty;
        var apellidoPaterno = request.ApellidoPaterno?.Trim() ?? string.Empty;
        var apellidoMaterno = request.ApellidoMaterno?.Trim() ?? string.Empty;
        var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(nombres) ||
            string.IsNullOrWhiteSpace(apellidoPaterno) ||
            string.IsNullOrWhiteSpace(apellidoMaterno) ||
            string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new
            {
                mensaje = "Todos los campos son obligatorios."
            });
        }

        var emailExiste = await _context.Usuarios
            .AnyAsync(u =>
                u.Email == email &&
                u.Id != usuarioId);

        if (emailExiste)
        {
            return Conflict(new
            {
                mensaje = "El correo electrónico ya está registrado."
            });
        }

        usuario.Nombres = nombres;
        usuario.ApellidoPaterno = apellidoPaterno;
        usuario.ApellidoMaterno = apellidoMaterno;
        usuario.Email = email;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "Perfil actualizado correctamente."
        });
    }
}