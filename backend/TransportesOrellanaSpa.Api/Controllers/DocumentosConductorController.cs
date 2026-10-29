
using System.Globalization;
using Azure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Authorization;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.Models;
using TransportesOrellanaSpa.Api.Services;

namespace TransportesOrellanaSpa.Api.Controllers;

[ApiController]
[Route("api/conductor/{conductorId:int}/documentos")]
public class DocumentosConductorController : ControllerBase
{
    private const long TamanoMaximoArchivo = 10 * 1024 * 1024;
    private const string ContenedorDocumentos = "documentacion-conductores";

    private readonly AppDbContext _context;
    private readonly AzureBlobStorageService _blobStorage;

    public DocumentosConductorController(
        AppDbContext context,
        AzureBlobStorageService blobStorage)
    {
        _context = context;
        _blobStorage = blobStorage;
    }

    private static readonly Dictionary<string, string> TiposPermitidos =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["LicenciaConducir"] = "LicenciaConducir",
            ["CedulaIdentidad"] = "CedulaIdentidad",
            ["HojaVidaConductor"] = "HojaVidaConductor",
            ["ContratoTrabajo"] = "ContratoTrabajo",
            ["LiquidacionSueldo"] = "LiquidacionSueldo",
            ["Finiquito"] = "Finiquito"
        };

    private static readonly Dictionary<string, string> ExtensionesPermitidas =
        new(StringComparer.OrdinalIgnoreCase)
        {
            [".pdf"] = "application/pdf",
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png"
        };

    // GET: api/conductor/1/documentos
    [RequirePermission("CONDUCTORES_VER")]
    [HttpGet]
    public async Task<IActionResult> Listar(
        int conductorId,
        CancellationToken cancellationToken)
    {
        var conductor = await _context.Conductores
            .AsNoTracking()
            .Where(c => c.Id == conductorId)
            .Select(c => new { c.Id, c.Activo })
            .FirstOrDefaultAsync(cancellationToken);

        if (conductor == null)
        {
            return NotFound("No existe el conductor solicitado.");
        }

        var consulta = _context.DocumentosConductor
            .AsNoTracking()
            .Where(d => d.ConductorId == conductorId);

        // Las liquidaciones históricas se conservan,
        // pero no aparecen en la lista principal si está inactivo.
        if (!conductor.Activo)
        {
            consulta = consulta.Where(
                d => d.TipoDocumento != "LiquidacionSueldo");
        }

        var documentos = await consulta
            .OrderBy(d => d.TipoDocumento)
            .ThenByDescending(d => d.Periodo)
            .ThenByDescending(d => d.FechaCarga)
            .Select(d => new
            {
                d.Id,
                d.ConductorId,
                d.TipoDocumento,
                d.NombreArchivo,
                d.ContentType,
                d.Periodo,
                d.FechaCarga
            })
            .ToListAsync(cancellationToken);

        return Ok(documentos);
    }

    // POST: api/conductor/1/documentos/LicenciaConducir
    // POST: api/conductor/1/documentos/LiquidacionSueldo
    // Las liquidaciones requieren el período YYYY-MM.
    [RequirePermission("CONDUCTORES_EDITAR")]
    [HttpPost("{tipoDocumento}")]
    [RequestSizeLimit(TamanoMaximoArchivo + 1024 * 1024)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> SubirOReemplazar(
        int conductorId,
        string tipoDocumento,
        IFormFile archivo,
        [FromForm] string? periodo,
        CancellationToken cancellationToken)
    {
        if (!TiposPermitidos.TryGetValue(
                tipoDocumento,
                out var tipoNormalizado))
        {
            return BadRequest(
                "Tipo de documento no válido. Tipos permitidos: " +
                "LicenciaConducir, CedulaIdentidad, HojaVidaConductor, " +
                "ContratoTrabajo, LiquidacionSueldo y Finiquito.");
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

        var conductor = await _context.Conductores
            .AsNoTracking()
            .Where(c => c.Id == conductorId)
            .Select(c => new { c.Id, c.Activo })
            .FirstOrDefaultAsync(cancellationToken);

        if (conductor == null)
        {
            return NotFound("No existe el conductor solicitado.");
        }

        var esLiquidacion = tipoNormalizado == "LiquidacionSueldo";

        if (esLiquidacion)
        {
            if (string.IsNullOrWhiteSpace(periodo) ||
                !DateTime.TryParseExact(
                    periodo,
                    "yyyy-MM",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out _))
            {
                return BadRequest(
                    "Para una liquidación debes indicar el período " +
                    "en formato YYYY-MM, por ejemplo 2026-10.");
            }

            if (!conductor.Activo)
            {
                return BadRequest(
                    "No se pueden cargar nuevas liquidaciones " +
                    "a un conductor inactivo.");
            }
        }
        else if (!string.IsNullOrWhiteSpace(periodo))
        {
            return BadRequest(
                "El período solo se utiliza para liquidaciones de sueldo.");
        }

        // El finiquito solo se registra cuando el conductor está inactivo.
        if (tipoNormalizado == "Finiquito" && conductor.Activo)
        {
            return BadRequest(
                "Para cargar un finiquito, primero debes marcar " +
                "al conductor como inactivo.");
        }

        DocumentoConductor? documentoExistente = null;

        if (esLiquidacion)
        {
            var duplicada = await _context.DocumentosConductor
                .AnyAsync(
                    d => d.ConductorId == conductorId
                        && d.TipoDocumento == tipoNormalizado
                        && d.Periodo == periodo,
                    cancellationToken);

            if (duplicada)
            {
                return Conflict(
                    "Ya existe una liquidación para ese período. " +
                    "Elimina la existente antes de cargar otra.");
            }
        }
        else
        {
            documentoExistente = await _context.DocumentosConductor
                .FirstOrDefaultAsync(
                    d => d.ConductorId == conductorId
                        && d.TipoDocumento == tipoNormalizado,
                    cancellationToken);
        }

        var nombreArchivo = Path.GetFileName(archivo.FileName);

        var blobName =
            $"conductor-{conductorId}/{tipoNormalizado}/{Guid.NewGuid():N}{extension.ToLowerInvariant()}";

        // Subimos al contenedor exclusivo de documentos de conductores.
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
                var nuevoDocumento = new DocumentoConductor
                {
                    ConductorId = conductorId,
                    TipoDocumento = tipoNormalizado,
                    NombreArchivo = nombreArchivo,
                    BlobName = blobName,
                    ContentType = contentType,
                    Periodo = esLiquidacion ? periodo : null,
                    FechaCarga = DateTime.UtcNow
                };

                _context.DocumentosConductor.Add(nuevoDocumento);
            }
            else
            {
                documentoExistente.NombreArchivo = nombreArchivo;
                documentoExistente.BlobName = blobName;
                documentoExistente.ContentType = contentType;
                documentoExistente.FechaCarga = DateTime.UtcNow;
                documentoExistente.Periodo = null;
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
                // La nueva referencia ya quedó guardada.
            }
        }

        var documentoId = documentoExistente?.Id;

        var resultado = await _context.DocumentosConductor
            .AsNoTracking()
            .Where(d =>
                d.ConductorId == conductorId &&
                (documentoId.HasValue
                    ? d.Id == documentoId.Value
                    : d.BlobName == blobName))
            .Select(d => new
            {
                d.Id,
                d.ConductorId,
                d.TipoDocumento,
                d.NombreArchivo,
                d.ContentType,
                d.Periodo,
                d.FechaCarga
            })
            .FirstAsync(cancellationToken);

        return Ok(resultado);
    }

    // GET: api/conductor/1/documentos/25
    [RequirePermission("CONDUCTORES_VER")]
    [HttpGet("{documentoId:int}")]
    public async Task<IActionResult> Descargar(
        int conductorId,
        int documentoId,
        CancellationToken cancellationToken)
    {
        var documento = await _context.DocumentosConductor
            .AsNoTracking()
            .FirstOrDefaultAsync(
                d => d.Id == documentoId
                    && d.ConductorId == conductorId,
                cancellationToken);

        if (documento == null)
        {
            return NotFound(
                "No se encontró el documento para el conductor solicitado.");
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

    // DELETE: api/conductor/1/documentos/25
    [RequirePermission("CONDUCTORES_EDITAR")]
    [HttpDelete("{documentoId:int}")]
    public async Task<IActionResult> Eliminar(
        int conductorId,
        int documentoId,
        CancellationToken cancellationToken)
    {
        var documento = await _context.DocumentosConductor
            .FirstOrDefaultAsync(
                d => d.Id == documentoId
                    && d.ConductorId == conductorId,
                cancellationToken);

        if (documento == null)
        {
            return NotFound(
                "No se encontró el documento para el conductor solicitado.");
        }

        var blobName = documento.BlobName;

        _context.DocumentosConductor.Remove(documento);

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
