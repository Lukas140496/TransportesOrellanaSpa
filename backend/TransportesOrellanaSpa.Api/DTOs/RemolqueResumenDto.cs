namespace TransportesOrellanaSpa.Api.DTOs;

public class RemolqueResumenDto
{
    public int Id { get; set; }

    public string Patente { get; set; } = string.Empty;

    public string Marca { get; set; } = string.Empty;

    public string Modelo { get; set; } = string.Empty;

    public string Tipo { get; set; } = string.Empty;

    public double CapacidadToneladas { get; set; }

    public bool Activa { get; set; }
}