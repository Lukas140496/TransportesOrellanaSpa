namespace TransportesOrellanaSpa.Api.DTOs;

public class ActualizarClienteDto
{
    public string Nombre { get; set; } = string.Empty;

    public string Rut { get; set; } = string.Empty;

    public string Direccion { get; set; } = string.Empty;

    public string Comuna { get; set; } = string.Empty;

    public string Ciudad { get; set; } = string.Empty;

    public decimal Tarifa { get; set; }

    public string TipoCarga { get; set; } = string.Empty;

    public bool Activo { get; set; }

    public string Observaciones { get; set; } = string.Empty;
}