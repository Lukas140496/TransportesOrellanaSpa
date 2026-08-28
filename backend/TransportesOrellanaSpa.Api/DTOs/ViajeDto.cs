using TransportesOrellanaSpa.Api.Enums;

namespace TransportesOrellanaSpa.Api.DTOs;

public class ViajeDto
{
    public int Id { get; set; }

    public DateTime Fecha { get; set; }

    // =========================
    // RESUMEN CLIENTE
    // =========================

    public ClienteResumenDto Cliente { get; set; } = null!;

    // =========================
    // RESUMEN CAMIÓN
    // =========================

    public CamionResumenDto Camion { get; set; } = null!;

    // =========================
    // RESUMEN CONDUCTOR
    // =========================

    public ConductorResumenDto Conductor { get; set; } = null!;

    // =========================
    // RESUMEN REMOLQUE
    // =========================

    public RemolqueResumenDto Remolque { get; set; } = null!;

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

    // =========================
    // ESTADOS
    // =========================

    public EstadoViaje Estado { get; set; }

    public EstadoPago EstadoPago { get; set; }

    public DateTime? FechaPago { get; set; }
}