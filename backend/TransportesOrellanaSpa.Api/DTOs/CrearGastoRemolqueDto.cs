namespace TransportesOrellanaSpa.Api.DTOs;

public class CrearGastoRemolqueDto
{
    public int RemolqueId { get; set; }

    public DateTime Fecha { get; set; }

    public string TipoGasto { get; set; } = string.Empty;

    public string Descripcion { get; set; } = string.Empty;

    public decimal Monto { get; set; }

    public string? Observaciones { get; set; }
}