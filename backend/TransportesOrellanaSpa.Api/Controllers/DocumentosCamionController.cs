
using Azure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Authorization;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.Models;
using TransportesOrellanaSpa.Api.Services;

namespace TransportesOrellanaSpa.Api.Controllers;

[ApiController]
[Route("api/camion/{camionId:int}/documentos")]
public class DocumentosCamionController : ControllerBase
{
    private const long TamanoMaximoArchivo = 10 * 1024 * 1024;

    private readonly AppDbContext _context;
    private readonly AzureBlobStorageService _blobStorage;

    public DocumentosCamionController(
        AppDbContext context,
        AzureBlobStorageService blobStorage)
    {
        _context = context;
        _blobStorage = blobStorage;
    }

    private static readonly Dictionary<string, string> TiposPermitidos =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["PermisoCirculacion"] = "PermisoCirculacion",
            ["SeguroObligatorio"] = "SeguroObligatorio",
            ["RevisionTecnica"] = "RevisionTecnica",
            ["RevisionGases"] = "RevisionGases"
        };

    private static readonly Dictionary<string, string> ExtensionesPermitidas =
        new(StringComparer.OrdinalIgnoreCase)
        {
            [".pdf"] = "application/pdf",
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png"
        };

    // GET: api/camion/1/documentos
    [RequirePermission("CAMIONES_VER")]
    [HttpGet]
    public async Task<IActionResult> Listar(
        int camionId,
        CancellationToken cancellationToken)
    {
        var camionExiste = await _context.Camiones
            .AnyAsync(c => c.Id == camionId, cancellationToken);

        if (!camionExiste)
        {
            return NotFound("No existe el camión solicitado.");
        }

        var documentos = await _context.DocumentosCamion
            .AsNoTracking()
            .Where(d => d.CamionId == camionId)
            .OrderBy(d => d.TipoDocumento)
            .Select(d => new
            {
                d.Id,
                d.CamionId,
                d.TipoDocumento,
                d.NombreArchivo,
                d.ContentType,
                d.FechaCarga
            })
            .ToListAsync(cancellationToken);

        return Ok(documentos);
    }

    // POST: api/camion/1/documentos/PermisoCirculacion
    [RequirePermission("CAMIONES_EDITAR")]
    [HttpPost("{tipoDocumento}")]
    [RequestSizeLimit(TamanoMaximoArchivo + 1024 * 1024)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> SubirOReemplazar(
        int camionId,
        string tipoDocumento,
        IFormFile archivo,
        CancellationToken cancellationToken)
    {
        if (!TiposPermitidos.TryGetValue(
                tipoDocumento,
                out var tipoNormalizado))
        {
            return BadRequest(
                "Tipo de documento no válido. Tipos permitidos: " +
                "PermisoCirculacion, SeguroObligatorio, " +
                "RevisionTecnica y RevisionGases.");
        }

        if (archivo == null || archivo.Length == 0)
        {
            return BadRequest("Debes seleccionar un archivo.");
        }

        if (archivo.Length > TamanoMaximoArchivo)
        {
            return BadRequest(
                "El archivo supera el tamaño máximo permitido de 10 MB.");
        }

        var extension = Path.GetExtension(archivo.FileName);

        if (!ExtensionesPermitidas.TryGetValue(
                extension,
                out var contentType))
        {
            return BadRequest(
                "Formato no permitido. Utiliza archivos PDF, JPG o PNG.");
        }

        var camionExiste = await _context.Camiones
            .AnyAsync(c => c.Id == camionId, cancellationToken);

        if (!camionExiste)
        {
            return NotFound("No existe el camión solicitado.");
        }

        var documentoExistente = await _context.DocumentosCamion
            .FirstOrDefaultAsync(
                d => d.CamionId == camionId
                    && d.TipoDocumento == tipoNormalizado,
                cancellationToken);

        var nombreArchivo = Path.GetFileName(archivo.FileName);

        // El nombre interno no depende del nombre original del archivo.
        var blobName =
            $"camion-{camionId}/{tipoNormalizado}/{Guid.NewGuid():N}{extension.ToLowerInvariant()}";

        // Primero subimos el nuevo archivo a Blob Storage.
        await using (var stream = archivo.OpenReadStream())
        {
            await _blobStorage.SubirArchivoAsync(
                stream,
                blobName,
                contentType,
                cancellationToken);
        }

        var blobAnterior = documentoExistente?.BlobName;

        try
        {
            if (documentoExistente == null)
            {
                var nuevoDocumento = new DocumentoCamion
                {
                    CamionId = camionId,
                    TipoDocumento = tipoNormalizado,
                    NombreArchivo = nombreArchivo,
                    BlobName = blobName,
                    ContentType = contentType,
                    FechaCarga = DateTime.UtcNow
                };

                _context.DocumentosCamion.Add(nuevoDocumento);
            }
            else
            {
                documentoExistente.NombreArchivo = nombreArchivo;
                documentoExistente.BlobName = blobName;
                documentoExistente.ContentType = contentType;
                documentoExistente.FechaCarga = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            // Si falla la base de datos, intentamos retirar el archivo nuevo.
            try
            {
                await _blobStorage.EliminarArchivoAsync(
                    blobName,
                    cancellationToken);
            }
            catch
            {
                // No ocultamos el error original de la base de datos.
            }

            throw;
        }

        // Eliminamos la versión anterior solamente después de guardar
        // correctamente la referencia al nuevo archivo.
        if (!string.IsNullOrWhiteSpace(blobAnterior))
        {
            try
            {
                await _blobStorage.EliminarArchivoAsync(
                    blobAnterior,
                    cancellationToken);
            }
            catch (RequestFailedException)
            {
                // La referencia nueva ya está guardada.
                // El archivo anterior podría quedar huérfano en Storage.
            }
        }

        var resultado = await _context.DocumentosCamion
            .AsNoTracking()
            .Where(d => d.CamionId == camionId
                && d.TipoDocumento == tipoNormalizado)
            .Select(d => new
            {
                d.Id,
                d.CamionId,
                d.TipoDocumento,
                d.NombreArchivo,
                d.ContentType,
                d.FechaCarga
            })
            .FirstAsync(cancellationToken);

        return Ok(resultado);
    }

    // GET: api/camion/1/documentos/PermisoCirculacion
    [RequirePermission("CAMIONES_VER")]
    [HttpGet("{tipoDocumento}")]
    public async Task<IActionResult> Descargar(
        int camionId,
        string tipoDocumento,
        CancellationToken cancellationToken)
    {
        if (!TiposPermitidos.TryGetValue(
                tipoDocumento,
                out var tipoNormalizado))
        {
            return BadRequest("Tipo de documento no válido.");
        }

        var documento = await _context.DocumentosCamion
            .AsNoTracking()
            .FirstOrDefaultAsync(
                d => d.CamionId == camionId
                    && d.TipoDocumento == tipoNormalizado,
                cancellationToken);

        if (documento == null)
        {
            return NotFound(
                "El camión no tiene cargado ese documento.");
        }

        try
        {
            var stream = await _blobStorage.DescargarArchivoAsync(
                documento.BlobName,
                cancellationToken);

            // El contenido se entrega a través de la API.
            // No se expone la URL del contenedor.
            return File(
                stream,
                documento.ContentType,
                documento.NombreArchivo);
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            return NotFound(
                "El registro existe, pero el archivo no está disponible en Storage.");
        }
    }

    // DELETE: api/camion/1/documentos/PermisoCirculacion
    [RequirePermission("CAMIONES_EDITAR")]
    [HttpDelete("{tipoDocumento}")]
    public async Task<IActionResult> Eliminar(
        int camionId,
        string tipoDocumento,
        CancellationToken cancellationToken)
    {
        if (!TiposPermitidos.TryGetValue(
                tipoDocumento,
                out var tipoNormalizado))
        {
            return BadRequest("Tipo de documento no válido.");
        }

        var documento = await _context.DocumentosCamion
            .FirstOrDefaultAsync(
                d => d.CamionId == camionId
                    && d.TipoDocumento == tipoNormalizado,
                cancellationToken);

        if (documento == null)
        {
            return NotFound(
                "El camión no tiene cargado ese documento.");
        }

        var blobName = documento.BlobName;

        // Quitamos primero la referencia de la base de datos.
        _context.DocumentosCamion.Remove(documento);

        await _context.SaveChangesAsync(cancellationToken);

        try
        {
            await _blobStorage.EliminarArchivoAsync(
                blobName,
                cancellationToken);
        }
        catch (RequestFailedException)
        {
            return StatusCode(
                StatusCodes.Status502BadGateway,
                "El registro se eliminó, pero no se pudo confirmar " +
                "la eliminación del archivo en Azure Blob Storage.");
        }

        return NoContent();
    }
}
