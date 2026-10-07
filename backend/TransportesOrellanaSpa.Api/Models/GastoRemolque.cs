namespace TransportesOrellanaSpa.Api.Models;

public class GastoRemolque
{
    public int Id { get; set; }

    public int RemolqueId { get; set; }

    public virtual Remolque Remolque { get; set; } = null!;

    public DateTime Fecha { get; set; }

    public string TipoGasto { get; set; } = string.Empty;

    public string Descripcion { get; set; } = string.Empty;

    public decimal Monto { get; set; }

    public string? Observaciones { get; set; }
}