namespace TransportesOrellanaSpa.Api.DTOs;

public class DashboardKilometrosCamionDto
{
    public int CamionId { get; set; }

    public string Patente { get; set; } = string.Empty;

    public int Viajes { get; set; }

    public double Kilometros { get; set; }
}