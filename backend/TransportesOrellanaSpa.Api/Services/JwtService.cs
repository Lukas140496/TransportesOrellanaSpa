using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using TransportesOrellanaSpa.Api.Models;

namespace TransportesOrellanaSpa.Api.Services;

public class JwtService
{
    private readonly IConfiguration _configuration;

    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerarToken(Usuario usuario)
    {
        var jwtSection = _configuration.GetSection("Jwt");

        var key = jwtSection["Key"]
            ?? throw new InvalidOperationException(
                "La configuración 'Jwt:Key' no está definida."
            );

        var issuer = jwtSection["Issuer"]
            ?? throw new InvalidOperationException(
                "La configuración 'Jwt:Issuer' no está definida."
            );

        var audience = jwtSection["Audience"]
            ?? throw new InvalidOperationException(
                "La configuración 'Jwt:Audience' no está definida."
            );

        var expirationMinutes = int.TryParse(
            jwtSection["ExpirationMinutes"],
            out var minutos
        )
            ? minutos
            : 60;

        var roles = usuario.UsuariosRoles
            .Where(ur => ur.Rol.Activo)
            .Select(ur => ur.Rol.Nombre)
            .Distinct()
            .ToList();

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new(ClaimTypes.Name, usuario.Nombre),
            new(ClaimTypes.Email, usuario.Email)
        };

        foreach (var rol in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, rol));
        }

        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(key)
        );

        var credentials = new SigningCredentials(
            securityKey,
            SecurityAlgorithms.HmacSha256
        );

        var expiration = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiration,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}