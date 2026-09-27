using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.Models;

namespace TransportesOrellanaSpa.Api.Services;

public class AutenticacionService
{
    private readonly AppDbContext _context;
    private readonly PasswordService _passwordService;

    public AutenticacionService(
        AppDbContext context,
        PasswordService passwordService)
    {
        _context = context;
        _passwordService = passwordService;
    }

    public async Task<Usuario?> AutenticarAsync(
        string email,
        string password)
    {
        if (string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(password))
        {
            return null;
        }

        var emailNormalizado = email.Trim().ToLower();

        var usuario = await _context.Usuarios
            .Include(u => u.UsuariosRoles)
                .ThenInclude(ur => ur.Rol)
            .FirstOrDefaultAsync(u =>
                u.Email.ToLower() == emailNormalizado);

        if (usuario == null)
        {
            return null;
        }

        if (!usuario.Activo)
        {
            return null;
        }

        var passwordValida = _passwordService.VerifyPassword(
            usuario,
            password,
            usuario.PasswordHash
        );

        if (!passwordValida)
        {
            return null;
        }

        usuario.UltimoAcceso = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return usuario;
    }
}