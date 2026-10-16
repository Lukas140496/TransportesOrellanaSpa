namespace TransportesOrellanaSpa.Api.Models;

public class GastoConductor
{
    public int Id { get; set; }

    public int ConductorId { get; set; }

    public virtual Conductor Conductor { get; set; } = null!;

    public DateTime Fecha { get; set; }

    public string TipoGasto { get; set; } = string.Empty;

    public string Descripcion { get; set; } = string.Empty;

    public decimal Monto { get; set; }

    public string? Observaciones { get; set; }
}