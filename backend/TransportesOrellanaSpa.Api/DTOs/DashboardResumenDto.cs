namespace TransportesOrellanaSpa.Api.DTOs;

public class DashboardResumenDto
{
    public int Camiones { get; set; }

    public int Conductores { get; set; }

    public int Remolques { get; set; }

    public int Clientes { get; set; }

    public int ViajesMes { get; set; }

    public decimal ProduccionMes { get; set; }

    public decimal LitrosCombustibleMes { get; set; }

    public decimal CostoCombustibleMes { get; set; }

    public double KilometrosMes { get; set; }
}