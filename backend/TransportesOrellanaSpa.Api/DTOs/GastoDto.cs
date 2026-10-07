namespace TransportesOrellanaSpa.Api.DTOs;

public class GastoDto
{
    public int Id { get; set; }

    public int CamionId { get; set; }

    public string PatenteCamion { get; set; } = string.Empty;

    public int? ViajeId { get; set; }

    public string? NumeroGuiaDespacho { get; set; }

    public DateTime Fecha { get; set; }

    public string TipoGasto { get; set; } = string.Empty;

    public string Descripcion { get; set; } = string.Empty;

    public decimal Monto { get; set; }

    public string? Observaciones { get; set; }
}