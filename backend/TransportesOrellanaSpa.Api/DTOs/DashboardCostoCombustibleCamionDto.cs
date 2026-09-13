namespace TransportesOrellanaSpa.Api.DTOs;

public class DashboardCostoCombustibleCamionDto
{
    public int CamionId { get; set; }

    public string Patente { get; set; } = string.Empty;

    public int Viajes { get; set; }

    public decimal LitrosCombustible { get; set; }

    public decimal CostoCombustible { get; set; }
}