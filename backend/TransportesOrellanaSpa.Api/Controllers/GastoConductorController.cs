
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Authorization;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.DTOs;
using TransportesOrellanaSpa.Api.Models;

namespace TransportesOrellanaSpa.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GastoConductorController : ControllerBase
{
    private readonly AppDbContext _context;

    private static readonly string[] TiposGastoPermitidos =
    {
        "sueldo",
        "finiquito",
        "adelanto",
        "bono",
        "afp",
        "salud",
        "seguro",
        "otros"
    };

    public GastoConductorController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/gastoconductor
    [RequirePermission("GASTOS_VER")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<GastoConductorDto>>> GetAll()
    {
        var gastos = await _context.GastosConductor
            .AsNoTracking()
            .OrderByDescending(g => g.Fecha)
            .ThenByDescending(g => g.Id)
            .Select(g => new GastoConductorDto
            {
                Id = g.Id,
                ConductorId = g.ConductorId,
                NombreConductor =
                    g.Conductor.Nombres + " " +
                    g.Conductor.ApellidoPaterno + " " +
                    g.Conductor.ApellidoMaterno,
                Fecha = g.Fecha,
                TipoGasto = g.TipoGasto,
                Descripcion = g.Descripcion,
                Monto = g.Monto,
                Observaciones = g.Observaciones
            })
            .ToListAsync();

        return Ok(gastos);
    }

    // GET: api/gastoconductor/1
    [RequirePermission("GASTOS_VER")]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<GastoConductorDto>> GetById(int id)
    {
        var gasto = await _context.GastosConductor
            .AsNoTracking()
            .Where(g => g.Id == id)
            .Select(g => new GastoConductorDto
            {
                Id = g.Id,
                ConductorId = g.ConductorId,
                NombreConductor =
                    g.Conductor.Nombres + " " +
                    g.Conductor.ApellidoPaterno + " " +
                    g.Conductor.ApellidoMaterno,
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

    // POST: api/gastoconductor
    [RequirePermission("GASTOS_CREAR")]
    [HttpPost]
    public async Task<ActionResult<GastoConductorDto>> Create(
        CrearGastoConductorDto dto)
    {
        // Validar conductor
        var conductor = await _context.Conductores
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == dto.ConductorId);

        if (conductor == null)
        {
            return NotFound(
                $"No existe un conductor con el Id {dto.ConductorId}.");
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

        var gasto = new GastoConductor
        {
            ConductorId = dto.ConductorId,
            Fecha = dto.Fecha,
            TipoGasto = tipoGasto,
            Descripcion = dto.Descripcion.Trim(),
            Monto = dto.Monto,
            Observaciones = string.IsNullOrWhiteSpace(dto.Observaciones)
                ? null
                : dto.Observaciones.Trim()
        };

        _context.GastosConductor.Add(gasto);

        await _context.SaveChangesAsync();

        var resultado = await _context.GastosConductor
            .AsNoTracking()
            .Where(g => g.Id == gasto.Id)
            .Select(g => new GastoConductorDto
            {
                Id = g.Id,
                ConductorId = g.ConductorId,
                NombreConductor =
                    g.Conductor.Nombres + " " +
                    g.Conductor.ApellidoPaterno + " " +
                    g.Conductor.ApellidoMaterno,
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
