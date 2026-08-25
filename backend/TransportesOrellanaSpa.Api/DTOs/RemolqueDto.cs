namespace TransportesOrellanaSpa.Api.DTOs;

public class RemolqueDto
{
    public int Id { get; set; }

    public string Patente { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;

    public int Ano { get; set; }

    public string Tipo { get; set; } = string.Empty;

    public double CapacidadToneladas { get; set; }

    public bool Activa { get; set; }

    public int? CamionHabitualId { get; set; }
    
    public CamionResumenDto? CamionHabitual { get; set; }
}