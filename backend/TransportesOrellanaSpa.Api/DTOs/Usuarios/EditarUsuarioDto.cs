namespace TransportesOrellanaSpa.Api.DTOs.Usuarios;

public class EditarUsuarioDto
{
    public string Rut { get; set; } = string.Empty;
    public string Nombres { get; set; } = string.Empty;
    public string ApellidoPaterno { get; set; } = string.Empty;
    public string ApellidoMaterno { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int RolId { get; set; }
}