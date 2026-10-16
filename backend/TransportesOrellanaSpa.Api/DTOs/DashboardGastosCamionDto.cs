
namespace TransportesOrellanaSpa.Api.DTOs;

public class DashboardGastosCamionDto
{
    public int CamionId { get; set; }

    public string Patente { get; set; } = string.Empty;

    public decimal Monto { get; set; }
}
