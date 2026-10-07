namespace TransportesOrellanaSpa.Api.DTOs;

public class GastoRemolqueDto
{
    public int Id { get; set; }

    public int RemolqueId { get; set; }

    public string PatenteRemolque { get; set; } = string.Empty;

    public DateTime Fecha { get; set; }

    public string TipoGasto { get; set; } = string.Empty;

    public string Descripcion { get; set; } = string.Empty;

    public decimal Monto { get; set; }

    public string? Observaciones { get; set; }
}