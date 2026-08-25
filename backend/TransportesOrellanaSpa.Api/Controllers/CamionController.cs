using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.DTOs;
using TransportesOrellanaSpa.Api.Models;

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

    // GET: api/camion
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CamionDto>>> GetAll()
    {
        var camiones = await _context.Camiones
            .AsNoTracking()
            .Select(c => new CamionDto
            {
                Id = c.Id,
                Patente = c.Patente,
                Marca = c.Marca,
                Modelo = c.Modelo,
                Ano = c.Ano,
                Tipo = c.Tipo,
                Color = c.Color,
                Capacidad = c.Capacidad,
                Motor = c.Motor,
                Caballos = c.Caballos,
                Cilindrada = c.Cilindrada,
                Transmision = c.Transmision,
                FechaRevisionTecnica = c.FechaRevisionTecnica,
                FechaPermisoCirculacion = c.FechaPermisoCirculacion,
                FechaSeguroObligatorio = c.FechaSeguroObligatorio,
                RevisionAlDia = c.RevisionAlDia,
                PermisoAlDia = c.PermisoAlDia,

                SeguroAlDia = c.SeguroAlDia,

                ConductorHabitual = c.ConductorHabitual == null
                    ? null
                    : new ConductorResumenDto
                    {
                        Rut = c.ConductorHabitual.Rut,
                        Nombres = c.ConductorHabitual.Nombres,
                        ApellidoPaterno = c.ConductorHabitual.ApellidoPaterno,
                        ApellidoMaterno = c.ConductorHabitual.ApellidoMaterno
                    }
            })
            .ToListAsync();

        return Ok(camiones);
    }

    // GET: api/camion/VJ8427
    [HttpGet("{patente}")]
    public async Task<ActionResult<CamionDto>> GetByPatente(string patente)
    {
        patente = patente.Trim().ToUpperInvariant();

        var camion = await _context.Camiones
            .AsNoTracking()
            .Where(c => c.Patente == patente)
            .Select(c => new CamionDto
            {
                Id = c.Id,
                Patente = c.Patente,
                Marca = c.Marca,
                Modelo = c.Modelo,
                Ano = c.Ano,
                Tipo = c.Tipo,
                Color = c.Color,
                Capacidad = c.Capacidad,
                Motor = c.Motor,
                Caballos = c.Caballos,
                Cilindrada = c.Cilindrada,
                Transmision = c.Transmision,
                FechaRevisionTecnica = c.FechaRevisionTecnica,
                FechaPermisoCirculacion = c.FechaPermisoCirculacion,
                FechaSeguroObligatorio = c.FechaSeguroObligatorio,
                RevisionAlDia = c.RevisionAlDia,
                PermisoAlDia = c.PermisoAlDia,

                SeguroAlDia = c.SeguroAlDia,

                ConductorHabitual = c.ConductorHabitual == null
                    ? null
                    : new ConductorResumenDto
                    {
                        Rut = c.ConductorHabitual.Rut,
                        Nombres = c.ConductorHabitual.Nombres,
                        ApellidoPaterno = c.ConductorHabitual.ApellidoPaterno,
                        ApellidoMaterno = c.ConductorHabitual.ApellidoMaterno
                    },
                Remolques = c.Remolques
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
            })
            .FirstOrDefaultAsync();

        if (camion == null)
        {
            return NotFound();
        }

        return Ok(camion);
    }

    // POST: api/camion
    [HttpPost]
    public async Task<ActionResult<CamionDto>> Create(CrearCamionDto dto)
    {
        var patente = dto.Patente.Trim().ToUpperInvariant();

        var existe = await _context.Camiones
            .AnyAsync(c => c.Patente == patente);

        if (existe)
        {
            return Conflict($"Ya existe un camión con la patente {patente}.");
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
            RevisionAlDia = dto.RevisionAlDia,
            PermisoAlDia = dto.PermisoAlDia,
            SeguroAlDia = dto.SeguroAlDia
        };

        _context.Camiones.Add(camion);
        await _context.SaveChangesAsync();

        var resultado = await _context.Camiones
            .AsNoTracking()
            .Where(c => c.Id == camion.Id)
            .Select(c => new CamionDto
            {
                Id = c.Id,
                Patente = c.Patente,
                Marca = c.Marca,
                Modelo = c.Modelo,
                Ano = c.Ano,
                Tipo = c.Tipo,
                Color = c.Color,
                Capacidad = c.Capacidad,
                Motor = c.Motor,
                Caballos = c.Caballos,
                Cilindrada = c.Cilindrada,
                Transmision = c.Transmision,
                FechaRevisionTecnica = c.FechaRevisionTecnica,
                FechaPermisoCirculacion = c.FechaPermisoCirculacion,
                FechaSeguroObligatorio = c.FechaSeguroObligatorio,
                RevisionAlDia = c.RevisionAlDia,
                PermisoAlDia = c.PermisoAlDia,

                SeguroAlDia = c.SeguroAlDia,

                ConductorHabitual = c.ConductorHabitual == null
                    ? null
                    : new ConductorResumenDto
                    {
                        Rut = c.ConductorHabitual.Rut,
                        Nombres = c.ConductorHabitual.Nombres,
                        ApellidoPaterno = c.ConductorHabitual.ApellidoPaterno,
                        ApellidoMaterno = c.ConductorHabitual.ApellidoMaterno
                    }
            })
            .FirstAsync();

        return CreatedAtAction(
            nameof(GetByPatente),
            new { patente = camion.Patente },
            resultado
        );
    }

    // PUT: api/camion/VJ8427
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
        camion.RevisionAlDia = dto.RevisionAlDia;
        camion.PermisoAlDia = dto.PermisoAlDia;
        camion.SeguroAlDia = dto.SeguroAlDia;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // PUT: api/camion/VJ8427/conductor-habitual
    [HttpPut("{patente}/conductor-habitual")]
    public async Task<IActionResult> AsignarConductorHabitual(
        string patente,
        AsignarConductorHabitualDto dto)
    {
        patente = patente.Trim().ToUpperInvariant();
        var rut = dto.Rut.Trim();

        var camion = await _context.Camiones
            .FirstOrDefaultAsync(c => c.Patente == patente);

        if (camion == null)
        {
            return NotFound($"No existe un camión con la patente {patente}.");
        }

        var conductor = await _context.Conductores
            .FirstOrDefaultAsync(c => c.Rut == rut);

        if (conductor == null)
        {
            return NotFound($"No existe un conductor con el RUT {rut}.");
        }

        camion.ConductorHabitualId = conductor.Id;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/camion/VJ8427
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
}