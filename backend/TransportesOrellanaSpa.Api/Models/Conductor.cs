namespace TransportesOrellanaSpa.Api.Models;

public class Conductor
{
    public int Id { get; set; }

    public string Rut { get; set; } = string.Empty;
    public string Nombres { get; set; } = string.Empty;
    public string ApellidoPaterno { get; set; } = string.Empty;
    public string ApellidoMaterno { get; set; } = string.Empty;

    public DateTime FechaNacimiento { get; set; }
    public int Edad { get; set; }

    public DateTime FechaIngreso { get; set; }

    public string Telefono { get; set; } = string.Empty;
    public string TipoLicencia { get; set; } = string.Empty;
    public DateTime FechaControlLicencia { get; set; }
    public bool LicenciaAlDia { get; set; }
    public bool Activo { get; set; } = true;

    // NUEVO: Colección plural limpia que ya tenías (Conectará con ConductoresHabituales)
    public virtual ICollection<Camion> CamionesHabituales { get; set; } = new List<Camion>();

    // Viajes realmente realizados.
    public ICollection<Viaje> Viajes { get; set; } = new List<Viaje>();
}
