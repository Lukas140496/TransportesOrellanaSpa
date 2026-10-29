
using Azure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Authorization;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.Models;
using TransportesOrellanaSpa.Api.Services;

namespace TransportesOrellanaSpa.Api.Controllers;

[ApiController]
[Route("api/remolque/{remolqueId:int}/documentos")]
public class DocumentosRemolqueController : ControllerBase
{
    private const long TamanoMaximoArchivo = 10 * 1024 * 1024;
    private const string ContenedorDocumentos = "documentacion-remolques";

    private readonly AppDbContext _context;
    private readonly AzureBlobStorageService _blobStorage;

    public DocumentosRemolqueController(
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
            ["Seguro"] = "Seguro",
            ["RevisionTecnica"] = "RevisionTecnica"
        };

    private static readonly Dictionary<string, string> ExtensionesPermitidas =
        new(StringComparer.OrdinalIgnoreCase)
        {
            [".pdf"] = "application/pdf",
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png"
        };

    // GET: api/remolque/1/documentos
    [RequirePermission("REMOLQUES_VER")]
    [HttpGet]
    public async Task<IActionResult> Listar(
        int remolqueId,
        CancellationToken cancellationToken)
    {
        var remolqueExiste = await _context.Remolques
            .AnyAsync(r => r.Id == remolqueId, cancellationToken);

        if (!remolqueExiste)
        {
            return NotFound("No existe el remolque solicitado.");
        }

        var documentos = await _context.DocumentosRemolque
            .AsNoTracking()
            .Where(d => d.RemolqueId == remolqueId)
            .OrderBy(d => d.TipoDocumento)
            .Select(d => new
            {
                d.Id,
                d.RemolqueId,
                d.TipoDocumento,
                d.NombreArchivo,
                d.ContentType,
                d.FechaCarga
            })
            .ToListAsync(cancellationToken);

        return Ok(documentos);
    }

    // POST: api/remolque/1/documentos/PermisoCirculacion
    // POST: api/remolque/1/documentos/Seguro
    // POST: api/remolque/1/documentos/RevisionTecnica
    [RequirePermission("REMOLQUES_EDITAR")]
    [HttpPost("{tipoDocumento}")]
    [RequestSizeLimit(TamanoMaximoArchivo + 1024 * 1024)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> SubirOReemplazar(
        int remolqueId,
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
                "PermisoCirculacion, Seguro y RevisionTecnica.");
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

        var remolqueExiste = await _context.Remolques
            .AnyAsync(r => r.Id == remolqueId, cancellationToken);

        if (!remolqueExiste)
        {
            return NotFound("No existe el remolque solicitado.");
        }

        var documentoExistente = await _context.DocumentosRemolque
            .FirstOrDefaultAsync(
                d => d.RemolqueId == remolqueId
                    && d.TipoDocumento == tipoNormalizado,
                cancellationToken);

        var nombreArchivo = Path.GetFileName(archivo.FileName);

        var blobName =
            $"remolque-{remolqueId}/{tipoNormalizado}/{Guid.NewGuid():N}{extension.ToLowerInvariant()}";

        // Subimos al contenedor exclusivo de documentos de remolques.
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
                var nuevoDocumento = new DocumentoRemolque
                {
                    RemolqueId = remolqueId,
                    TipoDocumento = tipoNormalizado,
                    NombreArchivo = nombreArchivo,
                    BlobName = blobName,
                    ContentType = contentType,
                    FechaCarga = DateTime.UtcNow
                };

                _context.DocumentosRemolque.Add(nuevoDocumento);
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

        var resultado = await _context.DocumentosRemolque
            .AsNoTracking()
            .Where(d =>
                d.RemolqueId == remolqueId &&
                (documentoId.HasValue
                    ? d.Id == documentoId.Value
                    : d.BlobName == blobName))
            .Select(d => new
            {
                d.Id,
                d.RemolqueId,
                d.TipoDocumento,
                d.NombreArchivo,
                d.ContentType,
                d.FechaCarga
            })
            .FirstAsync(cancellationToken);

        return Ok(resultado);
    }

    // GET: api/remolque/1/documentos/25
    [RequirePermission("REMOLQUES_VER")]
    [HttpGet("{documentoId:int}")]
    public async Task<IActionResult> Descargar(
        int remolqueId,
        int documentoId,
        CancellationToken cancellationToken)
    {
        var documento = await _context.DocumentosRemolque
            .AsNoTracking()
            .FirstOrDefaultAsync(
                d => d.Id == documentoId
                    && d.RemolqueId == remolqueId,
                cancellationToken);

        if (documento == null)
        {
            return NotFound(
                "No se encontró el documento para el remolque solicitado.");
        }

        try
        {
            var stream =
                await _blobStorage.DescargarArchivoEnContenedorAsync(
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

    // DELETE: api/remolque/1/documentos/25
    [RequirePermission("REMOLQUES_EDITAR")]
    [HttpDelete("{documentoId:int}")]
    public async Task<IActionResult> Eliminar(
        int remolqueId,
        int documentoId,
        CancellationToken cancellationToken)
    {
        var documento = await _context.DocumentosRemolque
            .FirstOrDefaultAsync(
                d => d.Id == documentoId
                    && d.RemolqueId == remolqueId,
                cancellationToken);

        if (documento == null)
        {
            return NotFound(
                "No se encontró el documento para el remolque solicitado.");
        }

        var blobName = documento.BlobName;

        _context.DocumentosRemolque.Remove(documento);

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
