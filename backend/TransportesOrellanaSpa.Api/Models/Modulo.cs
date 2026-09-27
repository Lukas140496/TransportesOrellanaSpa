namespace TransportesOrellanaSpa.Api.Models;

public class Modulo
{
    public int Id { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string Codigo { get; set; } = string.Empty;

    public string Descripcion { get; set; } = string.Empty;

    public bool Activo { get; set; } = true;

    public ICollection<Permiso> Permisos { get; set; }
        = new List<Permiso>();
}