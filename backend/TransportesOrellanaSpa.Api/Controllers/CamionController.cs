
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.DTOs;
using TransportesOrellanaSpa.Api.Models;
using TransportesOrellanaSpa.Api.Authorization;

namespace TransportesOrellanaSpa.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CamionController : ControllerBase
{
    private readonly AppDbContext _context;

    public CamionController(AppDbContext context)
    {
        _context = context;
    }

    // =========================================
    // GET: api/camion
    // =========================================
    [RequirePermission("CAMIONES_VER")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CamionDto>>> GetAll()
    {
        var camiones = await _context.Camiones
            .AsNoTracking()
            .Include(c => c.ConductoresHabituales)
            .Include(c => c.Remolques)
            .ToListAsync();

        var resultado = camiones
            .Select(MapearCamion)
            .ToList();

        return Ok(resultado);
    }

    // =========================================
    // GET: api/camion/VJ8427
    // =========================================
    [RequirePermission("CAMIONES_VER")]
    [HttpGet("{patente}")]
    public async Task<ActionResult<CamionDto>> GetByPatente(
        string patente)
    {
        patente = patente.Trim().ToUpperInvariant();

        var camion = await _context.Camiones
            .AsNoTracking()
            .Include(c => c.ConductoresHabituales)
            .Include(c => c.Remolques)
            .FirstOrDefaultAsync(c => c.Patente == patente);

        if (camion == null)
        {
            return NotFound();
        }

        return Ok(MapearCamion(camion));
    }

    // =========================================
    // POST: api/camion
    // =========================================
    [RequirePermission("CAMIONES_CREAR")]
    [HttpPost]
    public async Task<ActionResult<CamionDto>> Create(
        CrearCamionDto dto)
    {
        var patente = dto.Patente.Trim().ToUpperInvariant();

        var existe = await _context.Camiones
            .AnyAsync(c => c.Patente == patente);

        if (existe)
        {
            return Conflict(
                $"Ya existe un camión con la patente {patente}.");
        }

        var camion = new Camion
        {
            Patente = patente,
            Marca = dto.Marca,
            Modelo = dto.Modelo,
            Ano = dto.Ano,
            Tipo = dto.Tipo,
            Color = dto.Color,
            Capacidad = dto.Capacidad,
            Motor = dto.Motor,
            Caballos = dto.Caballos,
            Cilindrada = dto.Cilindrada,
            Transmision = dto.Transmision,

            FechaRevisionTecnica = dto.FechaRevisionTecnica,
            FechaPermisoCirculacion = dto.FechaPermisoCirculacion,
            FechaSeguroObligatorio = dto.FechaSeguroObligatorio,

            Activo = true
        };

        _context.Camiones.Add(camion);

        await _context.SaveChangesAsync();

        var resultado = await _context.Camiones
            .AsNoTracking()
            .Include(c => c.ConductoresHabituales)
            .Include(c => c.Remolques)
            .FirstAsync(c => c.Id == camion.Id);

        var camionDto = MapearCamion(resultado);

        return CreatedAtAction(
            nameof(GetByPatente),
            new { patente = camion.Patente },
            camionDto
        );
    }

    // =========================================
    // PUT: api/camion/VJ8427
    // =========================================
    [RequirePermission("CAMIONES_EDITAR")]
    [HttpPut("{patente}")]
    public async Task<IActionResult> Update(
        string patente,
        ActualizarCamionDto dto)
    {
        patente = patente.Trim().ToUpperInvariant();

        var camion = await _context.Camiones
            .FirstOrDefaultAsync(c => c.Patente == patente);

        if (camion == null)
        {
            return NotFound();
        }

        camion.Marca = dto.Marca;
        camion.Modelo = dto.Modelo;
        camion.Ano = dto.Ano;
        camion.Tipo = dto.Tipo;
        camion.Color = dto.Color;
        camion.Capacidad = dto.Capacidad;
        camion.Motor = dto.Motor;
        camion.Caballos = dto.Caballos;
        camion.Cilindrada = dto.Cilindrada;
        camion.Transmision = dto.Transmision;

        camion.FechaRevisionTecnica = dto.FechaRevisionTecnica;
        camion.FechaPermisoCirculacion = dto.FechaPermisoCirculacion;
        camion.FechaSeguroObligatorio = dto.FechaSeguroObligatorio;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // =========================================
    // PATCH: api/camion/VJ8427/desactivar
    // =========================================
    [RequirePermission("CAMIONES_EDITAR")]
    [HttpPatch("{patente}/desactivar")]
    public async Task<ActionResult<CamionDto>> Desactivar(
        string patente)
    {
        patente = patente.Trim().ToUpperInvariant();

        var camion = await _context.Camiones
            .FirstOrDefaultAsync(c => c.Patente == patente);

        if (camion == null)
        {
            return NotFound(
                $"No existe un camión con la patente {patente}.");
        }

        if (!camion.Activo)
        {
            return Conflict(
                $"El camión {patente} ya se encuentra desactivado.");
        }

        camion.Activo = false;

        await _context.SaveChangesAsync();

        var resultado = await _context.Camiones
            .AsNoTracking()
            .Include(c => c.ConductoresHabituales)
            .Include(c => c.Remolques)
            .FirstAsync(c => c.Id == camion.Id);

        return Ok(MapearCamion(resultado));
    }

    // =========================================
    // PATCH: api/camion/VJ8427/activar
    // =========================================
    [RequirePermission("CAMIONES_EDITAR")]
    [HttpPatch("{patente}/activar")]
    public async Task<ActionResult<CamionDto>> Activar(
        string patente)
    {
        patente = patente.Trim().ToUpperInvariant();

        var camion = await _context.Camiones
            .FirstOrDefaultAsync(c => c.Patente == patente);

        if (camion == null)
        {
            return NotFound(
                $"No existe un camión con la patente {patente}.");
        }

        if (camion.Activo)
        {
            return Conflict(
                $"El camión {patente} ya se encuentra activo.");
        }

        camion.Activo = true;

        await _context.SaveChangesAsync();

        var resultado = await _context.Camiones
            .AsNoTracking()
            .Include(c => c.ConductoresHabituales)
            .Include(c => c.Remolques)
            .FirstAsync(c => c.Id == camion.Id);

        return Ok(MapearCamion(resultado));
    }

    // =========================================
    // PUT: api/camion/VJ8427/conductor-habitual
    // =========================================
    [RequirePermission("CAMIONES_EDITAR")]
    [HttpPut("{patente}/conductor-habitual")]
    public async Task<IActionResult> AsignarConductorHabitual(
        string patente,
        AsignarConductorHabitualDto dto)
    {
        patente = patente.Trim().ToUpperInvariant();
        var rut = dto.Rut.Trim();

        var camion = await _context.Camiones
            .Include(c => c.ConductoresHabituales)
            .Include(c => c.Remolques)
            .FirstOrDefaultAsync(c => c.Patente == patente);

        if (camion == null)
        {
            return NotFound(
                $"No existe un camión con la patente {patente}.");
        }

        var conductor = await _context.Conductores
            .FirstOrDefaultAsync(c => c.Rut == rut);

        if (conductor == null)
        {
            return NotFound(
                $"No existe un conductor con el RUT {rut}.");
        }

        if (!camion.ConductoresHabituales
            .Any(cond => cond.Id == conductor.Id))
        {
            camion.ConductoresHabituales.Add(conductor);

            await _context.SaveChangesAsync();
        }

        var camionDto = MapearCamion(camion);

        return Ok(new
        {
            Mensaje = "Conductor habitual asignado correctamente al camión",
            Camion = camionDto
        });
    }

    // =========================================
    // PUT: api/camion/VJ8427/remolque-habitual
    // =========================================
    [RequirePermission("CAMIONES_EDITAR")]
    [HttpPut("{patente}/remolque-habitual")]
    public async Task<IActionResult> AsignarRemolqueHabitual(
        string patente,
        AsignarRemolqueDto dto)
    {
        patente = patente.Trim().ToUpperInvariant();

        var camion = await _context.Camiones
            .FirstOrDefaultAsync(c => c.Patente == patente);

        if (camion == null)
        {
            return NotFound(
                $"No existe un camión con la patente {patente}.");
        }

        var patenteRemolque = dto.Patente.Trim().ToUpperInvariant();

        var remolque = await _context.Remolques
            .FirstOrDefaultAsync(r => r.Patente == patenteRemolque);

        if (remolque == null)
        {
            return NotFound(
                $"No existe un remolque con la patente {patenteRemolque}.");
        }

        remolque.CamionHabitualId = camion.Id;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            Mensaje = "Remolque habitual asignado correctamente al camión.",
            Camion = camion.Patente,
            Remolque = remolque.Patente
        });
    }

    // =========================================
    // DELETE: api/camion/VJ8427/conductor-habitual/RUT
    // =========================================
    [RequirePermission("CAMIONES_EDITAR")]
    [HttpDelete("{patente}/conductor-habitual/{rut}")]
    public async Task<IActionResult> DesasignarConductorHabitual(
        string patente,
        string rut)
    {
        patente = patente.Trim().ToUpperInvariant();
        rut = rut.Trim();

        var camion = await _context.Camiones
            .Include(c => c.ConductoresHabituales)
            .FirstOrDefaultAsync(c => c.Patente == patente);

        if (camion == null)
        {
            return NotFound(
                $"No existe un camión con la patente {patente}.");
        }

        var conductor = camion.ConductoresHabituales
            .FirstOrDefault(c => c.Rut == rut);

        if (conductor == null)
        {
            return NotFound(
                $"El conductor con RUT {rut} no está asignado a este camión.");
        }

        camion.ConductoresHabituales.Remove(conductor);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            Mensaje = "Conductor habitual desasignado correctamente.",
            Camion = camion.Patente,
            Conductor = conductor.Rut
        });
    }

    // =========================================
    // DELETE: api/camion/VJ8427/remolque-habitual
    // =========================================
    [RequirePermission("CAMIONES_EDITAR")]
    [HttpDelete("{patente}/remolque-habitual")]
    public async Task<IActionResult> DesasignarRemolqueHabitual(
        string patente)
    {
        patente = patente.Trim().ToUpperInvariant();

        var camion = await _context.Camiones
            .Include(c => c.Remolques)
            .FirstOrDefaultAsync(c => c.Patente == patente);

        if (camion == null)
        {
            return NotFound(
                $"No existe un camión con la patente {patente}.");
        }

        foreach (var remolque in camion.Remolques)
        {
            remolque.CamionHabitualId = null;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            Mensaje = "Remolque habitual desasignado correctamente.",
            Camion = camion.Patente
        });
    }

    // =========================================
    // DELETE: api/camion/VJ8427
    // =========================================
    [RequirePermission("CAMIONES_ELIMINAR")]
    [HttpDelete("{patente}")]
    public async Task<IActionResult> Delete(string patente)
    {
        patente = patente.Trim().ToUpperInvariant();

        var camion = await _context.Camiones
            .FirstOrDefaultAsync(c => c.Patente == patente);

        if (camion == null)
        {
            return NotFound();
        }

        _context.Camiones.Remove(camion);

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // =========================================
    // MAPEO DE CAMIÓN A DTO
    // =========================================
    private static CamionDto MapearCamion(Camion camion)
    {
        return new CamionDto
        {
            Id = camion.Id,
            Patente = camion.Patente,
            Marca = camion.Marca,
            Modelo = camion.Modelo,
            Ano = camion.Ano,
            Tipo = camion.Tipo,
            Color = camion.Color,
            Capacidad = camion.Capacidad,
            Motor = camion.Motor,
            Caballos = camion.Caballos,
            Cilindrada = camion.Cilindrada,
            Transmision = camion.Transmision,

            FechaRevisionTecnica = camion.FechaRevisionTecnica,
            FechaPermisoCirculacion = camion.FechaPermisoCirculacion,
            FechaSeguroObligatorio = camion.FechaSeguroObligatorio,

            RevisionTecnica = CalcularEstadoDocumento(
                camion.FechaRevisionTecnica),

            // El certificado de gases comparte la fecha
            // y vigencia de la revisión técnica.
            CertificadoGases = CalcularEstadoDocumento(
                camion.FechaRevisionTecnica),

            PermisoCirculacion = CalcularEstadoDocumento(
                camion.FechaPermisoCirculacion),

            SeguroObligatorio = CalcularEstadoDocumento(
                camion.FechaSeguroObligatorio),

            Activo = camion.Activo,

            ConductoresHabituales = camion.ConductoresHabituales
                .Select(cond => new ConductorResumenDto
                {
                    Rut = cond.Rut,
                    Nombres = cond.Nombres,
                    ApellidoPaterno = cond.ApellidoPaterno,
                    ApellidoMaterno = cond.ApellidoMaterno
                })
                .ToList(),

            Remolques = camion.Remolques
                .Select(r => new RemolqueResumenDto
                {
                    Id = r.Id,
                    Patente = r.Patente,
                    Marca = r.Marca,
                    Modelo = r.Modelo,
                    Tipo = r.Tipo,
                    CapacidadToneladas = r.CapacidadToneladas,
                    Activa = r.Activa
                })
                .ToList()
        };
    }

    // =========================================
    // CÁLCULO AUTOMÁTICO DE VIGENCIA
    // =========================================
    private static EstadoDocumentoDto CalcularEstadoDocumento(
        DateTime? fechaVencimiento)
    {
        if (!fechaVencimiento.HasValue)
        {
            return new EstadoDocumentoDto
            {
                Estado = "SinRegistro",
                DiasRestantes = null
            };
        }

        var diasRestantes = (
            fechaVencimiento.Value.Date - DateTime.Today
        ).Days;

        string estado;

        if (diasRestantes < 0)
        {
            estado = "Vencido";
        }
        else if (diasRestantes <= 30)
        {
            estado = "PorVencer";
        }
        else
        {
            estado = "AlDia";
        }

        return new EstadoDocumentoDto
        {
            Estado = estado,
            DiasRestantes = diasRestantes
        };
    }
}
