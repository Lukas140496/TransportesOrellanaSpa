namespace TransportesOrellanaSpa.Api.DTOs;

public class DashboardProduccionClienteDto
{
    public int ClienteId { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string Rut { get; set; } = string.Empty;

    public int Viajes { get; set; }

    public decimal Produccion { get; set; }
}