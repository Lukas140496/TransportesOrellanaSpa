using Microsoft.AspNetCore.Identity;
using TransportesOrellanaSpa.Api.Models;

namespace TransportesOrellanaSpa.Api.Services;

public class PasswordService
{
    private readonly PasswordHasher<Usuario> _passwordHasher;

    public PasswordService()
    {
        _passwordHasher = new PasswordHasher<Usuario>();
    }

    public string HashPassword(Usuario usuario, string password)
    {
        return _passwordHasher.HashPassword(usuario, password);
    }

    public bool VerifyPassword(
        Usuario usuario,
        string password,
        string passwordHash)
    {
        var resultado = _passwordHasher.VerifyHashedPassword(
            usuario,
            passwordHash,
            password
        );

        return resultado == PasswordVerificationResult.Success ||
               resultado == PasswordVerificationResult.SuccessRehashNeeded;
    }
}