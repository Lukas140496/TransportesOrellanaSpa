namespace TransportesOrellanaSpa.Api.Models;

public class Remolque
{
    public int Id { get; set; }

    public string Patente { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;

    public int Ano { get; set; }

    public string Tipo { get; set; } = string.Empty;

    public double CapacidadToneladas { get; set; }

    public bool Activa { get; set; } = true;

    // Tractocamión habitual del Remolque.
    public int? CamionHabitualId { get; set; }
    public Camion? CamionHabitual { get; set; }

    public ICollection<Viaje> Viajes { get; set; } = new List<Viaje>();
}