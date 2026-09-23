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

    private static DateTime ConvertirFechaChileAUtc(DateTime fecha)
    {
        var fechaChile = DateTime.SpecifyKind(
            fecha,
            DateTimeKind.Unspecified
        );

        var zonaChile = TimeZoneInfo.FindSystemTimeZoneById(
            "America/Santiago"
        );

        return TimeZoneInfo.ConvertTimeToUtc(
            fechaChile,
            zonaChile
        );
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
            return BadRequest(
                "El número de guía de despacho es obligatorio.");
        }

        var numeroGuiaDespacho =
            dto.NumeroGuiaDespacho.Trim();

        var guiaExiste = await _context.Viajes
            .AnyAsync(v =>
                v.NumeroGuiaDespacho == numeroGuiaDespacho);

        if (guiaExiste)
        {
            return Conflict(
                "Ya existe un viaje registrado con ese número de guía de despacho.");
        }

        // =========================
        // VALIDAR CLIENTE
        // =========================

        var clienteExiste = await _context.Clientes
            .AnyAsync(c => c.Id == dto.ClienteId);

        if (!clienteExiste)
        {
            return BadRequest(
                "El cliente indicado no existe.");
        }

        // =========================
        // VALIDAR CAMIÓN
        // =========================

        var camionExiste = await _context.Camiones
            .AnyAsync(c => c.Id == dto.CamionId);

        if (!camionExiste)
        {
            return BadRequest(
                "El camión indicado no existe.");
        }

        // =========================
        // VALIDAR CONDUCTOR
        // =========================

        var conductorExiste = await _context.Conductores
            .AnyAsync(c => c.Id == dto.ConductorId);

        if (!conductorExiste)
        {
            return BadRequest(
                "El conductor indicado no existe.");
        }

        // =========================
        // VALIDAR REMOLQUE
        // =========================

        var remolqueExiste = await _context.Remolques
            .AnyAsync(r => r.Id == dto.RemolqueId);

        if (!remolqueExiste)
        {
            return BadRequest(
                "El remolque indicado no existe.");
        }

        // =========================
        // CREAR VIAJE
        // =========================

        var viaje = new Viaje
        {
            NumeroGuiaDespacho =
                numeroGuiaDespacho,

            Fecha = ConvertirFechaChileAUtc(
                dto.Fecha
            ),

            ClienteId =
                dto.ClienteId,

            CamionId =
                dto.CamionId,

            ConductorId =
                dto.ConductorId,

            RemolqueId =
                dto.RemolqueId,

            Origen =
                dto.Origen.Trim(),

            Destino =
                dto.Destino.Trim(),

            ComunaOrigen =
                dto.ComunaOrigen.Trim(),

            ComunaDestino =
                dto.ComunaDestino.Trim(),

            TipoCarga =
                dto.TipoCarga.Trim(),

            Kilometros =
                dto.Kilometros,

            LitrosCombustible =
                dto.LitrosCombustible,

            CostoCombustible =
                dto.CostoCombustible,

            Tarifa =
                dto.Tarifa,

            Observaciones =
                dto.Observaciones.Trim(),

            Estado =
                dto.Estado,

            EstadoPago =
                EstadoPago.Pendiente,

            FechaPago =
                null
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
                Id =
                    v.Id,

                NumeroGuiaDespacho =
                    v.NumeroGuiaDespacho,

                Fecha =
                    v.Fecha,

                Cliente = new ClienteResumenDto
                {
                    Nombre =
                        v.Cliente.Nombre,

                    Rut =
                        v.Cliente.Rut
                },

                Camion = new CamionResumenDto
                {
                    Marca =
                        v.Camion.Marca,

                    Modelo =
                        v.Camion.Modelo,

                    Patente =
                        v.Camion.Patente
                },

                Conductor = new ConductorResumenDto
                {
                    Rut =
                        v.Conductor.Rut,

                    Nombres =
                        v.Conductor.Nombres,

                    ApellidoPaterno =
                        v.Conductor.ApellidoPaterno,

                    ApellidoMaterno =
                        v.Conductor.ApellidoMaterno
                },

                Remolque = new RemolqueResumenDto
                {
                    Patente =
                        v.Remolque.Patente,

                    Marca =
                        v.Remolque.Marca,

                    Modelo =
                        v.Remolque.Modelo,

                    Tipo =
                        v.Remolque.Tipo,

                    CapacidadToneladas =
                        v.Remolque.CapacidadToneladas,

                    Activa =
                        v.Remolque.Activa
                },

                Origen =
                    v.Origen,

                Destino =
                    v.Destino,

                ComunaOrigen =
                    v.ComunaOrigen,

                ComunaDestino =
                    v.ComunaDestino,

                TipoCarga =
                    v.TipoCarga,

                Kilometros =
                    v.Kilometros,

                LitrosCombustible =
                    v.LitrosCombustible,

                CostoCombustible =
                    v.CostoCombustible,

                Tarifa =
                    v.Tarifa,

                Observaciones =
                    v.Observaciones,

                Estado =
                    v.Estado,

                EstadoPago =
                    v.EstadoPago,

                FechaPago =
                    v.FechaPago
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
    public async Task<ActionResult<IEnumerable<ViajeDto>>> GetAll(
        [FromQuery] string? guia,
        [FromQuery] DateTime? fechaDesde,
        [FromQuery] DateTime? fechaHasta,
        [FromQuery] int? clienteId,
        [FromQuery] EstadoPago? estadoPago)
    {
        // =========================
        // CONSULTA BASE
        // =========================

        var query = _context.Viajes
            .AsNoTracking()
            .AsQueryable();

        // =========================
        // FILTRO POR GUÍA
        // =========================

        if (!string.IsNullOrWhiteSpace(guia))
        {
            var guiaBusqueda = guia.Trim();

            query = query.Where(v =>
                v.NumeroGuiaDespacho.Contains(
                    guiaBusqueda));
        }

        // =========================
        // FILTRO FECHA DESDE
        // =========================

        if (fechaDesde.HasValue)
        {
            var inicio = ConvertirFechaChileAUtc(
                fechaDesde.Value.Date
            );

            query = query.Where(v =>
                v.Fecha >= inicio);
        }

        // =========================
        // FILTRO FECHA HASTA
        // =========================

        if (fechaHasta.HasValue)
        {
            var fin = ConvertirFechaChileAUtc(
                fechaHasta.Value.Date.AddDays(1)
            );

            query = query.Where(v =>
                v.Fecha < fin);
        }

        // =========================
        // FILTRO POR CLIENTE
        // =========================

        if (clienteId.HasValue)
        {
            query = query.Where(v =>
                v.ClienteId == clienteId.Value);
        }

        // =========================
        // FILTRO POR ESTADO DE PAGO
        // =========================

        if (estadoPago.HasValue)
        {
            query = query.Where(v =>
                v.EstadoPago == estadoPago.Value);
        }

        // =========================
        // OBTENER RESULTADOS
        // =========================

        var viajes = await query
            .OrderByDescending(v => v.Fecha)
            .Select(v => new ViajeDto
            {
                Id =
                    v.Id,

                NumeroGuiaDespacho =
                    v.NumeroGuiaDespacho,

                Fecha =
                    v.Fecha,

                Cliente = new ClienteResumenDto
                {
                    Nombre =
                        v.Cliente.Nombre,

                    Rut =
                        v.Cliente.Rut
                },

                Camion = new CamionResumenDto
                {
                    Marca =
                        v.Camion.Marca,

                    Modelo =
                        v.Camion.Modelo,

                    Patente =
                        v.Camion.Patente
                },

                Conductor = new ConductorResumenDto
                {
                    Rut =
                        v.Conductor.Rut,

                    Nombres =
                        v.Conductor.Nombres,

                    ApellidoPaterno =
                        v.Conductor.ApellidoPaterno,

                    ApellidoMaterno =
                        v.Conductor.ApellidoMaterno
                },

                Remolque = new RemolqueResumenDto
                {
                    Patente =
                        v.Remolque.Patente,

                    Marca =
                        v.Remolque.Marca,

                    Modelo =
                        v.Remolque.Modelo,

                    Tipo =
                        v.Remolque.Tipo,

                    CapacidadToneladas =
                        v.Remolque.CapacidadToneladas,

                    Activa =
                        v.Remolque.Activa
                },

                Origen =
                    v.Origen,

                Destino =
                    v.Destino,

                ComunaOrigen =
                    v.ComunaOrigen,

                ComunaDestino =
                    v.ComunaDestino,

                TipoCarga =
                    v.TipoCarga,

                Kilometros =
                    v.Kilometros,

                LitrosCombustible =
                    v.LitrosCombustible,

                CostoCombustible =
                    v.CostoCombustible,

                Tarifa =
                    v.Tarifa,

                Observaciones =
                    v.Observaciones,

                Estado =
                    v.Estado,

                EstadoPago =
                    v.EstadoPago,

                FechaPago =
                    v.FechaPago
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
                Id =
                    v.Id,

                NumeroGuiaDespacho =
                    v.NumeroGuiaDespacho,

                Fecha =
                    v.Fecha,

                Cliente = new ClienteResumenDto
                {
                    Nombre =
                        v.Cliente.Nombre,

                    Rut =
                        v.Cliente.Rut
                },

                Camion = new CamionResumenDto
                {
                    Marca =
                        v.Camion.Marca,

                    Modelo =
                        v.Camion.Modelo,

                    Patente =
                        v.Camion.Patente
                },

                Conductor = new ConductorResumenDto
                {
                    Rut =
                        v.Conductor.Rut,

                    Nombres =
                        v.Conductor.Nombres,

                    ApellidoPaterno =
                        v.Conductor.ApellidoPaterno,

                    ApellidoMaterno =
                        v.Conductor.ApellidoMaterno
                },

                Remolque = new RemolqueResumenDto
                {
                    Patente =
                        v.Remolque.Patente,

                    Marca =
                        v.Remolque.Marca,

                    Modelo =
                        v.Remolque.Modelo,

                    Tipo =
                        v.Remolque.Tipo,

                    CapacidadToneladas =
                        v.Remolque.CapacidadToneladas,

                    Activa =
                        v.Remolque.Activa
                },

                Origen =
                    v.Origen,

                Destino =
                    v.Destino,

                ComunaOrigen =
                    v.ComunaOrigen,

                ComunaDestino =
                    v.ComunaDestino,

                TipoCarga =
                    v.TipoCarga,

                Kilometros =
                    v.Kilometros,

                LitrosCombustible =
                    v.LitrosCombustible,

                CostoCombustible =
                    v.CostoCombustible,

                Tarifa =
                    v.Tarifa,

                Observaciones =
                    v.Observaciones,

                Estado =
                    v.Estado,

                EstadoPago =
                    v.EstadoPago,

                FechaPago =
                    v.FechaPago
            })
            .FirstOrDefaultAsync();

        if (viaje == null)
        {
            return NotFound();
        }

        return Ok(viaje);
    }

    // ELIMINAR VIAJE
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var viaje = await _context.Viajes
            .FirstOrDefaultAsync(v => v.Id == id);

        if (viaje == null)
        {
            return NotFound("El viaje no existe.");
        }

        if (viaje.EstadoPago == EstadoPago.Pagado)
        {
            return Conflict(
                "No se puede eliminar un viaje que ya fue pagado."
            );
        }

        _context.Viajes.Remove(viaje);

        await _context.SaveChangesAsync();

        return NoContent();
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
            return NotFound(
                "El viaje indicado no existe.");
        }

        // =========================
        // VALIDAR GUÍA DESPACHO
        // =========================

        if (string.IsNullOrWhiteSpace(
            dto.NumeroGuiaDespacho))
        {
            return BadRequest(
                "El número de guía de despacho es obligatorio.");
        }

        var numeroGuiaDespacho =
            dto.NumeroGuiaDespacho.Trim();

        var guiaExiste = await _context.Viajes
            .AnyAsync(v =>
                v.NumeroGuiaDespacho ==
                    numeroGuiaDespacho &&
                v.Id != id);

        if (guiaExiste)
        {
            return Conflict(
                "Ya existe otro viaje registrado con ese número de guía de despacho.");
        }

        // =========================
        // VALIDAR CLIENTE
        // =========================

        var clienteExiste = await _context.Clientes
            .AnyAsync(c =>
                c.Id == dto.ClienteId);

        if (!clienteExiste)
        {
            return BadRequest(
                "El cliente indicado no existe.");
        }

        // =========================
        // VALIDAR CAMIÓN
        // =========================

        var camionExiste = await _context.Camiones
            .AnyAsync(c =>
                c.Id == dto.CamionId);

        if (!camionExiste)
        {
            return BadRequest(
                "El camión indicado no existe.");
        }

        // =========================
        // VALIDAR CONDUCTOR
        // =========================

        var conductorExiste = await _context.Conductores
            .AnyAsync(c =>
                c.Id == dto.ConductorId);

        if (!conductorExiste)
        {
            return BadRequest(
                "El conductor indicado no existe.");
        }

        // =========================
        // VALIDAR REMOLQUE
        // =========================

        var remolqueExiste = await _context.Remolques
            .AnyAsync(r =>
                r.Id == dto.RemolqueId);

        if (!remolqueExiste)
        {
            return BadRequest(
                "El remolque indicado no existe.");
        }

        // =========================
        // ACTUALIZAR VIAJE
        // =========================

        viaje.Fecha =
            ConvertirFechaChileAUtc(
                dto.Fecha
            );

        viaje.NumeroGuiaDespacho =
            numeroGuiaDespacho;

        viaje.ClienteId =
            dto.ClienteId;

        viaje.CamionId =
            dto.CamionId;

        viaje.ConductorId =
            dto.ConductorId;

        viaje.RemolqueId =
            dto.RemolqueId;

        viaje.Origen =
            dto.Origen.Trim();

        viaje.Destino =
            dto.Destino.Trim();

        viaje.ComunaOrigen =
            dto.ComunaOrigen.Trim();

        viaje.ComunaDestino =
            dto.ComunaDestino.Trim();

        viaje.TipoCarga =
            dto.TipoCarga.Trim();

        viaje.Kilometros =
            dto.Kilometros;

        viaje.LitrosCombustible =
            dto.LitrosCombustible;

        viaje.CostoCombustible =
            dto.CostoCombustible;

        viaje.Tarifa =
            dto.Tarifa;

        viaje.Observaciones =
            dto.Observaciones.Trim();

        viaje.Estado =
            dto.Estado;

        await _context.SaveChangesAsync();

        // =========================
        // OBTENER VIAJE ACTUALIZADO
        // =========================

        var resultado = await _context.Viajes
            .AsNoTracking()
            .Where(v => v.Id == id)
            .Select(v => new ViajeDto
            {
                Id =
                    v.Id,

                NumeroGuiaDespacho =
                    v.NumeroGuiaDespacho,

                Fecha =
                    v.Fecha,

                Cliente = new ClienteResumenDto
                {
                    Nombre =
                        v.Cliente.Nombre,

                    Rut =
                        v.Cliente.Rut
                },

                Camion = new CamionResumenDto
                {
                    Marca =
                        v.Camion.Marca,

                    Modelo =
                        v.Camion.Modelo,

                    Patente =
                        v.Camion.Patente
                },

                Conductor = new ConductorResumenDto
                {
                    Rut =
                        v.Conductor.Rut,

                    Nombres =
                        v.Conductor.Nombres,

                    ApellidoPaterno =
                        v.Conductor.ApellidoPaterno,

                    ApellidoMaterno =
                        v.Conductor.ApellidoMaterno
                },

                Remolque = new RemolqueResumenDto
                {
                    Patente =
                        v.Remolque.Patente,

                    Marca =
                        v.Remolque.Marca,

                    Modelo =
                        v.Remolque.Modelo,

                    Tipo =
                        v.Remolque.Tipo,

                    CapacidadToneladas =
                        v.Remolque.CapacidadToneladas,

                    Activa =
                        v.Remolque.Activa
                },

                Origen =
                    v.Origen,

                Destino =
                    v.Destino,

                ComunaOrigen =
                    v.ComunaOrigen,

                ComunaDestino =
                    v.ComunaDestino,

                TipoCarga =
                    v.TipoCarga,

                Kilometros =
                    v.Kilometros,

                LitrosCombustible =
                    v.LitrosCombustible,

                CostoCombustible =
                    v.CostoCombustible,

                Tarifa =
                    v.Tarifa,

                Observaciones =
                    v.Observaciones,

                Estado =
                    v.Estado,

                EstadoPago =
                    v.EstadoPago,

                FechaPago =
                    v.FechaPago
            })
            .FirstAsync();

        return Ok(resultado);
    }

    // =========================
    // PATCH: api/viaje/{id}/completar
    // =========================

    [HttpPatch("{id}/completar")]
    public async Task<ActionResult<ViajeDto>> Completar(int id)
    {
        // =========================
        // BUSCAR VIAJE
        // =========================

        var viaje = await _context.Viajes
            .FirstOrDefaultAsync(v => v.Id == id);

        if (viaje == null)
        {
            return NotFound(
                "El viaje indicado no existe.");
        }

        // =========================
        // VALIDAR ESTADO ACTUAL
        // =========================

        if (
            viaje.Estado != EstadoViaje.Pendiente &&
            viaje.Estado != EstadoViaje.EnCurso)
        {
            return BadRequest(
                "Solo se pueden completar viajes en estado Pendiente o En Curso.");
        }

        // =========================
        // MARCAR COMO COMPLETADO
        // =========================

        viaje.Estado =
            EstadoViaje.Completado;

        // IMPORTANTE:
        // No modificamos EstadoPago
        // ni FechaPago.

        await _context.SaveChangesAsync();

        // =========================
        // OBTENER VIAJE ACTUALIZADO
        // =========================

        var resultado = await _context.Viajes
            .AsNoTracking()
            .Where(v => v.Id == id)
            .Select(v => new ViajeDto
            {
                Id =
                    v.Id,

                NumeroGuiaDespacho =
                    v.NumeroGuiaDespacho,

                Fecha =
                    v.Fecha,

                Cliente = new ClienteResumenDto
                {
                    Nombre =
                        v.Cliente.Nombre,

                    Rut =
                        v.Cliente.Rut
                },

                Camion = new CamionResumenDto
                {
                    Marca =
                        v.Camion.Marca,

                    Modelo =
                        v.Camion.Modelo,

                    Patente =
                        v.Camion.Patente
                },

                Conductor = new ConductorResumenDto
                {
                    Rut =
                        v.Conductor.Rut,

                    Nombres =
                        v.Conductor.Nombres,

                    ApellidoPaterno =
                        v.Conductor.ApellidoPaterno,

                    ApellidoMaterno =
                        v.Conductor.ApellidoMaterno
                },

                Remolque = new RemolqueResumenDto
                {
                    Patente =
                        v.Remolque.Patente,

                    Marca =
                        v.Remolque.Marca,

                    Modelo =
                        v.Remolque.Modelo,

                    Tipo =
                        v.Remolque.Tipo,

                    CapacidadToneladas =
                        v.Remolque.CapacidadToneladas,

                    Activa =
                        v.Remolque.Activa
                },

                Origen =
                    v.Origen,

                Destino =
                    v.Destino,

                ComunaOrigen =
                    v.ComunaOrigen,

                ComunaDestino =
                    v.ComunaDestino,

                TipoCarga =
                    v.TipoCarga,

                Kilometros =
                    v.Kilometros,

                LitrosCombustible =
                    v.LitrosCombustible,

                CostoCombustible =
                    v.CostoCombustible,

                Tarifa =
                    v.Tarifa,

                Observaciones =
                    v.Observaciones,

                Estado =
                    v.Estado,

                EstadoPago =
                    v.EstadoPago,

                FechaPago =
                    v.FechaPago
            })
            .FirstAsync();

        return Ok(resultado);
    }

    // =========================
    // PATCH: api/viaje/{id}/pagar
    // =========================

    [HttpPatch("{id}/pagar")]
    public async Task<ActionResult<ViajeDto>> Pagar(int id)
    {
        var viaje = await _context.Viajes
            .FirstOrDefaultAsync(v => v.Id == id);

        if (viaje == null)
        {
            return NotFound(
                "El viaje indicado no existe.");
        }

        if (viaje.EstadoPago == EstadoPago.Pagado)
        {
            return BadRequest(
                "El viaje ya se encuentra marcado como pagado.");
        }

        viaje.EstadoPago = EstadoPago.Pagado;

        viaje.FechaPago = DateTime.UtcNow;

        await _context.SaveChangesAsync();

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
                LitrosCombustible = v.LitrosCombustible,
                CostoCombustible = v.CostoCombustible,
                Tarifa = v.Tarifa,
                Observaciones = v.Observaciones,
                Estado = v.Estado,
                EstadoPago = v.EstadoPago,
                FechaPago = v.FechaPago
            })
            .FirstAsync();

        return Ok(resultado);
    }

    /// <summary>
    /// Marca múltiples viajes como pagados utilizando sus números de guía.
    /// </summary>
    [HttpPatch("pagar-masivo")]
    public async Task<ActionResult> PagarMasivo(
        [FromBody] PagarViajesMasivoDto dto)
    {
        if (
            dto.NumerosGuiaDespacho == null ||
            dto.NumerosGuiaDespacho.Count == 0)
        {
            return BadRequest(
                "Debe seleccionar al menos un viaje."
            );
        }

        var guias = dto.NumerosGuiaDespacho
            .Where(g => !string.IsNullOrWhiteSpace(g))
            .Select(g => g.Trim())
            .Distinct()
            .ToList();

        if (guias.Count == 0)
        {
            return BadRequest(
                "Debe indicar al menos un número de guía válido."
            );
        }

        var viajes = await _context.Viajes
            .Where(v =>
                guias.Contains(v.NumeroGuiaDespacho))
            .ToListAsync();

        if (viajes.Count != guias.Count)
        {
            var guiasEncontradas = viajes
                .Select(v => v.NumeroGuiaDespacho)
                .ToHashSet();

            var guiasNoEncontradas = guias
                .Where(g => !guiasEncontradas.Contains(g))
                .ToList();

            return BadRequest(new
            {
                mensaje = "Una o más guías no existen.",
                guiasNoEncontradas
            });
        }

        var viajesYaPagados = viajes
            .Where(v =>
                v.EstadoPago == EstadoPago.Pagado)
            .Select(v => v.NumeroGuiaDespacho)
            .ToList();

        if (viajesYaPagados.Count > 0)
        {
            return BadRequest(new
            {
                mensaje =
                    "Una o más guías ya se encuentran pagadas.",
                guiasYaPagadas = viajesYaPagados
            });
        }

        var fechaPago = DateTime.UtcNow;

        foreach (var viaje in viajes)
        {
            viaje.EstadoPago = EstadoPago.Pagado;
            viaje.FechaPago = fechaPago;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            cantidad = viajes.Count,
            guias = viajes
                .Select(v => v.NumeroGuiaDespacho)
                .ToList(),
            fechaPago
        });
    }

    /// <summary>
    /// Obtiene los viajes pendientes de pago.
    /// Permite filtrar opcionalmente por cliente.
    /// </summary>
    [HttpGet("pendientes-pago")]
    public async Task<ActionResult<IEnumerable<ViajeDto>>> ObtenerPendientesPago(
        [FromQuery] int? clienteId)
    {
        var query = _context.Viajes
            .AsNoTracking()
            .Where(v =>
                v.EstadoPago == EstadoPago.Pendiente)
            .AsQueryable();

        if (clienteId.HasValue)
        {
            query = query.Where(v =>
                v.ClienteId == clienteId.Value);
        }

        var viajes = await query
            .OrderBy(v => v.Fecha)
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
                LitrosCombustible = v.LitrosCombustible,
                CostoCombustible = v.CostoCombustible,
                Tarifa = v.Tarifa,
                Observaciones = v.Observaciones,
                Estado = v.Estado,
                EstadoPago = v.EstadoPago,
                FechaPago = v.FechaPago
            })
            .ToListAsync();

        return Ok(viajes);
    }
}