namespace TransportesOrellanaSpa.Api.Models;

public class Cliente
{
    public int Id { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public bool Activo { get; set; } = true;

    public ICollection<Viaje> Viajes { get; set; } = new List<Viaje>();
}