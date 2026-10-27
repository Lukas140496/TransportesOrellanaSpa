
namespace TransportesOrellanaSpa.Api.Services;

public sealed class PrecioDieselActualCache
{
    private readonly object _lock = new();

    private decimal? _precio;
    private DateTime? _actualizadoEn;

    public (decimal? Precio, DateTime? ActualizadoEn) Obtener()
    {
        lock (_lock)
        {
            return (_precio, _actualizadoEn);
        }
    }

    public void Guardar(decimal precio, DateTime actualizadoEn)
    {
        lock (_lock)
        {
            _precio = precio;
            _actualizadoEn = actualizadoEn;
        }
    }
}
