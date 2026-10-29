
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TransportesOrellanaSpa.Api.Models;

public class DocumentoConductor
{
    public int Id { get; set; }

    public int ConductorId { get; set; }

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

    // Se utiliza para identificar la liquidación correspondiente
    // a un mes específico. Ejemplo: 2026-10.
    [MaxLength(7)]
    public string? Periodo { get; set; }

    public DateTime FechaCarga { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(ConductorId))]
    public Conductor Conductor { get; set; } = null!;
}
