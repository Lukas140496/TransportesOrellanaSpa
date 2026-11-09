using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Authorization;
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
    [RequirePermission("REMOLQUES_VER")]
    [HttpGet]

    [RequirePermission("REMOLQUES_VER")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RemolqueDto>>> GetAll()
    {
        var remolques = await _context.Remolques
            .AsNoTracking()
            .Include(r => r.CamionHabitual)
            .Where(r => r.Patente != "NA")
            .ToListAsync();

        var fechaActual = ObtenerFechaChile();

        var resultado = remolques
            .Select(r => MapearRemolque(r, fechaActual))
            .ToList();

        return Ok(resultado);
    }

    // GET: api/remolque/ABC123
    [RequirePermission("REMOLQUES_VER")]
    [HttpGet("{patente}")]
    public async Task<ActionResult<RemolqueDto>> GetByPatente(string patente)
    {
        patente = patente.Trim().ToUpperInvariant();

        var remolque = await _context.Remolques
            .AsNoTracking()
            .Include(r => r.CamionHabitual)
            .FirstOrDefaultAsync(r => r.Patente == patente);

        if (remolque == null)
        {
            return NotFound();
        }

        var resultado = MapearRemolque(
            remolque,
            ObtenerFechaChile()
        );

        return Ok(resultado);
    }

    // POST: api/remolque
    [RequirePermission("REMOLQUES_CREAR")]
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
            CamionHabitualId = dto.CamionHabitualId,
            FechaPermisoCirculacion = dto.FechaPermisoCirculacion,
            FechaSeguro = dto.FechaSeguro,
            FechaRevisionTecnica = dto.FechaRevisionTecnica,
        };

        _context.Remolques.Add(remolque);

        await _context.SaveChangesAsync();

        var resultado = MapearRemolque(
            remolque,
            ObtenerFechaChile()
        );

        return CreatedAtAction(
            nameof(GetByPatente),
            new { patente = remolque.Patente },
            resultado
        );
    }

    // PUT: api/remolque/ABC123
    [RequirePermission("REMOLQUES_EDITAR")]
    [HttpPut("{patente}")]
    public async Task<ActionResult<RemolqueDto>> Update(
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
        remolque.FechaPermisoCirculacion = dto.FechaPermisoCirculacion;
        remolque.FechaSeguro = dto.FechaSeguro;
        remolque.FechaRevisionTecnica = dto.FechaRevisionTecnica;
        remolque.CamionHabitualId = dto.CamionHabitualId;

        await _context.SaveChangesAsync();

        await _context.Entry(remolque)
            .Reference(r => r.CamionHabitual)
            .LoadAsync();

        var resultado = MapearRemolque(
            remolque,
            ObtenerFechaChile()
        );

        return Ok(resultado);
    }

    // PATCH: api/remolque/ABC123/desactivar
    [RequirePermission("REMOLQUES_EDITAR")]
    [HttpPatch("{patente}/desactivar")]
    public async Task<ActionResult<RemolqueDto>> Desactivar(
        string patente)
    {
        patente = patente.Trim().ToUpperInvariant();

        var remolque = await _context.Remolques
            .FirstOrDefaultAsync(r => r.Patente == patente);

        if (remolque == null)
        {
            return NotFound(
                $"No existe un remolque con la patente {patente}.");
        }

        if (!remolque.Activa)
        {
            return Conflict(
                $"El remolque con patente {patente} ya se encuentra inactivo.");
        }

        remolque.Activa = false;

        await _context.SaveChangesAsync();

        await _context.Entry(remolque)
            .Reference(r => r.CamionHabitual)
            .LoadAsync();

        var resultado = MapearRemolque(
            remolque,
            ObtenerFechaChile()
        );

        return Ok(resultado);
    }

    // PATCH: api/remolque/ABC123/activar
    [RequirePermission("REMOLQUES_EDITAR")]
    [HttpPatch("{patente}/activar")]
    public async Task<ActionResult<RemolqueDto>> Activar(
        string patente)
    {
        patente = patente.Trim().ToUpperInvariant();

        var remolque = await _context.Remolques
            .FirstOrDefaultAsync(r => r.Patente == patente);

        if (remolque == null)
        {
            return NotFound(
                $"No existe un remolque con la patente {patente}.");
        }

        if (remolque.Activa)
        {
            return Conflict(
                $"El remolque con patente {patente} ya se encuentra activo.");
        }

        remolque.Activa = true;

        await _context.SaveChangesAsync();

        await _context.Entry(remolque)
            .Reference(r => r.CamionHabitual)
            .LoadAsync();

        var resultado = MapearRemolque(
            remolque,
            ObtenerFechaChile()
        );

        return Ok(resultado);
    }

    // PUT: api/remolque/ABC123/camion-habitual
    [RequirePermission("REMOLQUES_EDITAR")]
    [HttpPut("{patente}/camion-habitual")]
    public async Task<IActionResult> AsignarCamionHabitual(
        string patente,
        AsignarCamionHabitualDto dto)
    {
        patente = patente.Trim().ToUpperInvariant();

        var remolque = await _context.Remolques
            .FirstOrDefaultAsync(r => r.Patente == patente);

        if (remolque == null)
        {
            return NotFound(
                $"No existe un remolque con la patente {patente}.");
        }

        var patenteCamion = dto.Patente.Trim().ToUpperInvariant();

        var camion = await _context.Camiones
            .FirstOrDefaultAsync(c => c.Patente == patenteCamion);

        if (camion == null)
        {
            return NotFound(
                $"No existe un camión con la patente {patenteCamion}.");
        }

        remolque.CamionHabitualId = camion.Id;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            Mensaje = "Camión habitual asignado correctamente al remolque.",
            Remolque = remolque.Patente,
            Camion = camion.Patente
        });
    }

    // DELETE: api/remolque/ABC123/camion-habitual
    [RequirePermission("REMOLQUES_EDITAR")]
    [HttpDelete("{patente}/camion-habitual")]
    public async Task<IActionResult> DesasignarCamionHabitual(
        string patente)
    {
        patente = patente.Trim().ToUpperInvariant();

        var remolque = await _context.Remolques
            .FirstOrDefaultAsync(r => r.Patente == patente);

        if (remolque == null)
        {
            return NotFound(
                $"No existe un remolque con la patente {patente}.");
        }

        remolque.CamionHabitualId = null;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            Mensaje = "Camión habitual desasignado correctamente.",
            Remolque = remolque.Patente
        });
    }

    // DELETE: api/remolque/ABC123
    [RequirePermission("REMOLQUES_ELIMINAR")]
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

    private static readonly TimeZoneInfo ZonaHorariaChile =
        TimeZoneInfo.FindSystemTimeZoneById("America/Santiago");

    private static DateTime ObtenerFechaChile()
    {
        return TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.UtcNow,
            ZonaHorariaChile
        ).Date;
    }

    private static EstadoDocumentoDto CalcularEstadoDocumento(
        DateTime? fechaVencimiento,
        DateTime fechaActual)
    {
        if (!fechaVencimiento.HasValue)
        {
            return new EstadoDocumentoDto
            {
                Estado = "SinRegistro",
                DiasRestantes = null
            };
        }

        int diasRestantes =
            (fechaVencimiento.Value.Date - fechaActual.Date).Days;

        string estado = diasRestantes < 0
            ? "Vencido"
            : diasRestantes <= 30
                ? "PorVencer"
                : "AlDia";

        return new EstadoDocumentoDto
        {
            Estado = estado,
            DiasRestantes = diasRestantes
        };
    }

    private static RemolqueDto MapearRemolque(
        Remolque remolque,
        DateTime fechaActual)
    {
        return new RemolqueDto
        {
            Id = remolque.Id,
            Patente = remolque.Patente,
            Marca = remolque.Marca,
            Modelo = remolque.Modelo,
            Ano = remolque.Ano,
            Tipo = remolque.Tipo,
            CapacidadToneladas = remolque.CapacidadToneladas,
            Activa = remolque.Activa,

            FechaPermisoCirculacion = remolque.FechaPermisoCirculacion,
            FechaSeguro = remolque.FechaSeguro,
            FechaRevisionTecnica = remolque.FechaRevisionTecnica,

            PermisoCirculacion = CalcularEstadoDocumento(
                remolque.FechaPermisoCirculacion,
                fechaActual
            ),

            Seguro = CalcularEstadoDocumento(
                remolque.FechaSeguro,
                fechaActual
            ),

            RevisionTecnica = CalcularEstadoDocumento(
                remolque.FechaRevisionTecnica,
                fechaActual
            ),

            CamionHabitualId = remolque.CamionHabitualId,

            CamionHabitual = remolque.CamionHabitual == null
                ? null
                : new CamionResumenDto
                {
                    Id = remolque.CamionHabitual.Id,
                    Patente = remolque.CamionHabitual.Patente,
                    Marca = remolque.CamionHabitual.Marca,
                    Modelo = remolque.CamionHabitual.Modelo
                }
        };
    }
}