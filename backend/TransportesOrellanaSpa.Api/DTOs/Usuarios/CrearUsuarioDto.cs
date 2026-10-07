namespace TransportesOrellanaSpa.Api.DTOs.Usuarios;

public class CrearUsuarioDto
{
    public string Rut { get; set; } = string.Empty;

    public string Nombres { get; set; } = string.Empty;

    public string ApellidoPaterno { get; set; } = string.Empty;

    public string ApellidoMaterno { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public int RolId { get; set; }
}