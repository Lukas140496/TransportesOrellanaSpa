namespace TransportesOrellanaSpa.Api.Models;

public class Permiso
{
    public int Id { get; set; }

    public int ModuloId { get; set; }

    public Modulo Modulo { get; set; } = null!;

    public string Codigo { get; set; } = string.Empty;

    public string Nombre { get; set; } = string.Empty;

    public ICollection<RolPermiso> RolesPermisos { get; set; }
        = new List<RolPermiso>();
}