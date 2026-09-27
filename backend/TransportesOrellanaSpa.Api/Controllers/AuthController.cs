using Microsoft.AspNetCore.Mvc;
using TransportesOrellanaSpa.Api.DTOs.Auth;
using TransportesOrellanaSpa.Api.Services;

namespace TransportesOrellanaSpa.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AutenticacionService _autenticacionService;
    private readonly JwtService _jwtService;
    private readonly IConfiguration _configuration;

    public AuthController(
        AutenticacionService autenticacionService,
        JwtService jwtService,
        IConfiguration configuration)
    {
        _autenticacionService = autenticacionService;
        _jwtService = jwtService;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var usuario = await _autenticacionService.AutenticarAsync(
            request.Email,
            request.Password
        );

        if (usuario == null)
        {
            return Unauthorized(new
            {
                mensaje = "Correo o contraseña incorrectos."
            });
        }

        var token = _jwtService.GenerarToken(usuario);

        var expirationMinutes = int.TryParse(
            _configuration["Jwt:ExpirationMinutes"],
            out var minutos
        )
            ? minutos
            : 60;

        var expiraEn = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var roles = usuario.UsuariosRoles
            .Where(ur => ur.Rol.Activo)
            .Select(ur => ur.Rol.Nombre)
            .Distinct()
            .ToList();

        var response = new LoginResponse
        {
            Token = token,
            ExpiraEn = expiraEn,
            UsuarioId = usuario.Id,
            Nombre = usuario.Nombre,
            Email = usuario.Email,
            Roles = roles
        };

        return Ok(response);
    }
}