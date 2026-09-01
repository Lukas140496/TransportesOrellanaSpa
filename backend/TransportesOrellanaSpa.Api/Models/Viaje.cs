using TransportesOrellanaSpa.Api.Enums;

namespace TransportesOrellanaSpa.Api.Models;

public class Viaje
{
    public int Id { get; set; }

    public string NumeroGuiaDespacho { get; set; } = string.Empty;

    public DateTime Fecha { get; set; }

    // =========================
    // CLIENTE
    // =========================

    public int ClienteId { get; set; }
    public Cliente Cliente { get; set; } = null!;

    // =========================
    // CAMIÓN
    // =========================

    public int CamionId { get; set; }
    public Camion Camion { get; set; } = null!;

    // =========================
    // CONDUCTOR
    // =========================

    public int ConductorId { get; set; }
    public Conductor Conductor { get; set; } = null!;

    // =========================
    // REMOLQUE
    // =========================

    public int RemolqueId { get; set; }
    public Remolque Remolque { get; set; } = null!;

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

    public DateTime? FechaPago { get; set; }

    public EstadoViaje Estado { get; set; } = EstadoViaje.Pendiente;

    public EstadoPago EstadoPago { get; set; } = EstadoPago.Pendiente;
}