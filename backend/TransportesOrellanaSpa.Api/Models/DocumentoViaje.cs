
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TransportesOrellanaSpa.Api.Models;

public class DocumentoViaje
{
    public int Id { get; set; }

    public int ViajeId { get; set; }

    public TipoDocumentoViaje TipoDocumento { get; set; }

    [Required]
    [MaxLength(255)]
    public string NombreArchivo { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string BlobName { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string ContentType { get; set; } = "application/octet-stream";

    public DateTime FechaCarga { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(ViajeId))]
    public Viaje Viaje { get; set; } = null!;
}

public enum TipoDocumentoViaje
{
    GuiaDespacho = 1,
    RendicionGuias = 2
}
