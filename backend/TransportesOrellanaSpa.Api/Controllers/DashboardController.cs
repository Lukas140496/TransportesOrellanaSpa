using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.DTOs;

namespace TransportesOrellanaSpa.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // OBTENER RANGO DEL PERÍODO
    // =========================================================

    private (DateTime Inicio, DateTime Fin) ObtenerRangoPeriodo(
        int? year,
        int? month)
    {
        var ahoraUtc = DateTime.UtcNow;

        var anio = year ?? ahoraUtc.Year;
        var mes = month ?? ahoraUtc.Month;

        if (mes < 1 || mes > 12)
        {
            throw new ArgumentException(
                "El mes debe estar entre 1 y 12."
            );
        }

        var inicio = new DateTime(
            anio,
            mes,
            1,
            0,
            0,
            0,
            DateTimeKind.Utc
        );

        var fin = inicio.AddMonths(1);

        return (inicio, fin);
    }


    // =========================================================
    // GET: api/dashboard/resumen
    // =========================================================

    [HttpGet("resumen")]
    public async Task<ActionResult<DashboardResumenDto>> ObtenerResumen(
        [FromQuery] int? year,
        [FromQuery] int? month)
    {
        try
        {
            var (inicioMes, inicioMesSiguiente) =
                ObtenerRangoPeriodo(year, month);

            // ===================================
            // INDICADORES GENERALES
            // ===================================

            var camiones = await _context.Camiones
                .CountAsync();

            var conductores = await _context.Conductores
                .CountAsync();

            var remolques = await _context.Remolques
                .CountAsync();

            var clientes = await _context.Clientes
                .CountAsync();

            // ===================================
            // VIAJES DEL PERÍODO
            // ===================================

            var viajesMes = _context.Viajes
                .Where(v =>
                    v.Fecha >= inicioMes &&
                    v.Fecha < inicioMesSiguiente
                );

            var resumen = new DashboardResumenDto
            {
                Camiones = camiones,
                Conductores = conductores,
                Remolques = remolques,
                Clientes = clientes,

                ViajesMes = await viajesMes.CountAsync(),

                ProduccionMes = await viajesMes
                    .SumAsync(v => v.Tarifa),

                LitrosCombustibleMes = await viajesMes
                    .SumAsync(v => v.LitrosCombustible),

                CostoCombustibleMes = await viajesMes
                    .SumAsync(v => v.CostoCombustible),

                KilometrosMes = await viajesMes
                    .SumAsync(v => v.Kilometros ?? 0)
            };

            return Ok(resumen);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }


    // =========================================================
    // GET: api/dashboard/produccion-por-camion
    // =========================================================

    [HttpGet("produccion-por-camion")]
    public async Task<ActionResult<IEnumerable<DashboardProduccionCamionDto>>>
        ObtenerProduccionPorCamion(
            [FromQuery] int? year,
            [FromQuery] int? month)
    {
        try
        {
            var (inicioMes, inicioMesSiguiente) =
                ObtenerRangoPeriodo(year, month);

            var produccion = await _context.Viajes
                .Where(v =>
                    v.Fecha >= inicioMes &&
                    v.Fecha < inicioMesSiguiente
                )
                .GroupBy(v => new
                {
                    v.CamionId,
                    v.Camion.Patente
                })
                .Select(grupo => new DashboardProduccionCamionDto
                {
                    CamionId = grupo.Key.CamionId,
                    Patente = grupo.Key.Patente,

                    Viajes = grupo.Count(),

                    Produccion = grupo.Sum(
                        v => v.Tarifa
                    ),

                    LitrosCombustible = grupo.Sum(
                        v => v.LitrosCombustible
                    ),

                    CostoCombustible = grupo.Sum(
                        v => v.CostoCombustible
                    ),

                    Kilometros = grupo.Sum(
                        v => v.Kilometros ?? 0
                    )
                })
                .OrderByDescending(x => x.Produccion)
                .ToListAsync();

            return Ok(produccion);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }


    // =========================================================
    // GET: api/dashboard/produccion-por-conductor
    // =========================================================

    [HttpGet("produccion-por-conductor")]
    public async Task<ActionResult<IEnumerable<DashboardProduccionConductorDto>>>
        ObtenerProduccionPorConductor(
            [FromQuery] int? year,
            [FromQuery] int? month)
    {
        try
        {
            var (inicioMes, inicioMesSiguiente) =
                ObtenerRangoPeriodo(year, month);

            var produccion = await _context.Viajes
                .Where(v =>
                    v.Fecha >= inicioMes &&
                    v.Fecha < inicioMesSiguiente
                )
                .GroupBy(v => new
                {
                    v.ConductorId,
                    v.Conductor.Nombres
                })
                .Select(grupo => new DashboardProduccionConductorDto
                {
                    ConductorId = grupo.Key.ConductorId,
                    Nombre = grupo.Key.Nombres,

                    Viajes = grupo.Count(),

                    Produccion = grupo.Sum(
                        v => v.Tarifa
                    )
                })
                .OrderByDescending(x => x.Produccion)
                .ToListAsync();

            return Ok(produccion);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

        // =========================================================
    // GET: api/dashboard/produccion-por-cliente
    // =========================================================

    [HttpGet("produccion-por-cliente")]
    public async Task<ActionResult<IEnumerable<DashboardProduccionClienteDto>>>
        ObtenerProduccionPorCliente(
            [FromQuery] int? year,
            [FromQuery] int? month)
    {
        try
        {
            var (inicioMes, inicioMesSiguiente) =
                ObtenerRangoPeriodo(year, month);

            var produccion = await _context.Viajes
                .Where(v =>
                    v.Fecha >= inicioMes &&
                    v.Fecha < inicioMesSiguiente
                )
                .GroupBy(v => new
                {
                    v.ClienteId,
                    v.Cliente.Nombre,
                    v.Cliente.Rut
                })
                .Select(grupo => new DashboardProduccionClienteDto
                {
                    ClienteId = grupo.Key.ClienteId,

                    Nombre = grupo.Key.Nombre,

                    Rut = grupo.Key.Rut,

                    Viajes = grupo.Count(),

                    Produccion = grupo.Sum(
                        v => v.Tarifa
                    )
                })
                .OrderByDescending(x => x.Produccion)
                .ToListAsync();

            return Ok(produccion);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("costo-combustible-por-camion")]
    public async Task<ActionResult<IEnumerable<DashboardCostoCombustibleCamionDto>>>
        ObtenerCostoCombustiblePorCamion(
            [FromQuery] int? year,
            [FromQuery] int? month)
    {
        try
        {
            var (inicioMes, inicioMesSiguiente) =
                ObtenerRangoPeriodo(year, month);

            var costos = await _context.Viajes
                .Where(v =>
                    v.Fecha >= inicioMes &&
                    v.Fecha < inicioMesSiguiente
                )
                .GroupBy(v => new
                {
                    v.CamionId,
                    v.Camion.Patente
                })
                .Select(grupo => new DashboardCostoCombustibleCamionDto
                {
                    CamionId = grupo.Key.CamionId,

                    Patente = grupo.Key.Patente,

                    Viajes = grupo.Count(),

                    LitrosCombustible = grupo.Sum(
                        v => v.LitrosCombustible
                    ),

                    CostoCombustible = grupo.Sum(
                        v => v.CostoCombustible
                    )
                })
                .OrderByDescending(
                    x => x.CostoCombustible
                )
                .ToListAsync();

            return Ok(costos);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}