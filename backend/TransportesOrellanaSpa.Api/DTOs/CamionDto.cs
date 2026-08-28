namespace TransportesOrellanaSpa.Api.DTOs;

public class CamionDto
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

    // CAMBIADO: Lista completa de conductores habituales asignados
    public List<ConductorResumenDto> ConductoresHabituales { get; set; } = new List<ConductorResumenDto>();
    public ICollection<RemolqueResumenDto> Remolques { get; set; } = new List<RemolqueResumenDto>();
}
