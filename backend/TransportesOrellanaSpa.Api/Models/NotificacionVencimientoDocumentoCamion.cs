namespace TransportesOrellanaSpa.Api.Models;

public class NotificacionVencimientoDocumentoCamion
{
    public int Id { get; set; }

    public int CamionId { get; set; }

    public Camion Camion { get; set; } = null!;

    public string TipoDocumento { get; set; } = string.Empty;

    public DateTime FechaVencimiento { get; set; }

    public DateTime FechaCreacionUtc { get; set; }

    public int DiasAnticipacion { get; set; }
}