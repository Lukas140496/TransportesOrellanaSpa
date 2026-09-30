namespace TransportesOrellanaSpa.Api.Models;

public class Usuario
{
    public int Id { get; set; }

    public string Rut { get; set; } = string.Empty;

    public string Nombres { get; set; } = string.Empty;

    public string ApellidoPaterno { get; set; } = string.Empty;

    public string ApellidoMaterno { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public bool Activo { get; set; } = true;

    public DateTime FechaCreacion { get; set; }

    public DateTime? UltimoAcceso { get; set; }

    public ICollection<UsuarioRol> UsuariosRoles { get; set; }
        = new List<UsuarioRol>();
}