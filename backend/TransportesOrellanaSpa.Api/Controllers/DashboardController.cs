using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.DTOs;
using TransportesOrellanaSpa.Api.Enums;

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

            var camionesActivos = _context.Camiones
                .Where(c => c.Activo);

            var camiones = await camionesActivos
                .CountAsync();

            var camionesRevisionVencida = await camionesActivos
                .CountAsync(c => !c.RevisionAlDia);

            var camionesPermisoVencido = await camionesActivos
                .CountAsync(c => !c.PermisoAlDia);

            var camionesSeguroVencido = await camionesActivos
                .CountAsync(c => !c.SeguroAlDia);

            var camionesDocumentacionVencida = await camionesActivos
                .CountAsync(c =>
                    !c.RevisionAlDia ||
                    !c.PermisoAlDia ||
                    !c.SeguroAlDia
                );

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

            // ===================================
            // GASTOS DEL PERÍODO
            // ===================================

            var gastosCamionesMes = await _context.Gastos
                .Where(g =>
                    g.Fecha >= inicioMes &&
                    g.Fecha < inicioMesSiguiente
                )
                .SumAsync(g => (decimal?)g.Monto) ?? 0m;

            var gastosRemolquesMes = await _context.GastosRemolque
                .Where(g =>
                    g.Fecha >= inicioMes &&
                    g.Fecha < inicioMesSiguiente
                )
                .SumAsync(g => (decimal?)g.Monto) ?? 0m;

            var gastosConductoresMes = await _context.GastosConductor
                .Where(g =>
                    g.Fecha >= inicioMes &&
                    g.Fecha < inicioMesSiguiente
                )
                .SumAsync(g => (decimal?)g.Monto) ?? 0m;

            var produccionMes = await viajesMes
                .SumAsync(v => v.Tarifa);

            var totalGastosMes =
                gastosCamionesMes
                + gastosRemolquesMes
                + gastosConductoresMes;

            var gananciaNetaMes =
                produccionMes - totalGastosMes;

            var resumen = new DashboardResumenDto
            {
                Camiones = camiones,
                Conductores = conductores,
                Remolques = remolques,
                Clientes = clientes,

                ViajesMes = await viajesMes.CountAsync(),

                ProduccionMes = produccionMes,
                GananciaNetaMes = gananciaNetaMes,
                TotalGastosMes = totalGastosMes,

                GastosCamionesMes = gastosCamionesMes,
                GastosRemolquesMes = gastosRemolquesMes,
                GastosConductoresMes = gastosConductoresMes,

                LitrosCombustibleMes = await viajesMes
                    .SumAsync(v => v.LitrosCombustible),

                CostoCombustibleMes = await viajesMes
                    .SumAsync(v => v.CostoCombustible),

                KilometrosMes = await viajesMes
                    .SumAsync(v => v.Kilometros ?? 0),

                // ===================================
                // DOCUMENTACIÓN DE LA FLOTA
                // ===================================

                CamionesRevisionVencida =
                    camionesRevisionVencida,

                CamionesPermisoVencido =
                    camionesPermisoVencido,

                CamionesSeguroVencido =
                    camionesSeguroVencido,

                CamionesDocumentacionVencida =
                    camionesDocumentacionVencida
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


    // =========================================================
    // GET: api/dashboard/costo-combustible-por-camion
    // =========================================================

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


    // =========================================================
    // GET: api/dashboard/kilometros-por-camion
    // =========================================================

    [HttpGet("kilometros-por-camion")]
    public async Task<ActionResult<IEnumerable<DashboardKilometrosCamionDto>>>
        ObtenerKilometrosPorCamion(
            [FromQuery] int? year,
            [FromQuery] int? month)
    {
        try
        {
            var (inicioMes, inicioMesSiguiente) =
                ObtenerRangoPeriodo(year, month);

            var kilometros = await _context.Viajes
                .Where(v =>
                    v.Fecha >= inicioMes &&
                    v.Fecha < inicioMesSiguiente
                )
                .GroupBy(v => new
                {
                    v.CamionId,
                    v.Camion.Patente
                })
                .Select(grupo => new DashboardKilometrosCamionDto
                {
                    CamionId = grupo.Key.CamionId,

                    Patente = grupo.Key.Patente,

                    Viajes = grupo.Count(),

                    Kilometros = grupo.Sum(
                        v => v.Kilometros ?? 0
                    )
                })
                .OrderByDescending(
                    x => x.Kilometros
                )
                .ToListAsync();

            return Ok(kilometros);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // =========================================================
    // GET: api/dashboard/kilometros-por-conductor
    // =========================================================

    [HttpGet("kilometros-por-conductor")]
    public async Task<ActionResult<IEnumerable<DashboardKilometrosConductorDto>>>
        ObtenerKilometrosPorConductor(
            [FromQuery] int? year,
            [FromQuery] int? month)
    {
        try
        {
            var (inicioMes, inicioMesSiguiente) =
                ObtenerRangoPeriodo(year, month);

            var kilometros = await _context.Viajes
                .Where(v =>
                    v.Fecha >= inicioMes &&
                    v.Fecha < inicioMesSiguiente
                )
                .GroupBy(v => new
                {
                    v.ConductorId,
                    v.Conductor.Nombres
                })
                .Select(grupo => new DashboardKilometrosConductorDto
                {
                    ConductorId = grupo.Key.ConductorId,

                    Nombre = grupo.Key.Nombres,

                    Viajes = grupo.Count(),

                    Kilometros = (decimal)grupo.Sum(
                        v => v.Kilometros ?? 0
                    )
                })
                .OrderByDescending(
                    x => x.Kilometros
                )
                .ToListAsync();

            return Ok(kilometros);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }


    // =========================================================
    // GET: api/dashboard/gastos-por-camion
    // =========================================================

    [HttpGet("gastos-por-camion")]
    public async Task<ActionResult<IEnumerable<DashboardGastosCamionDto>>>
        ObtenerGastosPorCamion(
            [FromQuery] int? year,
            [FromQuery] int? month)
    {
        try
        {
            var (inicioMes, inicioMesSiguiente) =
                ObtenerRangoPeriodo(year, month);

            var gastos = await _context.Gastos
                .Where(g =>
                    g.Fecha >= inicioMes &&
                    g.Fecha < inicioMesSiguiente
                )
                .GroupBy(g => new
                {
                    g.CamionId,
                    g.Camion.Patente
                })
                .Select(grupo => new DashboardGastosCamionDto
                {
                    CamionId = grupo.Key.CamionId,
                    Patente = grupo.Key.Patente,
                    Monto = grupo.Sum(g => g.Monto)
                })
                .OrderByDescending(g => g.Monto)
                .ToListAsync();

            return Ok(gastos);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }


    // =========================================================
    // GET: api/dashboard/gastos-por-conductor
    // =========================================================

    [HttpGet("gastos-por-conductor")]
    public async Task<ActionResult<IEnumerable<DashboardGastosConductorDto>>>
        ObtenerGastosPorConductor(
            [FromQuery] int? year,
            [FromQuery] int? month)
    {
        try
        {
            var (inicioMes, inicioMesSiguiente) =
                ObtenerRangoPeriodo(year, month);

            var gastos = await _context.GastosConductor
                .Where(g =>
                    g.Fecha >= inicioMes &&
                    g.Fecha < inicioMesSiguiente
                )
                .GroupBy(g => new
                {
                    g.ConductorId,
                    g.Conductor.Nombres
                })
                .Select(grupo => new DashboardGastosConductorDto
                {
                    ConductorId = grupo.Key.ConductorId,
                    Nombre = grupo.Key.Nombres,
                    Monto = grupo.Sum(g => g.Monto)
                })
                .OrderByDescending(g => g.Monto)
                .ToListAsync();

            return Ok(gastos);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }


    // =========================================================
    // GET: api/dashboard/gastos-por-remolque
    // =========================================================

    [HttpGet("gastos-por-remolque")]
    public async Task<ActionResult<IEnumerable<DashboardGastosRemolqueDto>>>
        ObtenerGastosPorRemolque(
            [FromQuery] int? year,
            [FromQuery] int? month)
    {
        try
        {
            var (inicioMes, inicioMesSiguiente) =
                ObtenerRangoPeriodo(year, month);

            var gastos = await _context.GastosRemolque
                .Where(g =>
                    g.Fecha >= inicioMes &&
                    g.Fecha < inicioMesSiguiente
                )
                .GroupBy(g => new
                {
                    g.RemolqueId,
                    g.Remolque.Patente
                })
                .Select(grupo => new DashboardGastosRemolqueDto
                {
                    RemolqueId = grupo.Key.RemolqueId,
                    Nombre = grupo.Key.Patente,
                    Monto = grupo.Sum(g => g.Monto)
                })
                .OrderByDescending(g => g.Monto)
                .ToListAsync();

            return Ok(gastos);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }


    // =========================================================
    // GET: api/dashboard/gastos-por-tipo
    // =========================================================

    [HttpGet("gastos-por-tipo")]
    public async Task<ActionResult<IEnumerable<DashboardGastosTipoDto>>>
        ObtenerGastosPorTipo(
            [FromQuery] int? year,
            [FromQuery] int? month)
    {
        try
        {
            var (inicioMes, inicioMesSiguiente) =
                ObtenerRangoPeriodo(year, month);

            var gastosCamiones = await _context.Gastos
                .Where(g =>
                    g.Fecha >= inicioMes &&
                    g.Fecha < inicioMesSiguiente
                )
                .GroupBy(g => g.TipoGasto)
                .Select(grupo => new DashboardGastosTipoDto
                {
                    TipoGasto = grupo.Key,
                    Monto = grupo.Sum(g => g.Monto)
                })
                .ToListAsync();

            var gastosConductores = await _context.GastosConductor
                .Where(g =>
                    g.Fecha >= inicioMes &&
                    g.Fecha < inicioMesSiguiente
                )
                .GroupBy(g => g.TipoGasto)
                .Select(grupo => new DashboardGastosTipoDto
                {
                    TipoGasto = grupo.Key,
                    Monto = grupo.Sum(g => g.Monto)
                })
                .ToListAsync();

            var gastosRemolques = await _context.GastosRemolque
                .Where(g =>
                    g.Fecha >= inicioMes &&
                    g.Fecha < inicioMesSiguiente
                )
                .GroupBy(g => g.TipoGasto)
                .Select(grupo => new DashboardGastosTipoDto
                {
                    TipoGasto = grupo.Key,
                    Monto = grupo.Sum(g => g.Monto)
                })
                .ToListAsync();

            var gastos = gastosCamiones
                .Concat(gastosConductores)
                .Concat(gastosRemolques)
                .GroupBy(g => g.TipoGasto)
                .Select(grupo => new DashboardGastosTipoDto
                {
                    TipoGasto = grupo.Key,
                    Monto = grupo.Sum(g => g.Monto)
                })
                .OrderByDescending(g => g.Monto)
                .ToList();

            return Ok(gastos);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }


    // =========================================================
    // GET: api/dashboard/estado-pagos
    // =========================================================

    [HttpGet("estado-pagos")]
    public async Task<ActionResult<DashboardEstadoPagosDto>>
        ObtenerEstadoPagos(
            [FromQuery] int? year,
            [FromQuery] int? month)
    {
        try
        {
            var (inicioMes, inicioMesSiguiente) =
                ObtenerRangoPeriodo(year, month);

            // ===================================
            // VIAJES PAGADOS
            //
            // Se consideran los viajes cuya
            // Fecha pertenece al período seleccionado
            // y cuyo estado de pago es Pagado.
            // ===================================

            var viajesPagadosQuery = _context.Viajes
                .Where(v =>
                    v.EstadoPago == EstadoPago.Pagado &&
                    v.Fecha >= inicioMes &&
                    v.Fecha < inicioMesSiguiente
                );

            var viajesPagados =
                await viajesPagadosQuery.CountAsync();

            var montoPagado =
                await viajesPagadosQuery
                    .SumAsync(v => v.Tarifa);

            // ===================================
            // VIAJES PENDIENTES
            //
            // Se consideran los viajes cuya
            // Fecha pertenece al período seleccionado
            // y cuyo estado de pago es Pendiente.
            // ===================================

            var viajesPendientesPagoQuery = _context.Viajes
                .Where(v =>
                    v.EstadoPago == EstadoPago.Pendiente &&
                    v.Fecha >= inicioMes &&
                    v.Fecha < inicioMesSiguiente
                );

            var viajesPendientesPago =
                await viajesPendientesPagoQuery.CountAsync();

            var montoPendientePago =
                await viajesPendientesPagoQuery
                    .SumAsync(v => v.Tarifa);

            var resultado = new DashboardEstadoPagosDto
            {
                ViajesPagados = viajesPagados,

                MontoPagado = montoPagado,

                ViajesPendientesPago =
                    viajesPendientesPago,

                MontoPendientePago =
                    montoPendientePago
            };

            return Ok(resultado);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // =========================================================
    // GET: api/dashboard/dias-habiles
    // =========================================================

    [HttpGet("dias-habiles")]
    public async Task<ActionResult<DashboardDiasHabilesDto>>
        ObtenerDiasHabiles(
            [FromQuery] int? year,
            [FromQuery] int? month)
    {
        try
        {
            var (inicioMes, inicioMesSiguiente) =
                ObtenerRangoPeriodo(year, month);

            var diasHabiles = 0;
            var diasTrabajados = 0;

            for (
                var fecha = inicioMes.Date;
                fecha < inicioMesSiguiente.Date;
                fecha = fecha.AddDays(1)
            )
            {
                // Lunes = 1 ... Domingo = 7
                if (
                    fecha.DayOfWeek == DayOfWeek.Saturday ||
                    fecha.DayOfWeek == DayOfWeek.Sunday
                )
                {
                    continue;
                }

                diasHabiles++;

                var diaSiguiente = fecha.AddDays(1);

                var trabajoEseDia = await _context.Viajes
                    .AnyAsync(v =>
                        v.Fecha >= fecha &&
                        v.Fecha < diaSiguiente
                    );

                if (trabajoEseDia)
                {
                    diasTrabajados++;
                }
            }

            var resultado = new DashboardDiasHabilesDto
            {
                DiasHabiles = diasHabiles,
                DiasTrabajados = diasTrabajados,
                DiasNoTrabajados = diasHabiles - diasTrabajados
            };

            return Ok(resultado);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}