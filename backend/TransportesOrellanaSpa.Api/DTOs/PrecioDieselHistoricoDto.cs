namespace TransportesOrellanaSpa.Api.DTOs;

public class PrecioDieselHistoricoDto
{
    public int Anio { get; set; }

    public int Mes { get; set; }

    public decimal? Precio { get; set; }

    public string Region { get; set; } = "Región Metropolitana";
}
