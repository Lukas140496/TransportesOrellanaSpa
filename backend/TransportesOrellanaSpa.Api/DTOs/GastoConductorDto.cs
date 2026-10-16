namespace TransportesOrellanaSpa.Api.DTOs;

public class GastoConductorDto
{
    public int Id { get; set; }

    public int ConductorId { get; set; }

    public string NombreConductor { get; set; } = string.Empty;

    public DateTime Fecha { get; set; }

    public string TipoGasto { get; set; } = string.Empty;

    public string Descripcion { get; set; } = string.Empty;

    public decimal Monto { get; set; }

    public string? Observaciones { get; set; }
}