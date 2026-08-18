namespace TransportesOrellanaSpa.Api.Models;

public class Viaje
{
    public int Id { get; set; }

    public DateTime Fecha { get; set; }

    // Cliente
    public int ClienteId { get; set; }
    public Cliente Cliente { get; set; } = null!;

    // Camión
    public int CamionId { get; set; }
    public Camion Camion { get; set; } = null!;

    // Conductor que REALMENTE realizó el viaje.
    public int ConductorId { get; set; }
    public Conductor Conductor { get; set; } = null!;

    // Remolque utilizado.
    public int? RemolqueId { get; set; }
    public Remolque? Remolque { get; set; }

    // Operación
    public string Origen { get; set; } = string.Empty;
    public string Destino { get; set; } = string.Empty;

    public string ComunaOrigen { get; set; } = string.Empty;
    public string ComunaDestino { get; set; } = string.Empty;

    public string TipoCarga { get; set; } = string.Empty;

    // Kilometraje
    public double? Kilometros { get; set; }

    // Información económica del viaje.
    public decimal Tarifa { get; set; }

    public string Observaciones { get; set; } = string.Empty;
}