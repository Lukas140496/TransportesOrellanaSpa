using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.DTOs.Usuarios;

namespace TransportesOrellanaSpa.Api.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize]
public class UsuariosController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsuariosController(AppDbContext context)
    {
        _context = context;
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