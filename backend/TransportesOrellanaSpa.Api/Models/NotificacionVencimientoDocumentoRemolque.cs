namespace TransportesOrellanaSpa.Api.Models;

public class NotificacionVencimientoDocumentoRemolque
{
    public int Id { get; set; }

    public int RemolqueId { get; set; }

    public Remolque Remolque { get; set; } = null!;

    public string TipoDocumento { get; set; } = string.Empty;

    public DateTime FechaVencimiento { get; set; }

    public int DiasAnticipacion { get; set; }

    public DateTime FechaCreacionUtc { get; set; }
}