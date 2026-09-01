using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.DTOs;
using TransportesOrellanaSpa.Api.Models;
using TransportesOrellanaSpa.Api.Enums;

namespace TransportesOrellanaSpa.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ViajeController : ControllerBase
{
    private readonly AppDbContext _context;

    public ViajeController(AppDbContext context)
    {
        _context = context;
    }

    // =========================
    // POST: api/viaje
    // =========================

    [HttpPost]
    public async Task<ActionResult<ViajeDto>> Create(CrearViajeDto dto)
    {
        // =========================
        // VALIDAR GUÍA DESPACHO
        // =========================

        if (string.IsNullOrWhiteSpace(dto.NumeroGuiaDespacho))
        {
            return BadRequest("El número de guía de despacho es obligatorio.");
        }

        var numeroGuiaDespacho = dto.NumeroGuiaDespacho.Trim();

        var guiaExiste = await _context.Viajes
            .AnyAsync(v => v.NumeroGuiaDespacho == numeroGuiaDespacho);

        if (guiaExiste)
        {
            return Conflict("Ya existe un viaje registrado con ese número de guía de despacho.");
        }

        // =========================
        // VALIDAR CLIENTE
        // =========================

        var clienteExiste = await _context.Clientes
            .AnyAsync(c => c.Id == dto.ClienteId);

        if (!clienteExiste)
        {
            return BadRequest("El cliente indicado no existe.");
        }

        // =========================
        // VALIDAR CAMIÓN
        // =========================

        var camionExiste = await _context.Camiones
            .AnyAsync(c => c.Id == dto.CamionId);

        if (!camionExiste)
        {
            return BadRequest("El camión indicado no existe.");
        }

        // =========================
        // VALIDAR CONDUCTOR
        // =========================

        var conductorExiste = await _context.Conductores
            .AnyAsync(c => c.Id == dto.ConductorId);

        if (!conductorExiste)
        {
            return BadRequest("El conductor indicado no existe.");
        }

        // =========================
        // VALIDAR REMOLQUE
        // =========================

        var remolqueExiste = await _context.Remolques
            .AnyAsync(r => r.Id == dto.RemolqueId);

        if (!remolqueExiste)
        {
            return BadRequest("El remolque indicado no existe.");
        }

        // =========================
        // CREAR VIAJE
        // =========================

        var viaje = new Viaje
        {
            NumeroGuiaDespacho = numeroGuiaDespacho,

            Fecha = dto.Fecha,

            ClienteId = dto.ClienteId,
            CamionId = dto.CamionId,
            ConductorId = dto.ConductorId,
            RemolqueId = dto.RemolqueId,

            Origen = dto.Origen.Trim(),
            Destino = dto.Destino.Trim(),
            ComunaOrigen = dto.ComunaOrigen.Trim(),
            ComunaDestino = dto.ComunaDestino.Trim(),
            TipoCarga = dto.TipoCarga.Trim(),

            Kilometros = dto.Kilometros,
            Tarifa = dto.Tarifa,

            Observaciones = dto.Observaciones.Trim(),

            Estado = EstadoViaje.Pendiente,
            EstadoPago = EstadoPago.Pendiente,
            FechaPago = null
        };

        _context.Viajes.Add(viaje);

        await _context.SaveChangesAsync();

        // =========================
        // OBTENER VIAJE CREADO
        // =========================

        var resultado = await _context.Viajes
            .AsNoTracking()
            .Where(v => v.Id == viaje.Id)
            .Select(v => new ViajeDto
            {
                Id = v.Id,
                NumeroGuiaDespacho = v.NumeroGuiaDespacho,
                Fecha = v.Fecha,

                Cliente = new ClienteResumenDto
                {
                    Nombre = v.Cliente.Nombre,
                    Rut = v.Cliente.Rut
                },

                Camion = new CamionResumenDto
                {
                    Marca = v.Camion.Marca,
                    Modelo = v.Camion.Modelo,
                    Patente = v.Camion.Patente
                },

                Conductor = new ConductorResumenDto
                {
                    Rut = v.Conductor.Rut,
                    Nombres = v.Conductor.Nombres,
                    ApellidoPaterno = v.Conductor.ApellidoPaterno,
                    ApellidoMaterno = v.Conductor.ApellidoMaterno
                },

                Remolque = new RemolqueResumenDto
                {
                    Patente = v.Remolque.Patente,
                    Marca = v.Remolque.Marca,
                    Modelo = v.Remolque.Modelo,
                    Tipo = v.Remolque.Tipo,
                    CapacidadToneladas = v.Remolque.CapacidadToneladas,
                    Activa = v.Remolque.Activa
                },

                Origen = v.Origen,
                Destino = v.Destino,
                ComunaOrigen = v.ComunaOrigen,
                ComunaDestino = v.ComunaDestino,
                TipoCarga = v.TipoCarga,

                Kilometros = v.Kilometros,
                Tarifa = v.Tarifa,
                Observaciones = v.Observaciones,

                Estado = v.Estado,
                EstadoPago = v.EstadoPago,
                FechaPago = v.FechaPago
            })
            .FirstAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = resultado.Id },
            resultado);
    }

    // =========================
    // GET: api/viaje
    // =========================

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ViajeDto>>> GetAll()
    {
        var viajes = await _context.Viajes
            .AsNoTracking()
            .OrderByDescending(v => v.Fecha)
            .Select(v => new ViajeDto
            {
                Id = v.Id,
                NumeroGuiaDespacho = v.NumeroGuiaDespacho,
                Fecha = v.Fecha,

                Cliente = new ClienteResumenDto
                {
                    Nombre = v.Cliente.Nombre,
                    Rut = v.Cliente.Rut
                },

                Camion = new CamionResumenDto
                {
                    Marca = v.Camion.Marca,
                    Modelo = v.Camion.Modelo,
                    Patente = v.Camion.Patente
                },

                Conductor = new ConductorResumenDto
                {
                    Rut = v.Conductor.Rut,
                    Nombres = v.Conductor.Nombres,
                    ApellidoPaterno = v.Conductor.ApellidoPaterno,
                    ApellidoMaterno = v.Conductor.ApellidoMaterno
                },

                Remolque = new RemolqueResumenDto
                {
                    Patente = v.Remolque.Patente,
                    Marca = v.Remolque.Marca,
                    Modelo = v.Remolque.Modelo,
                    Tipo = v.Remolque.Tipo,
                    CapacidadToneladas = v.Remolque.CapacidadToneladas,
                    Activa = v.Remolque.Activa
                },

                Origen = v.Origen,
                Destino = v.Destino,
                ComunaOrigen = v.ComunaOrigen,
                ComunaDestino = v.ComunaDestino,
                TipoCarga = v.TipoCarga,

                Kilometros = v.Kilometros,
                Tarifa = v.Tarifa,
                Observaciones = v.Observaciones,

                Estado = v.Estado,
                EstadoPago = v.EstadoPago,
                FechaPago = v.FechaPago
            })
            .ToListAsync();

        return Ok(viajes);
    }

    // =========================
    // GET: api/viaje/{id}
    // =========================

    [HttpGet("{id}")]
    public async Task<ActionResult<ViajeDto>> GetById(int id)
    {
        var viaje = await _context.Viajes
            .AsNoTracking()
            .Where(v => v.Id == id)
            .Select(v => new ViajeDto
            {
                Id = v.Id,
                NumeroGuiaDespacho = v.NumeroGuiaDespacho,
                Fecha = v.Fecha,

                Cliente = new ClienteResumenDto
                {
                    Nombre = v.Cliente.Nombre,
                    Rut = v.Cliente.Rut
                },

                Camion = new CamionResumenDto
                {
                    Marca = v.Camion.Marca,
                    Modelo = v.Camion.Modelo,
                    Patente = v.Camion.Patente
                },

                Conductor = new ConductorResumenDto
                {
                    Rut = v.Conductor.Rut,
                    Nombres = v.Conductor.Nombres,
                    ApellidoPaterno = v.Conductor.ApellidoPaterno,
                    ApellidoMaterno = v.Conductor.ApellidoMaterno
                },

                Remolque = new RemolqueResumenDto
                {
                    Patente = v.Remolque.Patente,
                    Marca = v.Remolque.Marca,
                    Modelo = v.Remolque.Modelo,
                    Tipo = v.Remolque.Tipo,
                    CapacidadToneladas = v.Remolque.CapacidadToneladas,
                    Activa = v.Remolque.Activa
                },

                Origen = v.Origen,
                Destino = v.Destino,
                ComunaOrigen = v.ComunaOrigen,
                ComunaDestino = v.ComunaDestino,
                TipoCarga = v.TipoCarga,

                Kilometros = v.Kilometros,
                Tarifa = v.Tarifa,
                Observaciones = v.Observaciones,

                Estado = v.Estado,
                EstadoPago = v.EstadoPago,
                FechaPago = v.FechaPago
            })
            .FirstOrDefaultAsync();

        if (viaje == null)
        {
            return NotFound();
        }

        return Ok(viaje);
    }

    // =========================
    // PUT: api/viaje/{id}
    // =========================

    [HttpPut("{id}")]
    public async Task<ActionResult<ViajeDto>> Update(
        int id,
        ActualizarViajeDto dto)
    {
        // =========================
        // BUSCAR VIAJE
        // =========================

        var viaje = await _context.Viajes
            .FirstOrDefaultAsync(v => v.Id == id);

        if (viaje == null)
        {
            return NotFound("El viaje indicado no existe.");
        }

        // =========================
        // VALIDAR GUÍA DESPACHO
        // =========================

        if (string.IsNullOrWhiteSpace(dto.NumeroGuiaDespacho))
        {
            return BadRequest("El número de guía de despacho es obligatorio.");
        }

        var numeroGuiaDespacho = dto.NumeroGuiaDespacho.Trim();

        var guiaExiste = await _context.Viajes
            .AnyAsync(v =>
                v.NumeroGuiaDespacho == numeroGuiaDespacho &&
                v.Id != id);

        if (guiaExiste)
        {
            return Conflict("Ya existe otro viaje registrado con ese número de guía de despacho.");
        }

        // =========================
        // VALIDAR CLIENTE
        // =========================

        var clienteExiste = await _context.Clientes
            .AnyAsync(c => c.Id == dto.ClienteId);

        if (!clienteExiste)
        {
            return BadRequest("El cliente indicado no existe.");
        }

        // =========================
        // VALIDAR CAMIÓN
        // =========================

        var camionExiste = await _context.Camiones
            .AnyAsync(c => c.Id == dto.CamionId);

        if (!camionExiste)
        {
            return BadRequest("El camión indicado no existe.");
        }

        // =========================
        // VALIDAR CONDUCTOR
        // =========================

        var conductorExiste = await _context.Conductores
            .AnyAsync(c => c.Id == dto.ConductorId);

        if (!conductorExiste)
        {
            return BadRequest("El conductor indicado no existe.");
        }

        // =========================
        // VALIDAR REMOLQUE
        // =========================

        var remolqueExiste = await _context.Remolques
            .AnyAsync(r => r.Id == dto.RemolqueId);

        if (!remolqueExiste)
        {
            return BadRequest("El remolque indicado no existe.");
        }

        // =========================
        // ACTUALIZAR VIAJE
        // =========================

        viaje.Fecha = dto.Fecha;
        viaje.NumeroGuiaDespacho = numeroGuiaDespacho;

        viaje.ClienteId = dto.ClienteId;
        viaje.CamionId = dto.CamionId;
        viaje.ConductorId = dto.ConductorId;
        viaje.RemolqueId = dto.RemolqueId;

        viaje.Origen = dto.Origen.Trim();
        viaje.Destino = dto.Destino.Trim();
        viaje.ComunaOrigen = dto.ComunaOrigen.Trim();
        viaje.ComunaDestino = dto.ComunaDestino.Trim();
        viaje.TipoCarga = dto.TipoCarga.Trim();

        viaje.Kilometros = dto.Kilometros;
        viaje.Tarifa = dto.Tarifa;

        viaje.Observaciones = dto.Observaciones.Trim();

        viaje.Estado = dto.Estado;
        viaje.EstadoPago = dto.EstadoPago;
        viaje.FechaPago = dto.FechaPago;

        await _context.SaveChangesAsync();

        // =========================
        // OBTENER VIAJE ACTUALIZADO
        // =========================

        var resultado = await _context.Viajes
            .AsNoTracking()
            .Where(v => v.Id == id)
            .Select(v => new ViajeDto
            {
                Id = v.Id,
                NumeroGuiaDespacho = v.NumeroGuiaDespacho,
                Fecha = v.Fecha,

                Cliente = new ClienteResumenDto
                {
                    Nombre = v.Cliente.Nombre,
                    Rut = v.Cliente.Rut
                },

                Camion = new CamionResumenDto
                {
                    Marca = v.Camion.Marca,
                    Modelo = v.Camion.Modelo,
                    Patente = v.Camion.Patente
                },

                Conductor = new ConductorResumenDto
                {
                    Rut = v.Conductor.Rut,
                    Nombres = v.Conductor.Nombres,
                    ApellidoPaterno = v.Conductor.ApellidoPaterno,
                    ApellidoMaterno = v.Conductor.ApellidoMaterno
                },

                Remolque = new RemolqueResumenDto
                {
                    Patente = v.Remolque.Patente,
                    Marca = v.Remolque.Marca,
                    Modelo = v.Remolque.Modelo,
                    Tipo = v.Remolque.Tipo,
                    CapacidadToneladas = v.Remolque.CapacidadToneladas,
                    Activa = v.Remolque.Activa
                },

                Origen = v.Origen,
                Destino = v.Destino,
                ComunaOrigen = v.ComunaOrigen,
                ComunaDestino = v.ComunaDestino,
                TipoCarga = v.TipoCarga,

                Kilometros = v.Kilometros,
                Tarifa = v.Tarifa,
                Observaciones = v.Observaciones,

                Estado = v.Estado,
                EstadoPago = v.EstadoPago,
                FechaPago = v.FechaPago
            })
            .FirstAsync();

        return Ok(resultado);
    }
}