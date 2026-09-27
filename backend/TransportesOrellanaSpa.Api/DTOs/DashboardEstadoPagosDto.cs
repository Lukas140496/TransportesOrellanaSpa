namespace TransportesOrellanaSpa.Api.DTOs;

public class DashboardEstadoPagosDto
{
    public int ViajesPagados { get; set; }
    public decimal MontoPagado { get; set; }
    public int ViajesPendientesPago { get; set; }
    public decimal MontoPendientePago { get; set; }
}