
namespace TransportesOrellanaSpa.Api.DTOs;

public class DashboardGastosRemolqueDto
{
    public int RemolqueId { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public decimal Monto { get; set; }
}
