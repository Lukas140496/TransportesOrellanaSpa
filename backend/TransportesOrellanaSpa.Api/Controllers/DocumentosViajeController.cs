
using Azure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Authorization;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.Models;
using TransportesOrellanaSpa.Api.Services;

namespace TransportesOrellanaSpa.Api.Controllers;

[ApiController]
[Route("api/viaje/{viajeId:int}/documentos")]
public class DocumentosViajeController : ControllerBase
{
    private const long TamanoMaximoArchivo = 10 * 1024 * 1024;
    private const string ContenedorDocumentos = "documentacion-viajes";

    private readonly AppDbContext _context;
    private readonly AzureBlobStorageService _blobStorage;

    public DocumentosViajeController(
        AppDbContext context,
        AzureBlobStorageService blobStorage)
    {
        _context = context;
        _blobStorage = blobStorage;
    }

    private static readonly Dictionary<string, TipoDocumentoViaje>
        TiposPermitidos = new(StringComparer.OrdinalIgnoreCase)
        {
            ["GuiaDespacho"] = TipoDocumentoViaje.GuiaDespacho,
            ["RendicionGuias"] = TipoDocumentoViaje.RendicionGuias
        };

    private static readonly Dictionary<string, string>
        ExtensionesPermitidas = new(StringComparer.OrdinalIgnoreCase)
        {
            [".pdf"] = "application/pdf",
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png"
        };

    // GET: api/viaje/1/documentos
    [RequirePermission("VIAJES_VER")]
    [HttpGet]
    public async Task<IActionResult> Listar(
        int viajeId,
        CancellationToken cancellationToken)
    {
        var viajeExiste = await _context.Viajes
            .AnyAsync(v => v.Id == viajeId, cancellationToken);

        if (!viajeExiste)
        {
            return NotFound("No existe el viaje solicitado.");
        }

        var documentos = await _context.DocumentosViaje
            .AsNoTracking()
            .Where(d => d.ViajeId == viajeId)
            .OrderBy(d => d.TipoDocumento)
            .ThenBy(d => d.FechaCarga)
            .Select(d => new
            {
                d.Id,
                d.ViajeId,
                d.TipoDocumento,
                d.NombreArchivo,
                d.ContentType,
                d.FechaCarga
            })
            .ToListAsync(cancellationToken);

        return Ok(documentos);
    }

    // POST: api/viaje/1/documentos/GuiaDespacho
    // POST: api/viaje/1/documentos/RendicionGuias
    [RequirePermission("VIAJES_EDITAR")]
    [HttpPost("{tipoDocumento}")]
    [RequestSizeLimit(TamanoMaximoArchivo + 1024 * 1024)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Subir(
        int viajeId,
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
                "GuiaDespacho y RendicionGuias.");
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

        var viajeExiste = await _context.Viajes
            .AnyAsync(v => v.Id == viajeId, cancellationToken);

        if (!viajeExiste)
        {
            return NotFound("No existe el viaje solicitado.");
        }

        // Las guías son múltiples.
        // La rendición de guías es única y se reemplaza si ya existe.
        DocumentoViaje? documentoExistente = null;

        if (tipoNormalizado == TipoDocumentoViaje.RendicionGuias)
        {
            documentoExistente = await _context.DocumentosViaje
                .FirstOrDefaultAsync(
                    d => d.ViajeId == viajeId
                        && d.TipoDocumento == tipoNormalizado,
                    cancellationToken);
        }

        var nombreArchivo = Path.GetFileName(archivo.FileName);

        var blobName =
            $"viaje-{viajeId}/{tipoNormalizado}/{Guid.NewGuid():N}{extension.ToLowerInvariant()}";

        // Subimos el archivo al contenedor específico de viajes.
        await using (var stream = archivo.OpenReadStream())
        {
            await _blobStorage.SubirArchivoEnContenedorAsync(
                ContenedorDocumentos,
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
                var nuevoDocumento = new DocumentoViaje
                {
                    ViajeId = viajeId,
                    TipoDocumento = tipoNormalizado,
                    NombreArchivo = nombreArchivo,
                    BlobName = blobName,
                    ContentType = contentType,
                    FechaCarga = DateTime.UtcNow
                };

                _context.DocumentosViaje.Add(nuevoDocumento);
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
            // Si falla la base de datos, intentamos eliminar
            // el archivo nuevo del mismo contenedor.
            try
            {
                await _blobStorage.EliminarArchivoEnContenedorAsync(
                    ContenedorDocumentos,
                    blobName,
                    cancellationToken);
            }
            catch
            {
                // Conservamos el error original.
            }

            throw;
        }

        // Eliminamos la rendición anterior después de guardar la nueva.
        if (!string.IsNullOrWhiteSpace(blobAnterior))
        {
            try
            {
                await _blobStorage.EliminarArchivoEnContenedorAsync(
                    ContenedorDocumentos,
                    blobAnterior,
                    cancellationToken);
            }
            catch (RequestFailedException)
            {
                // La nueva referencia ya está guardada.
            }
        }

        var documentoId = documentoExistente?.Id;

        var resultado = await _context.DocumentosViaje
            .AsNoTracking()
            .Where(d =>
                d.ViajeId == viajeId &&
                (documentoId.HasValue
                    ? d.Id == documentoId.Value
                    : d.BlobName == blobName))
            .Select(d => new
            {
                d.Id,
                d.ViajeId,
                d.TipoDocumento,
                d.NombreArchivo,
                d.ContentType,
                d.FechaCarga
            })
            .FirstAsync(cancellationToken);

        return Ok(resultado);
    }

    // GET: api/viaje/1/documentos/25
    // Permite visualizar o descargar el documento a través de la API.
    [RequirePermission("VIAJES_VER")]
    [HttpGet("{documentoId:int}")]
    public async Task<IActionResult> Descargar(
        int viajeId,
        int documentoId,
        CancellationToken cancellationToken)
    {
        var documento = await _context.DocumentosViaje
            .AsNoTracking()
            .FirstOrDefaultAsync(
                d => d.Id == documentoId && d.ViajeId == viajeId,
                cancellationToken);

        if (documento == null)
        {
            return NotFound(
                "No se encontró el documento para el viaje solicitado.");
        }

        try
        {
            var stream = await _blobStorage.DescargarArchivoEnContenedorAsync(
                ContenedorDocumentos,
                documento.BlobName,
                cancellationToken);

            return File(
                stream,
                documento.ContentType,
                enableRangeProcessing: true);
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            return NotFound(
                "El registro existe, pero el archivo no está disponible en Storage.");
        }
    }

    // DELETE: api/viaje/1/documentos/25
    [RequirePermission("VIAJES_EDITAR")]
    [HttpDelete("{documentoId:int}")]
    public async Task<IActionResult> Eliminar(
        int viajeId,
        int documentoId,
        CancellationToken cancellationToken)
    {
        var documento = await _context.DocumentosViaje
            .FirstOrDefaultAsync(
                d => d.Id == documentoId && d.ViajeId == viajeId,
                cancellationToken);

        if (documento == null)
        {
            return NotFound(
                "No se encontró el documento para el viaje solicitado.");
        }

        var blobName = documento.BlobName;

        // Eliminamos primero la referencia de la base de datos.
        _context.DocumentosViaje.Remove(documento);

        await _context.SaveChangesAsync(cancellationToken);

        try
        {
            await _blobStorage.EliminarArchivoEnContenedorAsync(
                ContenedorDocumentos,
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
