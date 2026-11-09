
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.DTOs;
using TransportesOrellanaSpa.Api.Models;
using TransportesOrellanaSpa.Api.Authorization;

namespace TransportesOrellanaSpa.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConductorController : ControllerBase
{
    private readonly AppDbContext _context;

    private static readonly TimeZoneInfo ZonaHorariaChile =
        TimeZoneInfo.FindSystemTimeZoneById("America/Santiago");

    public ConductorController(AppDbContext context)
    {
        _context = context;
    }

    // =========================================
    // FECHA Y ESTADO DE VENCIMIENTO
    // =========================================

    private static DateTime ObtenerFechaChile()
    {
        return TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.UtcNow,
            ZonaHorariaChile
        ).Date;
    }

    private static EstadoDocumentoDto CalcularEstadoLicencia(
        DateTime fechaVencimiento,
        DateTime fechaActual)
    {
        if (fechaVencimiento == default)
        {
            return new EstadoDocumentoDto
            {
                Estado = "SinRegistro",
                DiasRestantes = null
            };
        }

        var diasRestantes =
            (fechaVencimiento.Date - fechaActual.Date).Days;

        if (diasRestantes < 0)
        {
            return new EstadoDocumentoDto
            {
                Estado = "Vencido",
                DiasRestantes = diasRestantes
            };
        }

        if (diasRestantes <= 30)
        {
            return new EstadoDocumentoDto
            {
                Estado = "PorVencer",
                DiasRestantes = diasRestantes
            };
        }

        return new EstadoDocumentoDto
        {
            Estado = "AlDia",
            DiasRestantes = diasRestantes
        };
    }

    // =========================================
    // MAPEO DE CONDUCTOR A DTO
    // =========================================

    private static ConductorDto MapearConductor(
        Conductor conductor,
        DateTime fechaActual)
    {
        return new ConductorDto
        {
            Id = conductor.Id,
            Rut = conductor.Rut,
            Nombres = conductor.Nombres,
            ApellidoPaterno = conductor.ApellidoPaterno,
            ApellidoMaterno = conductor.ApellidoMaterno,
            FechaNacimiento = conductor.FechaNacimiento,
            Edad = conductor.Edad,
            FechaIngreso = conductor.FechaIngreso,
            Telefono = conductor.Telefono,
            TipoLicencia = conductor.TipoLicencia,
            FechaControlLicencia = conductor.FechaControlLicencia,
            LicenciaAlDia = conductor.LicenciaAlDia,

            LicenciaConducir = CalcularEstadoLicencia(
                conductor.FechaControlLicencia,
                fechaActual
            ),

            Activo = conductor.Activo,

            CamionesHabituales = conductor.CamionesHabituales
                .Select(cam => new CamionResumenDto
                {
                    Id = cam.Id,
                    Patente = cam.Patente,
                    Marca = cam.Marca,
                    Modelo = cam.Modelo
                })
                .ToList()
        };
    }

    // =========================================
    // GET: api/conductor
    // =========================================

    [RequirePermission("CONDUCTORES_VER")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ConductorDto>>> GetAll()
    {
        var fechaActual = ObtenerFechaChile();

        var conductores = await _context.Conductores
            .AsNoTracking()
            .Include(c => c.CamionesHabituales)
            .ToListAsync();

        var resultado = conductores
            .Select(c => MapearConductor(c, fechaActual))
            .ToList();

        return Ok(resultado);
    }

    // =========================================
    // GET: api/conductor/19.374.867-8
    // =========================================

    [RequirePermission("CONDUCTORES_VER")]
    [HttpGet("{rut}")]
    public async Task<ActionResult<ConductorDto>> GetByRut(string rut)
    {
        rut = rut.Trim();

        var conductor = await _context.Conductores
            .AsNoTracking()
            .Include(c => c.CamionesHabituales)
            .FirstOrDefaultAsync(c => c.Rut == rut);

        if (conductor == null)
        {
            return NotFound(
                $"No existe un conductor con el RUT {rut}."
            );
        }

        var resultado = MapearConductor(
            conductor,
            ObtenerFechaChile()
        );

        return Ok(resultado);
    }

    // =========================================
    // POST: api/conductor
    // =========================================

    [RequirePermission("CONDUCTORES_CREAR")]
    [HttpPost]
    public async Task<ActionResult<ConductorDto>> Create(
        CrearConductorDto dto)
    {
        var rut = dto.Rut.Trim();

        var existe = await _context.Conductores
            .AnyAsync(c => c.Rut == rut);

        if (existe)
        {
            return Conflict(
                $"Ya existe un conductor registrado con el RUT {rut}."
            );
        }

        var conductor = new Conductor
        {
            Rut = rut,
            Nombres = dto.Nombres,
            ApellidoPaterno = dto.ApellidoPaterno,
            ApellidoMaterno = dto.ApellidoMaterno,
            FechaNacimiento = dto.FechaNacimiento,
            Edad = dto.Edad,
            FechaIngreso = dto.FechaIngreso,
            Telefono = dto.Telefono,
            TipoLicencia = dto.TipoLicencia,
            FechaControlLicencia = dto.FechaControlLicencia,
            LicenciaAlDia = dto.LicenciaAlDia,
            Activo = true
        };

        _context.Conductores.Add(conductor);

        await _context.SaveChangesAsync();

        var conductorCreado = await _context.Conductores
            .AsNoTracking()
            .Include(c => c.CamionesHabituales)
            .FirstAsync(c => c.Id == conductor.Id);

        var resultado = MapearConductor(
            conductorCreado,
            ObtenerFechaChile()
        );

        return CreatedAtAction(
            nameof(GetByRut),
            new { rut = conductor.Rut },
            resultado
        );
    }

    // =========================================
    // PUT: api/conductor/12.345.678-9
    // =========================================

    [RequirePermission("CONDUCTORES_EDITAR")]
    [HttpPut("{rut}")]
    public async Task<IActionResult> Update(
        string rut,
        ActualizarConductorDto dto)
    {
        rut = rut.Trim();

        if (string.IsNullOrWhiteSpace(dto.Nombres))
        {
            return BadRequest(
                "El nombre del conductor es obligatorio."
            );
        }

        if (string.IsNullOrWhiteSpace(dto.ApellidoPaterno))
        {
            return BadRequest(
                "El apellido paterno es obligatorio."
            );
        }

        if (string.IsNullOrWhiteSpace(dto.ApellidoMaterno))
        {
            return BadRequest(
                "El apellido materno es obligatorio."
            );
        }

        if (dto.FechaNacimiento == default)
        {
            return BadRequest(
                "La fecha de nacimiento es obligatoria."
            );
        }

        if (dto.FechaIngreso == default)
        {
            return BadRequest(
                "La fecha de ingreso es obligatoria."
            );
        }

        if (string.IsNullOrWhiteSpace(dto.Telefono))
        {
            return BadRequest(
                "El teléfono es obligatorio."
            );
        }

        if (string.IsNullOrWhiteSpace(dto.TipoLicencia))
        {
            return BadRequest(
                "El tipo de licencia es obligatorio."
            );
        }

        if (dto.FechaControlLicencia == default)
        {
            return BadRequest(
                "La fecha de control de licencia es obligatoria."
            );
        }

        var conductorExistente =
            await _context.Conductores
                .FirstOrDefaultAsync(c => c.Rut == rut);

        if (conductorExistente == null)
        {
            return NotFound();
        }

        conductorExistente.Nombres =
            dto.Nombres.Trim();

        conductorExistente.ApellidoPaterno =
            dto.ApellidoPaterno.Trim();

        conductorExistente.ApellidoMaterno =
            dto.ApellidoMaterno.Trim();

        conductorExistente.FechaNacimiento =
            dto.FechaNacimiento;

        conductorExistente.Edad =
            dto.Edad;

        conductorExistente.FechaIngreso =
            dto.FechaIngreso;

        conductorExistente.Telefono =
            dto.Telefono.Trim();

        conductorExistente.TipoLicencia =
            dto.TipoLicencia.Trim();

        conductorExistente.FechaControlLicencia =
            dto.FechaControlLicencia;

        conductorExistente.LicenciaAlDia =
            dto.LicenciaAlDia;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // =========================================
    // PATCH: api/conductor/{rut}/desactivar
    // =========================================

    [RequirePermission("CONDUCTORES_EDITAR")]
    [HttpPatch("{rut}/desactivar")]
    public async Task<IActionResult> Desactivar(string rut)
    {
        rut = rut.Trim();

        var conductor = await _context.Conductores
            .FirstOrDefaultAsync(c => c.Rut == rut);

        if (conductor == null)
        {
            return NotFound(
                $"No existe un conductor con el RUT {rut}."
            );
        }

        if (!conductor.Activo)
        {
            return BadRequest(
                $"El conductor con RUT {rut} ya está desactivado."
            );
        }

        conductor.Activo = false;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            Mensaje = "Conductor desactivado correctamente."
        });
    }

    // =========================================
    // PATCH: api/conductor/{rut}/activar
    // =========================================

    [RequirePermission("CONDUCTORES_EDITAR")]
    [HttpPatch("{rut}/activar")]
    public async Task<IActionResult> Activar(string rut)
    {
        rut = rut.Trim();

        var conductor = await _context.Conductores
            .FirstOrDefaultAsync(c => c.Rut == rut);

        if (conductor == null)
        {
            return NotFound(
                $"No existe un conductor con el RUT {rut}."
            );
        }

        if (conductor.Activo)
        {
            return Conflict(
                $"El conductor con RUT {rut} ya se encuentra activo."
            );
        }

        conductor.Activo = true;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // =========================================
    // PUT: api/conductor/{rut}/camion-habitual
    // =========================================

    [RequirePermission("CONDUCTORES_EDITAR")]
    [HttpPut("{rut}/camion-habitual")]
    public async Task<IActionResult> AsignarCamionHabitual(
        string rut,
        AsignarCamionHabitualDto dto)
    {
        rut = rut.Trim();

        var patente = dto.Patente
            .Trim()
            .ToUpperInvariant();

        var conductor = await _context.Conductores
            .Include(c => c.CamionesHabituales)
            .FirstOrDefaultAsync(c => c.Rut == rut);

        if (conductor == null)
        {
            return NotFound(
                $"No existe un conductor con el RUT {rut}."
            );
        }

        var camion = await _context.Camiones
            .FirstOrDefaultAsync(c => c.Patente == patente);

        if (camion == null)
        {
            return NotFound(
                $"No existe un camión con la patente {patente}."
            );
        }

        if (!conductor.CamionesHabituales
            .Any(cam => cam.Id == camion.Id))
        {
            conductor.CamionesHabituales.Add(camion);

            await _context.SaveChangesAsync();
        }

        var conductorDto = MapearConductor(
            conductor,
            ObtenerFechaChile()
        );

        return Ok(new
        {
            Mensaje = "Camión asignado al conductor correctamente",
            Conductor = conductorDto
        });
    }

    // =========================================
    // PUT: api/conductor/{rut}/desasignar-camion/{patente}
    // =========================================

    [RequirePermission("CONDUCTORES_EDITAR")]
    [HttpPut("{rut}/desasignar-camion/{patente}")]
    public async Task<IActionResult> DesasignarCamionHabitual(
        string rut,
        string patente)
    {
        rut = rut.Trim();

        patente = patente
            .Trim()
            .ToUpperInvariant();

        var conductor = await _context.Conductores
            .Include(c => c.CamionesHabituales)
            .FirstOrDefaultAsync(c => c.Rut == rut);

        if (conductor == null)
        {
            return NotFound(
                $"No existe un conductor con el RUT {rut}."
            );
        }

        var camionAsociado = conductor.CamionesHabituales
            .FirstOrDefault(c => c.Patente == patente);

        if (camionAsociado == null)
        {
            return BadRequest(
                $"El conductor con RUT {rut} no tiene " +
                $"asignado el camión con patente {patente}."
            );
        }

        conductor.CamionesHabituales.Remove(camionAsociado);

        await _context.SaveChangesAsync();

        var conductorDto = MapearConductor(
            conductor,
            ObtenerFechaChile()
        );

        return Ok(new
        {
            Mensaje = "Camión desasignado del conductor correctamente",
            Conductor = conductorDto
        });
    }

    // =========================================
    // DELETE: api/conductor/12.345.678-9
    // =========================================

    [RequirePermission("CONDUCTORES_ELIMINAR")]
    [HttpDelete("{rut}")]
    public async Task<IActionResult> Delete(string rut)
    {
        var conductor = await _context.Conductores
            .FirstOrDefaultAsync(c => c.Rut == rut);

        if (conductor == null)
        {
            return NotFound();
        }

        _context.Conductores.Remove(conductor);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
