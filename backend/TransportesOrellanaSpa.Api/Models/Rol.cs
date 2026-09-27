namespace TransportesOrellanaSpa.Api.Models;

public class Rol
{
    public int Id { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string Descripcion { get; set; } = string.Empty;

    public bool Activo { get; set; } = true;

    public ICollection<UsuarioRol> UsuariosRoles { get; set; }
        = new List<UsuarioRol>();

    public ICollection<RolPermiso> RolesPermisos { get; set; }
        = new List<RolPermiso>();
}