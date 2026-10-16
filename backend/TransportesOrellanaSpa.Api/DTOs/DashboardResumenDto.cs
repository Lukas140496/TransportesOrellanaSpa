namespace TransportesOrellanaSpa.Api.DTOs;

public class DashboardResumenDto
{
    public int Camiones { get; set; }

    public int Conductores { get; set; }

    public int Remolques { get; set; }

    public int Clientes { get; set; }

    public int ViajesMes { get; set; }

    public decimal ProduccionMes { get; set; }

    public decimal GananciaNetaMes { get; set; }

    public decimal TotalGastosMes { get; set; }

    public decimal GastosCamionesMes { get; set; }

    public decimal GastosRemolquesMes { get; set; }

    public decimal GastosConductoresMes { get; set; }

    public decimal LitrosCombustibleMes { get; set; }

    public decimal CostoCombustibleMes { get; set; }

    public double KilometrosMes { get; set; }

    // ===================================
    // DOCUMENTACIÓN DE LA FLOTA
    // ===================================

    public int CamionesRevisionVencida { get; set; }

    public int CamionesPermisoVencido { get; set; }

    public int CamionesSeguroVencido { get; set; }

    public int CamionesDocumentacionVencida { get; set; }
}