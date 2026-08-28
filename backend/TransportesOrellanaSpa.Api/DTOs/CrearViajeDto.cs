namespace TransportesOrellanaSpa.Api.DTOs;

public class CrearViajeDto
{
    public DateTime Fecha { get; set; }

    // =========================
    // RELACIONES
    // =========================

    public int ClienteId { get; set; }

    public int CamionId { get; set; }

    public int ConductorId { get; set; }

    public int RemolqueId { get; set; }

    // =========================
    // DATOS DEL VIAJE
    // =========================

    public string Origen { get; set; } = string.Empty;

    public string Destino { get; set; } = string.Empty;

    public string ComunaOrigen { get; set; } = string.Empty;

    public string ComunaDestino { get; set; } = string.Empty;

    public string TipoCarga { get; set; } = string.Empty;

    public double? Kilometros { get; set; }

    public decimal Tarifa { get; set; }

    public string Observaciones { get; set; } = string.Empty;
}