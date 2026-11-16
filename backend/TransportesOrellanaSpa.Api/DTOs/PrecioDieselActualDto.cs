
namespace TransportesOrellanaSpa.Api.DTOs;

public class PrecioDieselActualDto
{
    public decimal? Precio { get; set; }

    public DateTime? ActualizadoEn { get; set; }

    public string Region { get; set; } = "Región Metropolitana";
}
