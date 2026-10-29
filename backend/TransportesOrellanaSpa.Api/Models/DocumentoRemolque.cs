
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TransportesOrellanaSpa.Api.Models;

public class DocumentoRemolque
{
    public int Id { get; set; }

    public int RemolqueId { get; set; }

    [Required]
    [MaxLength(50)]
    public string TipoDocumento { get; set; } = string.Empty;

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

    [ForeignKey(nameof(RemolqueId))]
    public Remolque Remolque { get; set; } = null!;
}
