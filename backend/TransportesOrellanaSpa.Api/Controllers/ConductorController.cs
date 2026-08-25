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
                LicenciaAlDia = c.LicenciaAlDia
            })
            .ToListAsync();

        return Ok(conductores);
    }

    // GET: api/conductor/12.345.678-9
    [HttpGet("{rut}")]
    public async Task<ActionResult<ConductorDto>> GetByRut(string rut)
    {
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
                LicenciaAlDia = c.LicenciaAlDia
            })
            .FirstOrDefaultAsync();

        if (conductor == null)
        {
            return NotFound();
        }

        return Ok(conductor);
    }

    // POST: api/conductor
    [HttpPost]
    public async Task<ActionResult<ConductorDto>> Create(Conductor conductor)
    {
        var existe = await _context.Conductores
            .AnyAsync(c => c.Rut == conductor.Rut);

        if (existe)
        {
            return Conflict(
                $"Ya existe un conductor con el RUT {conductor.Rut}."
            );
        }

        _context.Conductores.Add(conductor);
        await _context.SaveChangesAsync();

        var resultado = new ConductorDto
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
            LicenciaAlDia = conductor.LicenciaAlDia
        };

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