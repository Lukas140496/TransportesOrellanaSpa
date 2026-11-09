namespace TransportesOrellanaSpa.Api.Models;

public class NotificacionVencimientoDocumentoConductor
{
    public int Id { get; set; }

    public int ConductorId { get; set; }

    public Conductor Conductor { get; set; } = null!;

    public string TipoDocumento { get; set; } = string.Empty;

    public DateTime FechaVencimiento { get; set; }

    public int DiasAnticipacion { get; set; }

    public DateTime FechaCreacionUtc { get; set; }
}