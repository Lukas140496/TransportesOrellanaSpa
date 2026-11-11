
namespace TransportesOrellanaSpa.Api.Models;

public class EnvioNotificacion
{
    public int Id { get; set; }

    // Identificación del evento
    public string TipoEntidad { get; set; } = string.Empty;
    public int EntidadId { get; set; }
    public string TipoDocumento { get; set; } = string.Empty;
    public DateTime FechaVencimiento { get; set; }
    public int DiasAnticipacion { get; set; }

    // Destinatario individual
    public string Destinatario { get; set; } = string.Empty;

    // Control del envío
    public string Estado { get; set; } = "Pendiente";
    public int Intentos { get; set; }

    // Fechas de seguimiento
    public DateTime FechaCreacionUtc { get; set; }
    public DateTime? FechaUltimoIntentoUtc { get; set; }
    public DateTime? FechaProximoIntentoUtc { get; set; }
    public DateTime? FechaEnvioUtc { get; set; }

    // Información del último error
    public string? UltimoError { get; set; }

    public const string Pendiente = "Pendiente";
    public const string EnProceso = "EnProceso";
    public const string Enviado = "Enviado";
    public const string Fallido = "Fallido";
    public const string Cancelado = "Cancelado";
}
