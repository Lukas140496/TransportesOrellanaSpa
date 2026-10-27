
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TransportesOrellanaSpa.Api.Authorization;
using TransportesOrellanaSpa.Api.DTOs;
using TransportesOrellanaSpa.Api.Services;

namespace TransportesOrellanaSpa.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class PrecioDieselController : ControllerBase
{
    private readonly PrecioDieselHistoricoService _servicio;

    public PrecioDieselController(
        PrecioDieselHistoricoService servicio)
    {
        _servicio = servicio;
    }

    [HttpGet("precio-historico")]
    [RequirePermission("VIAJES_VER")]
    public ActionResult<PrecioDieselHistoricoDto> ObtenerPrecioHistorico(
        [FromQuery] DateTime fecha)
    {
        if (fecha == default)
        {
            return BadRequest(
                "Debes indicar una fecha válida para consultar el precio histórico."
            );
        }

        var resultado = _servicio.ObtenerPorFecha(fecha);

        return Ok(resultado);
    }
}
