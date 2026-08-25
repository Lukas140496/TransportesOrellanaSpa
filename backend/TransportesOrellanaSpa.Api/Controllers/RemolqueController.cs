using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.DTOs;
using TransportesOrellanaSpa.Api.Models;

namespace TransportesOrellanaSpa.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RemolqueController : ControllerBase
{
    private readonly AppDbContext _context;

    public RemolqueController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/remolque
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RemolqueDto>>> GetAll()
    {
        var remolques = await _context.Remolques
            .AsNoTracking()
            .Select(r => new RemolqueDto
            {
                Id = r.Id,
                Patente = r.Patente,
                Marca = r.Marca,
                Modelo = r.Modelo,
                Ano = r.Ano,
                Tipo = r.Tipo,
                CapacidadToneladas = r.CapacidadToneladas,
                Activa = r.Activa,
                CamionHabitualId = r.CamionHabitualId,

                CamionHabitual = r.CamionHabitual == null
                    ? null
                    : new CamionResumenDto
                    {
                        Id = r.CamionHabitual.Id,
                        Patente = r.CamionHabitual.Patente,
                        Marca = r.CamionHabitual.Marca,
                        Modelo = r.CamionHabitual.Modelo
                    }
            })
            .ToListAsync();

        return Ok(remolques);
    }

    // GET: api/remolque/ABC123
    [HttpGet("{patente}")]
    public async Task<ActionResult<RemolqueDto>> GetByPatente(string patente)
    {
        patente = patente.Trim().ToUpperInvariant();

        var remolque = await _context.Remolques
            .AsNoTracking()
            .Where(r => r.Patente == patente)
            .Select(r => new RemolqueDto
            {
                Id = r.Id,
                Patente = r.Patente,
                Marca = r.Marca,
                Modelo = r.Modelo,
                Ano = r.Ano,
                Tipo = r.Tipo,
                CapacidadToneladas = r.CapacidadToneladas,
                Activa = r.Activa,
                CamionHabitualId = r.CamionHabitualId,

                CamionHabitual = r.CamionHabitual == null
                    ? null
                    : new CamionResumenDto
                    {
                        Id = r.CamionHabitual.Id,
                        Patente = r.CamionHabitual.Patente,
                        Marca = r.CamionHabitual.Marca,
                        Modelo = r.CamionHabitual.Modelo
                    }
            })
            .FirstOrDefaultAsync();

        if (remolque == null)
        {
            return NotFound();
        }

        return Ok(remolque);
    }

    // POST: api/remolque
    [HttpPost]
    public async Task<ActionResult<RemolqueDto>> Create(
        CrearRemolqueDto dto)
    {
        var patente = dto.Patente.Trim().ToUpperInvariant();

        var existe = await _context.Remolques
            .AnyAsync(r => r.Patente == patente);

        if (existe)
        {
            return Conflict(
                $"Ya existe un remolque con la patente {patente}.");
        }

        if (dto.CamionHabitualId.HasValue)
        {
            var camionExiste = await _context.Camiones
                .AnyAsync(c => c.Id == dto.CamionHabitualId.Value);

            if (!camionExiste)
            {
                return BadRequest(
                    "El camión habitual indicado no existe.");
            }
        }

        var remolque = new Remolque
        {
            Patente = patente,
            Marca = dto.Marca,
            Modelo = dto.Modelo,
            Ano = dto.Ano,
            Tipo = dto.Tipo,
            CapacidadToneladas = dto.CapacidadToneladas,
            Activa = dto.Activa,
            CamionHabitualId = dto.CamionHabitualId
        };

        _context.Remolques.Add(remolque);

        await _context.SaveChangesAsync();

        var resultado = new RemolqueDto
        {
            Id = remolque.Id,
            Patente = remolque.Patente,
            Marca = remolque.Marca,
            Modelo = remolque.Modelo,
            Ano = remolque.Ano,
            Tipo = remolque.Tipo,
            CapacidadToneladas = remolque.CapacidadToneladas,
            Activa = remolque.Activa,
            CamionHabitualId = remolque.CamionHabitualId
        };

        return CreatedAtAction(
            nameof(GetByPatente),
            new { patente = remolque.Patente },
            resultado
        );
    }

    // PUT: api/remolque/ABC123
    [HttpPut("{patente}")]
    public async Task<IActionResult> Update(
        string patente,
        ActualizarRemolqueDto dto)
    {
        patente = patente.Trim().ToUpperInvariant();

        var remolque = await _context.Remolques
            .FirstOrDefaultAsync(r => r.Patente == patente);

        if (remolque == null)
        {
            return NotFound();
        }

        if (dto.CamionHabitualId.HasValue)
        {
            var camionExiste = await _context.Camiones
                .AnyAsync(c => c.Id == dto.CamionHabitualId.Value);

            if (!camionExiste)
            {
                return BadRequest(
                    "El camión habitual indicado no existe.");
            }
        }

        remolque.Marca = dto.Marca;
        remolque.Modelo = dto.Modelo;
        remolque.Ano = dto.Ano;
        remolque.Tipo = dto.Tipo;
        remolque.CapacidadToneladas = dto.CapacidadToneladas;
        remolque.Activa = dto.Activa;
        remolque.CamionHabitualId = dto.CamionHabitualId;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/remolque/ABC123
    [HttpDelete("{patente}")]
    public async Task<IActionResult> Delete(string patente)
    {
        patente = patente.Trim().ToUpperInvariant();

        var remolque = await _context.Remolques
            .FirstOrDefaultAsync(r => r.Patente == patente);

        if (remolque == null)
        {
            return NotFound();
        }

        _context.Remolques.Remove(remolque);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}