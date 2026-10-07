using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Authorization;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.DTOs;
using TransportesOrellanaSpa.Api.Models;

namespace TransportesOrellanaSpa.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GastoRemolqueController : ControllerBase
{
    private readonly AppDbContext _context;

    private static readonly string[] TiposGastoPermitidos =
    {
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

    public GastoRemolqueController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/gastoremolque
    [RequirePermission("GASTOS_VER")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<GastoRemolqueDto>>> GetAll()
    {
        var gastos = await _context.GastosRemolque
            .AsNoTracking()
            .OrderByDescending(g => g.Fecha)
            .ThenByDescending(g => g.Id)
            .Select(g => new GastoRemolqueDto
            {
                Id = g.Id,
                RemolqueId = g.RemolqueId,
                PatenteRemolque = g.Remolque.Patente,
                Fecha = g.Fecha,
                TipoGasto = g.TipoGasto,
                Descripcion = g.Descripcion,
                Monto = g.Monto,
                Observaciones = g.Observaciones
            })
            .ToListAsync();

        return Ok(gastos);
    }

    // GET: api/gastoremolque/1
    [RequirePermission("GASTOS_VER")]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<GastoRemolqueDto>> GetById(int id)
    {
        var gasto = await _context.GastosRemolque
            .AsNoTracking()
            .Where(g => g.Id == id)
            .Select(g => new GastoRemolqueDto
            {
                Id = g.Id,
                RemolqueId = g.RemolqueId,
                PatenteRemolque = g.Remolque.Patente,
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

    // POST: api/gastoremolque
    [RequirePermission("GASTOS_CREAR")]
    [HttpPost]
    public async Task<ActionResult<GastoRemolqueDto>> Create(
        CrearGastoRemolqueDto dto)
    {
        // Validar remolque
        var remolque = await _context.Remolques
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == dto.RemolqueId);

        if (remolque == null)
        {
            return NotFound(
                $"No existe un remolque con el Id {dto.RemolqueId}.");
        }

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

        var gasto = new GastoRemolque
        {
            RemolqueId = dto.RemolqueId,
            Fecha = dto.Fecha,
            TipoGasto = tipoGasto,
            Descripcion = dto.Descripcion.Trim(),
            Monto = dto.Monto,
            Observaciones = string.IsNullOrWhiteSpace(dto.Observaciones)
                ? null
                : dto.Observaciones.Trim()
        };

        _context.GastosRemolque.Add(gasto);

        await _context.SaveChangesAsync();

        var resultado = await _context.GastosRemolque
            .AsNoTracking()
            .Where(g => g.Id == gasto.Id)
            .Select(g => new GastoRemolqueDto
            {
                Id = g.Id,
                RemolqueId = g.RemolqueId,
                PatenteRemolque = g.Remolque.Patente,
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