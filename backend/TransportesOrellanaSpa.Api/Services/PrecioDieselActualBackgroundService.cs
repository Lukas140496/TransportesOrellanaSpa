
using System.Globalization;
using System.Text.Json;

namespace TransportesOrellanaSpa.Api.Services;

public sealed class PrecioDieselActualBackgroundService : BackgroundService
{
    private const string Url =
        "https://api.bencinaenlinea.cl/api/busqueda_estacion_filtro";

    private static readonly TimeSpan IntervaloActualizacion =
        TimeSpan.FromHours(6);

    private static readonly TimeSpan AntiguedadMaxima =
        TimeSpan.FromDays(14);

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly PrecioDieselActualCache _cache;
    private readonly ILogger<PrecioDieselActualBackgroundService> _logger;

    public PrecioDieselActualBackgroundService(
        IHttpClientFactory httpClientFactory,
        PrecioDieselActualCache cache,
        ILogger<PrecioDieselActualBackgroundService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _cache = cache;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ActualizarPrecioAsync(stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                // Si falla la fuente externa, conservamos el último valor.
                _logger.LogWarning(
                    ex,
                    "No fue posible actualizar el promedio del diésel."
                );
            }

            try
            {
                await Task.Delay(
                    IntervaloActualizacion,
                    stoppingToken
                );
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private async Task ActualizarPrecioAsync(
        CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient("BencinaEnLinea");

        using var response = await client.GetAsync(
            Url,
            cancellationToken
        );

        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(
            cancellationToken
        );

        using var document = await JsonDocument.ParseAsync(
            stream,
            cancellationToken: cancellationToken
        );

        var root = document.RootElement;

        if (!root.TryGetProperty("data", out var estaciones)
            || estaciones.ValueKind != JsonValueKind.Array)
        {
            throw new InvalidOperationException(
                "La respuesta de Bencina en Línea no contiene el arreglo esperado."
            );
        }

        var zonaChile = TimeZoneInfo.FindSystemTimeZoneById(
            "America/Santiago"
        );

        var ahora = TimeZoneInfo.ConvertTime(
            DateTimeOffset.UtcNow,
            zonaChile
        ).DateTime;
        var preciosPorEstacion = new List<decimal>();

        foreach (var estacion in estaciones.EnumerateArray())
        {
            var region = LeerTexto(estacion, "region");

            if (!region.Contains(
                    "metropolitana",
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!estacion.TryGetProperty(
                    "combustibles",
                    out var combustibles)
                || combustibles.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            decimal? precioDieselAutoservicio = null;
            decimal? precioDieselAtendido = null;

            foreach (var combustible in combustibles.EnumerateArray())
            {
                var nombre = LeerTexto(combustible, "nombre_corto")
                    .Trim()
                    .ToUpperInvariant();

                if (nombre != "DI" && nombre != "ADI")
                {
                    continue;
                }

                if (!PrecioEsValidoYReciente(
                        combustible,
                        ahora,
                        out var precio))
                {
                    continue;
                }

                if (nombre == "DI")
                {
                    precioDieselAutoservicio = precio;
                }
                else if (nombre == "ADI")
                {
                    precioDieselAtendido = precio;
                }
            }

            // Contamos como máximo un precio por estación.
            // Preferimos DI y usamos ADI como alternativa.
            var precioElegido =
                precioDieselAutoservicio ?? precioDieselAtendido;

            if (precioElegido.HasValue)
            {
                preciosPorEstacion.Add(precioElegido.Value);
            }
        }

        if (preciosPorEstacion.Count == 0)
        {
            throw new InvalidOperationException(
                "No se encontraron precios recientes de diésel en la Región Metropolitana."
            );
        }

        var promedio = decimal.Round(
            preciosPorEstacion.Average(),
            0,
            MidpointRounding.AwayFromZero
        );

        _cache.Guardar(promedio, ahora);

        _logger.LogInformation(
            "Promedio del diésel actualizado: ${Precio} CLP por litro, usando {Cantidad} estaciones.",
            promedio,
            preciosPorEstacion.Count
        );
    }

    private static bool PrecioEsValidoYReciente(
        JsonElement combustible,
        DateTime ahora,
        out decimal precio)
    {
        precio = 0;

        var precioTexto = LeerTexto(combustible, "precio");

        if (!decimal.TryParse(
                precioTexto,
                NumberStyles.Number,
                CultureInfo.InvariantCulture,
                out var valor))
        {
            return false;
        }

        // Filtro de seguridad para evitar valores vacíos o anómalos.
        if (valor < 400 || valor > 2500)
        {
            return false;
        }

        var fechaTexto = LeerTexto(combustible, "precio_fecha");

        if (!DateTime.TryParse(
                fechaTexto,
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var fechaPrecio))
        {
            return false;
        }

        if (fechaPrecio > ahora.AddDays(1))
        {
            return false;
        }

        if (ahora - fechaPrecio > AntiguedadMaxima)
        {
            return false;
        }

        precio = valor;
        return true;
    }

    private static string LeerTexto(
        JsonElement elemento,
        string propiedad)
    {
        if (!elemento.TryGetProperty(propiedad, out var valor))
        {
            return string.Empty;
        }

        return valor.ValueKind switch
        {
            JsonValueKind.String => valor.GetString() ?? string.Empty,
            JsonValueKind.Number => valor.ToString(),
            _ => string.Empty
        };
    }
}
