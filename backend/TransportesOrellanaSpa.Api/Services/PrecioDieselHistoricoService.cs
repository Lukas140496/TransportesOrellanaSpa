
using System.Text.Json;
using TransportesOrellanaSpa.Api.DTOs;

namespace TransportesOrellanaSpa.Api.Services;

public class PrecioDieselHistoricoService
{
    private readonly Dictionary<(int Anio, int Mes), PrecioDieselHistoricoDto>
        _precios;

    private readonly PrecioDieselActualCache _cache;

    public PrecioDieselHistoricoService(
        IWebHostEnvironment environment,
        PrecioDieselActualCache cache)
    {
        _cache = cache;

        var rutaArchivo = Path.Combine(
            environment.ContentRootPath,
            "Data",
            "Json",
            "precios-diesel-cne.json"
        );

        if (!File.Exists(rutaArchivo))
        {
            throw new FileNotFoundException(
                "No se encontró el archivo histórico de precios del diésel.",
                rutaArchivo
            );
        }

        var json = File.ReadAllText(rutaArchivo);

        var registros =
            JsonSerializer.Deserialize<List<PrecioDieselHistoricoDto>>(
                json,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }
            ) ?? new List<PrecioDieselHistoricoDto>();

        _precios = registros
            .GroupBy(registro => (registro.Anio, registro.Mes))
            .ToDictionary(
                grupo => grupo.Key,
                grupo => grupo.First()
            );
    }

    public PrecioDieselHistoricoDto ObtenerPorFecha(DateTime fecha)
    {
        var ahoraChile = ObtenerFechaActualChile();

        // 1. Primero: registro histórico válido del mes consultado.
        if (_precios.TryGetValue(
                (fecha.Year, fecha.Month),
                out var precioHistorico)
            && precioHistorico.Precio is > 0)
        {
            return precioHistorico;
        }

        // 2. Segundo: promedio actual, solo si falta el registro
        // del mes actual.
        if (fecha.Year == ahoraChile.Year
            && fecha.Month == ahoraChile.Month)
        {
            var actual = _cache.Obtener();

            if (actual.Precio.HasValue)
            {
                return CrearResultado(
                    fecha.Year,
                    fecha.Month,
                    actual.Precio.Value
                );
            }
        }

        // 3. Tercero: para meses sin registro, buscar el histórico
        // válido más cercano.
        var mesConsultado = fecha.Year * 12 + fecha.Month;

        var cercano = _precios.Values
            .Where(registro => registro.Precio is > 0)
            .OrderBy(registro =>
                Math.Abs(
                    (registro.Anio * 12 + registro.Mes) - mesConsultado
                ))
            .ThenBy(registro =>
                registro.Anio * 12 + registro.Mes > mesConsultado ? 1 : 0)
            .FirstOrDefault();

        if (cercano?.Precio is > 0)
        {
            return CrearResultado(
                fecha.Year,
                fecha.Month,
                cercano.Precio.Value
            );
        }

        return new PrecioDieselHistoricoDto
        {
            Anio = fecha.Year,
            Mes = fecha.Month,
            Precio = null,
            Region = "Región Metropolitana"
        };
    }

    private static PrecioDieselHistoricoDto CrearResultado(
        int anio,
        int mes,
        decimal precio)
    {
        return new PrecioDieselHistoricoDto
        {
            Anio = anio,
            Mes = mes,
            Precio = precio,
            Region = "Región Metropolitana"
        };
    }

    private static DateTime ObtenerFechaActualChile()
    {
        var zonaChile = TimeZoneInfo.FindSystemTimeZoneById(
            "America/Santiago"
        );

        return TimeZoneInfo.ConvertTime(
            DateTimeOffset.UtcNow,
            zonaChile
        ).DateTime;
    }
}
