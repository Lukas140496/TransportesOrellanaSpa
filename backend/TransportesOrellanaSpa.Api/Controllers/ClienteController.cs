using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.DTOs;
using TransportesOrellanaSpa.Api.Models;

namespace TransportesOrellanaSpa.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClienteController : ControllerBase
{
    private readonly AppDbContext _context;

    public ClienteController(AppDbContext context)
    {
        _context = context;
    }

    // =========================
    // POST: api/cliente
    // =========================

    [HttpPost]
    public async Task<ActionResult<ClienteDto>> Create(CrearClienteDto dto)
    {
        // =========================
        // VALIDAR DATOS
        // =========================

        if (string.IsNullOrWhiteSpace(dto.Nombre))
        {
            return BadRequest("El nombre del cliente es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(dto.Rut))
        {
            return BadRequest("El RUT del cliente es obligatorio.");
        }

        if (dto.Tarifa < 0)
        {
            return BadRequest("La tarifa no puede ser negativa.");
        }

        // =========================
        // NORMALIZAR DATOS
        // =========================

        var nombre = dto.Nombre.Trim();
        var rut = dto.Rut.Trim();
        var direccion = dto.Direccion.Trim();
        var comuna = dto.Comuna.Trim();
        var ciudad = dto.Ciudad.Trim();
        var tipoCarga = dto.TipoCarga.Trim();
        var observaciones = dto.Observaciones.Trim();

        // =========================
        // VALIDAR RUT ÚNICO
        // =========================

        var rutExiste = await _context.Clientes
            .AnyAsync(c => c.Rut == rut);

        if (rutExiste)
        {
            return Conflict("Ya existe un cliente registrado con ese RUT.");
        }

        // =========================
        // CREAR CLIENTE
        // =========================

        var cliente = new Cliente
        {
            Nombre = nombre,
            Rut = rut,
            Direccion = direccion,
            Comuna = comuna,
            Ciudad = ciudad,
            Tarifa = dto.Tarifa,
            TipoCarga = tipoCarga,
            Activo = true,
            Observaciones = observaciones
        };

        _context.Clientes.Add(cliente);

        await _context.SaveChangesAsync();

        // =========================
        // CREAR RESPUESTA
        // =========================

        var resultado = new ClienteDto
        {
            Id = cliente.Id,
            Nombre = cliente.Nombre,
            Rut = cliente.Rut,
            Direccion = cliente.Direccion,
            Comuna = cliente.Comuna,
            Ciudad = cliente.Ciudad,
            Tarifa = cliente.Tarifa,
            TipoCarga = cliente.TipoCarga,
            Activo = cliente.Activo,
            Observaciones = cliente.Observaciones
        };

        return CreatedAtAction(
            nameof(GetById),
            new { id = resultado.Id },
            resultado);
    }

    // =========================
    // GET: api/cliente
    // =========================

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClienteDto>>> GetAll()
    {
        var clientes = await _context.Clientes
            .AsNoTracking()
            .OrderBy(c => c.Nombre)
            .Select(c => new ClienteDto
            {
                Id = c.Id,
                Nombre = c.Nombre,
                Rut = c.Rut,
                Direccion = c.Direccion,
                Comuna = c.Comuna,
                Ciudad = c.Ciudad,
                Tarifa = c.Tarifa,
                TipoCarga = c.TipoCarga,
                Activo = c.Activo,
                Observaciones = c.Observaciones
            })
            .ToListAsync();

        return Ok(clientes);
    }

    // =========================
    // GET: api/cliente/{id}
    // =========================

    [HttpGet("{id}")]
    public async Task<ActionResult<ClienteDto>> GetById(int id)
    {
        var cliente = await _context.Clientes
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new ClienteDto
            {
                Id = c.Id,
                Nombre = c.Nombre,
                Rut = c.Rut,
                Direccion = c.Direccion,
                Comuna = c.Comuna,
                Ciudad = c.Ciudad,
                Tarifa = c.Tarifa,
                TipoCarga = c.TipoCarga,
                Activo = c.Activo,
                Observaciones = c.Observaciones
            })
            .FirstOrDefaultAsync();

        if (cliente == null)
        {
            return NotFound("El cliente indicado no existe.");
        }

        return Ok(cliente);
    }

    // =========================
    // PUT: api/cliente/{id}
    // =========================

    [HttpPut("{id}")]
    public async Task<ActionResult<ClienteDto>> Update(
        int id,
        ActualizarClienteDto dto)
    {
        // =========================
        // BUSCAR CLIENTE
        // =========================

        var cliente = await _context.Clientes
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cliente == null)
        {
            return NotFound("El cliente indicado no existe.");
        }

        // =========================
        // VALIDAR DATOS
        // =========================

        if (string.IsNullOrWhiteSpace(dto.Nombre))
        {
            return BadRequest("El nombre del cliente es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(dto.Rut))
        {
            return BadRequest("El RUT del cliente es obligatorio.");
        }

        if (dto.Tarifa < 0)
        {
            return BadRequest("La tarifa no puede ser negativa.");
        }

        // =========================
        // NORMALIZAR DATOS
        // =========================

        var rut = dto.Rut.Trim();

        // =========================
        // VALIDAR RUT ÚNICO
        // =========================

        var rutExiste = await _context.Clientes
            .AnyAsync(c => c.Rut == rut && c.Id != id);

        if (rutExiste)
        {
            return Conflict("Ya existe otro cliente registrado con ese RUT.");
        }

        // =========================
        // ACTUALIZAR CLIENTE
        // =========================

        cliente.Nombre = dto.Nombre.Trim();
        cliente.Rut = rut;
        cliente.Direccion = dto.Direccion.Trim();
        cliente.Comuna = dto.Comuna.Trim();
        cliente.Ciudad = dto.Ciudad.Trim();
        cliente.Tarifa = dto.Tarifa;
        cliente.TipoCarga = dto.TipoCarga.Trim();
        cliente.Activo = dto.Activo;
        cliente.Observaciones = dto.Observaciones.Trim();

        await _context.SaveChangesAsync();

        // =========================
        // RESPUESTA
        // =========================

        var resultado = new ClienteDto
        {
            Id = cliente.Id,
            Nombre = cliente.Nombre,
            Rut = cliente.Rut,
            Direccion = cliente.Direccion,
            Comuna = cliente.Comuna,
            Ciudad = cliente.Ciudad,
            Tarifa = cliente.Tarifa,
            TipoCarga = cliente.TipoCarga,
            Activo = cliente.Activo,
            Observaciones = cliente.Observaciones
        };

        return Ok(resultado);
    }
}