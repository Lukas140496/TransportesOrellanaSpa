namespace TransportesOrellanaSpa.Api.DTOs;

public class CamionResumenDto
{
    public int Id { get; set; }

    public string Patente { get; set; } = string.Empty;

    public string Marca { get; set; } = string.Empty;

    public string Modelo { get; set; } = string.Empty;
}