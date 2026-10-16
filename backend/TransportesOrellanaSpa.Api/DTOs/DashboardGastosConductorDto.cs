
namespace TransportesOrellanaSpa.Api.DTOs;

public class DashboardGastosConductorDto
{
    public int ConductorId { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public decimal Monto { get; set; }
}
