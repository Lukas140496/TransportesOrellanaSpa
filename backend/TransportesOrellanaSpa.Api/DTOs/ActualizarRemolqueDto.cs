namespace TransportesOrellanaSpa.Api.DTOs;

public class ActualizarRemolqueDto
{
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;

    public int Ano { get; set; }

    public string Tipo { get; set; } = string.Empty;

    public double CapacidadToneladas { get; set; }

    public bool Activa { get; set; }

    public int? CamionHabitualId { get; set; }
}