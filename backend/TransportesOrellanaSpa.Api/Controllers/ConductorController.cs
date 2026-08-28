using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.DTOs;
using TransportesOrellanaSpa.Api.Models;

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

                // Proyectamos la lista completa de camiones asignados
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
            return NotFound($"No existe un conductor con el RUT {rut}.");
        }

        return Ok(conductor);
    }

    // POST: api/conductor
    [HttpPost]
    public async Task<ActionResult<ConductorDto>> Create(CrearConductorDto dto)
    {
        var rut = dto.Rut.Trim();

        var existe = await _context.Conductores
            .AnyAsync(c => c.Rut == rut);

        if (existe)
        {
            return Conflict($"Ya existe un conductor registrado con el RUT {rut}.");
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
            LicenciaAlDia = dto.LicenciaAlDia
        };

        _context.Conductores.Add(conductor);
        await _context.SaveChangesAsync();

        // Busca el registro creado para retornar la estructura DTO limpia
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
                CamionesHabituales = new List<CamionResumenDto>() // Al crearse, nace sin camiones
            })
            .FirstAsync();

        return CreatedAtAction(
            nameof(GetByRut),
            new { rut = conductor.Rut },
            resultado
        );
    }

    // PUT: api/conductor/12.345.678-9
    [HttpPut("{rut}")]
    public async Task<IActionResult> Update(
        string rut,
        Conductor conductor)
    {
        if (!string.Equals(
                rut,
                conductor.Rut,
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(
                "El RUT de la URL no coincide con el RUT del conductor."
            );
        }

        var conductorExistente = await _context.Conductores
            .FirstOrDefaultAsync(c => c.Rut == rut);

        if (conductorExistente == null)
        {
            return NotFound();
        }

        conductorExistente.Nombres = conductor.Nombres;
        conductorExistente.ApellidoPaterno = conductor.ApellidoPaterno;
        conductorExistente.ApellidoMaterno = conductor.ApellidoMaterno;
        conductorExistente.FechaNacimiento = conductor.FechaNacimiento;
        conductorExistente.Edad = conductor.Edad;
        conductorExistente.FechaIngreso = conductor.FechaIngreso;
        conductorExistente.Telefono = conductor.Telefono;
        conductorExistente.TipoLicencia = conductor.TipoLicencia;
        conductorExistente.FechaControlLicencia = conductor.FechaControlLicencia;
        conductorExistente.LicenciaAlDia = conductor.LicenciaAlDia;

        await _context.SaveChangesAsync();

        return NoContent();
    }

        // PUT: api/conductor/19.374.867-8/camion-habitual
    [HttpPut("{rut}/camion-habitual")]
    public async Task<IActionResult> AsignarCamionHabitual(string rut, AsignarCamionHabitualDto dto)
    {
        rut = rut.Trim();
        var patente = dto.Patente.Trim().ToUpperInvariant();

        // 1. Buscamos al conductor por su RUT, incluyendo la colección de camiones
        var conductor = await _context.Conductores
            .Include(c => c.CamionesHabituales)
            .FirstOrDefaultAsync(c => c.Rut == rut);

        if (conductor == null) return NotFound($"No existe un conductor con el RUT {rut}.");

        // 2. Buscamos el camión por la patente que viene en el Body JSON
        var camion = await _context.Camiones.FirstOrDefaultAsync(c => c.Patente == patente);
        if (camion == null) return NotFound($"No existe un camión con la patente {patente}.");

        // 3. CORREGIDO: Guardamos la relación en la lista Muchos a Muchos de manera bidireccional
        if (!conductor.CamionesHabituales.Any(cam => cam.Id == camion.Id))
        {
            conductor.CamionesHabituales.Add(camion);
            await _context.SaveChangesAsync();
        }

        // 4. Retornamos el perfil del conductor actualizado de acuerdo al nuevo ConductorDto
        var conductorDto = new ConductorDto {
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
            
            CamionesHabituales = conductor.CamionesHabituales.Select(cam => new CamionResumenDto {
                Id = cam.Id,
                Patente = cam.Patente,
                Marca = cam.Marca,
                Modelo = cam.Modelo
            }).ToList()
        };

        return Ok(new { Mensaje = "Camión asignado al conductor correctamente", Conductor = conductorDto });
    }

    // PUT: api/conductor/25.522.461-8/desasignar-camion/VZ9625
    [HttpPut("{rut}/desasignar-camion/{patente}")]
    public async Task<IActionResult> DesasignarCamionHabitual(string rut, string patente)
    {
        rut = rut.Trim();
        patente = patente.Trim().ToUpperInvariant();

        // 1. Buscamos al conductor incluyendo su lista actual de camiones
        var conductor = await _context.Conductores
            .Include(c => c.CamionesHabituales)
            .FirstOrDefaultAsync(c => c.Rut == rut);

        if (conductor == null) 
        {
            return NotFound($"No existe un conductor con el RUT {rut}.");
        }

        // 2. Buscamos si el camión está dentro de la lista de este conductor
        var camionAsociado = conductor.CamionesHabituales
            .FirstOrDefault(c => c.Patente == patente);

        if (camionAsociado == null)
        {
            return BadRequest($"El conductor con RUT {rut} no tiene asignado el camión con patente {patente}.");
        }

        // 3. Removemos solo este camión de la colección (EF se encarga de borrar la fila en la tabla intermedia)
        conductor.CamionesHabituales.Remove(camionAsociado);
        await _context.SaveChangesAsync();

        // 4. Construimos el DTO de respuesta con el estado real final del chofer
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
            FechaControlLicencia = conductor.FechaControlLicencia,
            LicenciaAlDia = conductor.LicenciaAlDia,
            
            CamionesHabituales = conductor.CamionesHabituales.Select(cam => new CamionResumenDto
            {
                Id = cam.Id,
                Patente = cam.Patente,
                Marca = cam.Marca,
                Modelo = cam.Modelo
            }).ToList()
        };

        return Ok(new
        {
            Mensaje = "Camión desasignado del conductor correctamente",
            Conductor = conductorDto
        });
    }

    // DELETE: api/conductor/12.345.678-9
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