namespace TransportesOrellanaSpa.Api.DTOs;

public class DashboardKilometrosConductorDto
{
    public int ConductorId { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public int Viajes { get; set; }

    public decimal Kilometros { get; set; }
}