namespace TransportesOrellanaSpa.Api.Models;

public class Gasto
{
    public int Id { get; set; }

    public int CamionId { get; set; }

    public virtual Camion Camion { get; set; } = null!;

    public int? ViajeId { get; set; }

    public virtual Viaje? Viaje { get; set; }

    public DateTime Fecha { get; set; }

    public string TipoGasto { get; set; } = string.Empty;

    public string Descripcion { get; set; } = string.Empty;

    public decimal Monto { get; set; }

    public string? Observaciones { get; set; }
}