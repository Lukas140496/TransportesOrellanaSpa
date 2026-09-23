namespace TransportesOrellanaSpa.Api.DTOs;

public class DashboardProduccionCamionDto
{
    public int CamionId { get; set; }

    public string Patente { get; set; } = string.Empty;

    public int Viajes { get; set; }

    public decimal Produccion { get; set; }

    public decimal LitrosCombustible { get; set; }

    public decimal CostoCombustible { get; set; }

    public double Kilometros { get; set; }
}