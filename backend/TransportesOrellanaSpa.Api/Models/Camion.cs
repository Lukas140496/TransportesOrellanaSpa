namespace TransportesOrellanaSpa.Api.Models;

public class Camion
{
    public int Id { get; set; }

    public string Patente { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public int Ano { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string Capacidad { get; set; } = string.Empty;
    public string Motor { get; set; } = string.Empty;
    public string Caballos { get; set; } = string.Empty;
    public string Cilindrada { get; set; } = string.Empty;
    public string Transmision { get; set; } = string.Empty;

    public DateTime FechaRevisionTecnica { get; set; }
    public DateTime FechaPermisoCirculacion { get; set; }
    public DateTime FechaSeguroObligatorio { get; set; }

    public bool RevisionAlDia { get; set; }
    public bool PermisoAlDia { get; set; }
    public bool SeguroAlDia { get; set; }

    // NUEVO: Colección de conductores habituales (Muchos a Muchos)
    public virtual ICollection<Conductor> ConductoresHabituales { get; set; } = new List<Conductor>();

    // Remolques que tienen este camión como tractocamión habitual.
    public ICollection<Remolque> Remolques { get; set; } = new List<Remolque>();

    // Viajes realizados por este camión.
    public ICollection<Viaje> Viajes { get; set; } = new List<Viaje>();
}
