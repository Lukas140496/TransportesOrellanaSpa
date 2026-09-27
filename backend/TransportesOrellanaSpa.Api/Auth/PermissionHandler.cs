using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Data;

namespace TransportesOrellanaSpa.Api.Authorization;

public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly AppDbContext _context;

    public PermissionHandler(AppDbContext context)
    {
        _context = context;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var usuarioIdClaim =
            context.User.FindFirst(ClaimTypes.NameIdentifier)
            ?? context.User.FindFirst(JwtRegisteredClaimNames.Sub)
            ?? context.User.FindFirst("sub");

        if (usuarioIdClaim == null ||
            !int.TryParse(usuarioIdClaim.Value, out var usuarioId))
        {
            return;
        }

        var tienePermiso = await _context.UsuariosRoles
            .Where(ur => ur.UsuarioId == usuarioId)
            .Where(ur => ur.Rol.Activo)
            .SelectMany(ur => ur.Rol.RolesPermisos)
            .AnyAsync(rp =>
                rp.Permiso.Codigo == requirement.Permission &&
                rp.Permiso.Modulo.Activo);

        if (tienePermiso)
        {
            context.Succeed(requirement);
        }
    }
}