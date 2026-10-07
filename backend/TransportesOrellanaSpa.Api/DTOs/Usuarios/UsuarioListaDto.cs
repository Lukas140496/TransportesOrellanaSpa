namespace TransportesOrellanaSpa.Api.DTOs.Usuarios;

public class UsuarioListaDto
{
    public int UsuarioId { get; set; }
    public string Rut { get; set; } = string.Empty;
    public string Nombres { get; set; } = string.Empty;
    public string ApellidoPaterno { get; set; } = string.Empty;
    public string ApellidoMaterno { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public DateTime FechaCreacion { get; set; }
    public DateTime? UltimoAcceso { get; set; }
    public bool Activo { get; set; }
}