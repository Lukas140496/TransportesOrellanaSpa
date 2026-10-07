using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Authorization;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.DTOs;
using TransportesOrellanaSpa.Api.Models;

namespace TransportesOrellanaSpa.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GastoController : ControllerBase
{
    private readonly AppDbContext _context;

    private static readonly string[] TiposGastoPermitidos =
    {
        "combustible",
        "peajes",
        "mantención",
        "reparación",
        "neumáticos",
        "permisos",
        "seguros",
        "revision",
        "multas",
        "lavado",
        "otros"
    };

    public GastoController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/gasto
    [RequirePermission("GASTOS_VER")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<GastoDto>>> GetAll()
    {
        var gastos = await _context.Gastos
            .AsNoTracking()
            .OrderByDescending(g => g.Fecha)
            .ThenByDescending(g => g.Id)
            .Select(g => new GastoDto
            {
                Id = g.Id,
                CamionId = g.CamionId,
                PatenteCamion = g.Camion.Patente,
                ViajeId = g.ViajeId,
                NumeroGuiaDespacho = g.Viaje != null
                    ? g.Viaje.NumeroGuiaDespacho
                    : null,
                Fecha = g.Fecha,
                TipoGasto = g.TipoGasto,
                Descripcion = g.Descripcion,
                Monto = g.Monto,
                Observaciones = g.Observaciones
            })
            .ToListAsync();

        return Ok(gastos);
    }

    // GET: api/gasto/1
    [RequirePermission("GASTOS_VER")]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<GastoDto>> GetById(int id)
    {
        var gasto = await _context.Gastos
            .AsNoTracking()
            .Where(g => g.Id == id)
            .Select(g => new GastoDto
            {
                Id = g.Id,
                CamionId = g.CamionId,
                PatenteCamion = g.Camion.Patente,
                ViajeId = g.ViajeId,
                NumeroGuiaDespacho = g.Viaje != null
                    ? g.Viaje.NumeroGuiaDespacho
                    : null,
                Fecha = g.Fecha,
                TipoGasto = g.TipoGasto,
                Descripcion = g.Descripcion,
                Monto = g.Monto,
                Observaciones = g.Observaciones
            })
            .FirstOrDefaultAsync();

        if (gasto == null)
        {
            return NotFound();
        }

        return Ok(gasto);
    }

    // POST: api/gasto
    [RequirePermission("GASTOS_CREAR")]
    [HttpPost]
    public async Task<ActionResult<GastoDto>> Create(CrearGastoDto dto)
    {
        // Validar camión
        var camion = await _context.Camiones
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == dto.CamionId);

        if (camion == null)
        {
            return NotFound(
                $"No existe un camión con el Id {dto.CamionId}.");
        }

        // Por ahora, el combustible se genera automáticamente
        // desde los viajes y no mediante gastos manuales.

        if (string.IsNullOrWhiteSpace(dto.TipoGasto))
        {
            return BadRequest(
                "El tipo de gasto es obligatorio.");
        }

        var tipoGasto = dto.TipoGasto.Trim().ToLowerInvariant();

        if (!TiposGastoPermitidos.Contains(tipoGasto))
        {
            return BadRequest(
                "El tipo de gasto indicado no es válido.");
        }

        // El combustible se genera automáticamente desde los viajes.
        if (tipoGasto == "combustible")
        {
            return BadRequest(
                "Los gastos de combustible se generan automáticamente desde los viajes.");
        }

        if (dto.Monto <= 0)
        {
            return BadRequest(
                "El monto del gasto debe ser mayor que cero.");
        }

        if (string.IsNullOrWhiteSpace(dto.Descripcion))
        {
            return BadRequest(
                "La descripción del gasto es obligatoria.");
        }

        var gasto = new Gasto
        {
            CamionId = dto.CamionId,
            Fecha = dto.Fecha,
            TipoGasto = tipoGasto,
            Descripcion = dto.Descripcion.Trim(),
            Monto = dto.Monto,
            Observaciones = string.IsNullOrWhiteSpace(dto.Observaciones)
                ? null
                : dto.Observaciones.Trim()
        };

        _context.Gastos.Add(gasto);

        await _context.SaveChangesAsync();

        var resultado = await _context.Gastos
            .AsNoTracking()
            .Where(g => g.Id == gasto.Id)
            .Select(g => new GastoDto
            {
                Id = g.Id,
                CamionId = g.CamionId,
                PatenteCamion = g.Camion.Patente,
                ViajeId = g.ViajeId,
                NumeroGuiaDespacho = g.Viaje != null
                    ? g.Viaje.NumeroGuiaDespacho
                    : null,
                Fecha = g.Fecha,
                TipoGasto = g.TipoGasto,
                Descripcion = g.Descripcion,
                Monto = g.Monto,
                Observaciones = g.Observaciones
            })
            .FirstAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = gasto.Id },
            resultado
        );
    }
}