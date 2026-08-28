namespace TransportesOrellanaSpa.Api.DTOs;

public class ConductorDto
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

    // Lista de camiones asignados
    public List<CamionResumenDto> CamionesHabituales { get; set; } = new();
}
