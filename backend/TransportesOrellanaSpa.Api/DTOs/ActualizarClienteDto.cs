namespace TransportesOrellanaSpa.Api.DTOs;

public class ActualizarClienteDto
{
    public string Nombre { get; set; } = string.Empty;

    public string Rut { get; set; } = string.Empty;

    public string Ubicacion { get; set; } = string.Empty;

    public decimal Tarifa { get; set; }

    public string TipoCarga { get; set; } = string.Empty;

    public bool Activo { get; set; }

    public string Observaciones { get; set; } = string.Empty;
}