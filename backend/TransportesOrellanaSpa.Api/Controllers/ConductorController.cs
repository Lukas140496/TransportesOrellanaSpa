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

    public ConductorController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/conductor
    [RequirePermission("CONDUCTORES_VER")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ConductorDto>>> GetAll()
    {
        var conductores = await _context.Conductores
            .AsNoTracking()
            .Select(c => new ConductorDto
            {
                Id = c.Id,
                Rut = c.Rut,
                Nombres = c.Nombres,
                ApellidoPaterno = c.ApellidoPaterno,
                ApellidoMaterno = c.ApellidoMaterno,
                FechaNacimiento = c.FechaNacimiento,
                Edad = c.Edad,
                FechaIngreso = c.FechaIngreso,
                Telefono = c.Telefono,
                TipoLicencia = c.TipoLicencia,
                FechaControlLicencia = c.FechaControlLicencia,
                LicenciaAlDia = c.LicenciaAlDia,
                Activo = c.Activo,

                CamionesHabituales = c.CamionesHabituales
                    .Select(cam => new CamionResumenDto
                    {
                        Id = cam.Id,
                        Patente = cam.Patente,
                        Marca = cam.Marca,
                        Modelo = cam.Modelo
                    })
                    .ToList()
            })
            .ToListAsync();

        return Ok(conductores);
    }

    // GET: api/conductor/19.374.867-8
    [RequirePermission("CONDUCTORES_VER")]
    [HttpGet("{rut}")]
    public async Task<ActionResult<ConductorDto>> GetByRut(string rut)
    {
        rut = rut.Trim();

        var conductor = await _context.Conductores
            .AsNoTracking()
            .Where(c => c.Rut == rut)
            .Select(c => new ConductorDto
            {
                Id = c.Id,
                Rut = c.Rut,
                Nombres = c.Nombres,
                ApellidoPaterno = c.ApellidoPaterno,
                ApellidoMaterno = c.ApellidoMaterno,
                FechaNacimiento = c.FechaNacimiento,
                Edad = c.Edad,
                FechaIngreso = c.FechaIngreso,
                Telefono = c.Telefono,
                TipoLicencia = c.TipoLicencia,
                FechaControlLicencia = c.FechaControlLicencia,
                LicenciaAlDia = c.LicenciaAlDia,
                Activo = c.Activo,

                CamionesHabituales = c.CamionesHabituales
                    .Select(cam => new CamionResumenDto
                    {
                        Id = cam.Id,
                        Patente = cam.Patente,
                        Marca = cam.Marca,
                        Modelo = cam.Modelo
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (conductor == null)
        {
            return NotFound(
                $"No existe un conductor con el RUT {rut}."
            );
        }

        return Ok(conductor);
    }

    // POST: api/conductor
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

        var resultado = await _context.Conductores
            .AsNoTracking()
            .Where(c => c.Id == conductor.Id)
            .Select(c => new ConductorDto
            {
                Id = c.Id,
                Rut = c.Rut,
                Nombres = c.Nombres,
                ApellidoPaterno = c.ApellidoPaterno,
                ApellidoMaterno = c.ApellidoMaterno,
                FechaNacimiento = c.FechaNacimiento,
                Edad = c.Edad,
                FechaIngreso = c.FechaIngreso,
                Telefono = c.Telefono,
                TipoLicencia = c.TipoLicencia,
                FechaControlLicencia = c.FechaControlLicencia,
                LicenciaAlDia = c.LicenciaAlDia,
                Activo = c.Activo,
                CamionesHabituales =
                    new List<CamionResumenDto>()
            })
            .FirstAsync();

        return CreatedAtAction(
            nameof(GetByRut),
            new { rut = conductor.Rut },
            resultado
        );
    }

    // PUT: api/conductor/12.345.678-9
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

    // PATCH: api/conductor/12.345.678-9/desactivar
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

    // PATCH: api/conductor/12.345.678-9/activar
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

    // PUT: api/conductor/19.374.867-8/camion-habitual
    [RequirePermission("CONDUCTORES_EDITAR")]
    [HttpPut("{rut}/camion-habitual")]
    public async Task<IActionResult> AsignarCamionHabitual(
        string rut,
        AsignarCamionHabitualDto dto)
    {
        rut = rut.Trim();

        var patente =
            dto.Patente
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
            .FirstOrDefaultAsync(
                c => c.Patente == patente
            );

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

        var conductorDto = new ConductorDto
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
            FechaControlLicencia =
                conductor.FechaControlLicencia,
            LicenciaAlDia =
                conductor.LicenciaAlDia,
            Activo =
                conductor.Activo,

            CamionesHabituales =
                conductor.CamionesHabituales
                    .Select(cam => new CamionResumenDto
                    {
                        Id = cam.Id,
                        Patente = cam.Patente,
                        Marca = cam.Marca,
                        Modelo = cam.Modelo
                    })
                    .ToList()
        };

        return Ok(new
        {
            Mensaje =
                "Camión asignado al conductor correctamente",

            Conductor = conductorDto
        });
    }

    // PUT: api/conductor/25.522.461-8/desasignar-camion/VZ9625
    [RequirePermission("CONDUCTORES_EDITAR")]
    [HttpPut("{rut}/desasignar-camion/{patente}")]
    public async Task<IActionResult> DesasignarCamionHabitual(
        string rut,
        string patente)
    {
        rut = rut.Trim();

        patente =
            patente
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

        var camionAsociado =
            conductor.CamionesHabituales
                .FirstOrDefault(
                    c => c.Patente == patente
                );

        if (camionAsociado == null)
        {
            return BadRequest(
                $"El conductor con RUT {rut} no tiene " +
                $"asignado el camión con patente {patente}."
            );
        }

        conductor.CamionesHabituales
            .Remove(camionAsociado);

        await _context.SaveChangesAsync();

        var conductorDto = new ConductorDto
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
            FechaControlLicencia =
                conductor.FechaControlLicencia,
            LicenciaAlDia =
                conductor.LicenciaAlDia,
            Activo =
                conductor.Activo,

            CamionesHabituales =
                conductor.CamionesHabituales
                    .Select(cam => new CamionResumenDto
                    {
                        Id = cam.Id,
                        Patente = cam.Patente,
                        Marca = cam.Marca,
                        Modelo = cam.Modelo
                    })
                    .ToList()
        };

        return Ok(new
        {
            Mensaje =
                "Camión desasignado del conductor correctamente",

            Conductor = conductorDto
        });
    }

    // DELETE: api/conductor/12.345.678-9
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