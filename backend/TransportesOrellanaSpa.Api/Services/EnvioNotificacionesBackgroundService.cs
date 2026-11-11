
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.Models;

namespace TransportesOrellanaSpa.Api.Services;

public sealed class EnvioNotificacionesBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EnvioNotificacionesBackgroundService> _logger;

    private const int MaximoIntentos = 5;
    private const int TamanoLote = 20;

    private static readonly TimeSpan IntervaloRevision =
        TimeSpan.FromSeconds(30);

    private static readonly TimeSpan TiempoRecuperacion =
        TimeSpan.FromMinutes(15);

    private static readonly int[] MinutosReintento =
        { 1, 5, 15, 60 };

    public EnvioNotificacionesBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<EnvioNotificacionesBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "Servicio de envío de notificaciones iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcesarColaAsync(stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error general al procesar la cola de notificaciones.");
            }

            try
            {
                await Task.Delay(IntervaloRevision, stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }

        _logger.LogInformation(
            "Servicio de envío de notificaciones detenido.");
    }

    private async Task ProcesarColaAsync(
        CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();

        var context = scope.ServiceProvider
            .GetRequiredService<AppDbContext>();

        var correoService = scope.ServiceProvider
            .GetRequiredService<CorreoService>();

        var ahoraUtc = DateTime.UtcNow;

        await RecuperarEnviosEstancadosAsync(
            context,
            ahoraUtc,
            cancellationToken);

        var enviosPendientes = await context.EnviosNotificaciones
            .AsNoTracking()
            .Where(e =>
                e.Estado == EnvioNotificacion.Pendiente &&
                (e.FechaProximoIntentoUtc == null ||
                 e.FechaProximoIntentoUtc <= ahoraUtc))
            .OrderBy(e => e.FechaCreacionUtc)
            .Select(e => e.Id)
            .Take(TamanoLote)
            .ToListAsync(cancellationToken);

        foreach (var envioId in enviosPendientes)
        {
            cancellationToken.ThrowIfCancellationRequested();

            await ProcesarEnvioAsync(
                context,
                correoService,
                envioId,
                cancellationToken);
        }
    }


    private async Task RecuperarEnviosEstancadosAsync(
        AppDbContext context,
        DateTime ahoraUtc,
        CancellationToken cancellationToken)
    {
        var limiteUtc = ahoraUtc - TiempoRecuperacion;

        // Los envíos que agotaron sus cinco intentos
        // no deben volver a procesarse.
        var agotados = await context.EnviosNotificaciones
            .Where(e =>
                e.Estado == EnvioNotificacion.EnProceso &&
                e.Intentos >= MaximoIntentos &&
                (e.FechaUltimoIntentoUtc == null ||
                 e.FechaUltimoIntentoUtc < limiteUtc))
            .ExecuteUpdateAsync(actualizacion =>
                actualizacion
                    .SetProperty(
                        e => e.Estado,
                        EnvioNotificacion.Fallido)
                    .SetProperty(
                        e => e.FechaProximoIntentoUtc,
                        (DateTime?)null)
                    .SetProperty(
                        e => e.UltimoError,
                        "Se agotaron los intentos disponibles. El proceso quedó interrumpido."),
                cancellationToken);

        // Recuperar solamente los que todavía tienen intentos disponibles.
        var recuperados = await context.EnviosNotificaciones
            .Where(e =>
                e.Estado == EnvioNotificacion.EnProceso &&
                e.Intentos < MaximoIntentos &&
                (e.FechaUltimoIntentoUtc == null ||
                 e.FechaUltimoIntentoUtc < limiteUtc))
            .ExecuteUpdateAsync(actualizacion =>
                actualizacion
                    .SetProperty(
                        e => e.Estado,
                        EnvioNotificacion.Pendiente)
                    .SetProperty(
                        e => e.FechaProximoIntentoUtc,
                        ahoraUtc),
                cancellationToken);

        if (agotados > 0)
        {
            _logger.LogWarning(
                "Se marcaron {Cantidad} notificaciones como fallidas por agotar sus intentos.",
                agotados);
        }

        if (recuperados > 0)
        {
            _logger.LogWarning(
                "Se recuperaron {Cantidad} notificaciones que estaban estancadas.",
                recuperados);
        }
    }

    private async Task ProcesarEnvioAsync(
        AppDbContext context,
        CorreoService correoService,
        int envioId,
        CancellationToken cancellationToken)
    {
        var ahoraUtc = DateTime.UtcNow;

        // Reclamo atómico: solamente una instancia puede tomar el envío.
        var reclamado = await context.EnviosNotificaciones
            .Where(e =>
                e.Id == envioId &&
                e.Estado == EnvioNotificacion.Pendiente &&
                (e.FechaProximoIntentoUtc == null ||
                 e.FechaProximoIntentoUtc <= ahoraUtc))
            .ExecuteUpdateAsync(actualizacion =>
                actualizacion
                    .SetProperty(
                        e => e.Estado,
                        EnvioNotificacion.EnProceso)
                    .SetProperty(
                        e => e.Intentos,
                        e => e.Intentos + 1)
                    .SetProperty(
                        e => e.FechaUltimoIntentoUtc,
                        ahoraUtc),
                cancellationToken);

        if (reclamado == 0)
            return;

        var envio = await context.EnviosNotificaciones
            .FirstOrDefaultAsync(
                e => e.Id == envioId,
                cancellationToken);

        if (envio == null)
            return;

        try
        {
            var resultadoValidacion =
                await ValidarEntidadYDocumentoAsync(
                    context,
                    envio,
                    cancellationToken);

            if (resultadoValidacion.Identificacion == null)
            {
                envio.Estado = EnvioNotificacion.Cancelado;
                envio.FechaProximoIntentoUtc = null;
                envio.UltimoError = resultadoValidacion.MotivoCancelacion;

                await context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "Notificación {EnvioId} cancelada. Motivo: {Motivo}.",
                    envio.Id,
                    resultadoValidacion.MotivoCancelacion);

                return;
            }

            envio.Estado = EnvioNotificacion.Enviado;
            envio.FechaEnvioUtc = DateTime.UtcNow;
            envio.FechaProximoIntentoUtc = null;
            envio.UltimoError = null;

            await context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Notificación {EnvioId} enviada correctamente a {Destinatario}.",
                envio.Id,
                envio.Destinatario);
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            await RegistrarErrorEnvioAsync(
                context,
                envio,
                ex,
                cancellationToken);
        }
    }


    private async Task<(string? Identificacion, string? MotivoCancelacion)>
        ValidarEntidadYDocumentoAsync(
            AppDbContext context,
            EnvioNotificacion envio,
            CancellationToken cancellationToken)
    {
        switch (envio.TipoEntidad)
        {
            case "Camión":
                {
                    var camion = await context.Camiones
                        .AsNoTracking()
                        .FirstOrDefaultAsync(
                            c => c.Id == envio.EntidadId,
                            cancellationToken);

                    if (camion == null)
                        return (null, "El camión ya no existe.");

                    if (!camion.Activo)
                        return (null, "El camión está desactivado.");

                    DateTime? fechaDocumento = envio.TipoDocumento switch
                    {
                        "Revisión Técnica" =>
                            camion.FechaRevisionTecnica,

                        "Certificado de Gases" =>
                            camion.FechaRevisionTecnica,

                        "Permiso de Circulación" =>
                            camion.FechaPermisoCirculacion,

                        "Seguro Obligatorio (SOAP)" =>
                            camion.FechaSeguroObligatorio,

                        _ => null
                    };

                    if (!FechaCoincide(fechaDocumento, envio.FechaVencimiento))
                        return (null, "La fecha del documento cambió o ya no está registrada.");

                    return (
                        $"{camion.Marca} {camion.Modelo} · Patente {camion.Patente}",
                        null);
                }

            case "Remolque":
                {
                    var remolque = await context.Remolques
                        .AsNoTracking()
                        .FirstOrDefaultAsync(
                            r => r.Id == envio.EntidadId,
                            cancellationToken);

                    if (remolque == null)
                        return (null, "El remolque ya no existe.");

                    if (!remolque.Activa)
                        return (null, "El remolque está desactivado.");

                    DateTime? fechaDocumento = envio.TipoDocumento switch
                    {
                        "Permiso de Circulación" =>
                            remolque.FechaPermisoCirculacion,

                        "Seguro" =>
                            remolque.FechaSeguro,

                        "Revisión Técnica" =>
                            remolque.FechaRevisionTecnica,

                        _ => null
                    };

                    if (!FechaCoincide(fechaDocumento, envio.FechaVencimiento))
                        return (null, "La fecha del documento cambió o ya no está registrada.");

                    return (
                        $"{remolque.Marca} {remolque.Modelo} · Patente {remolque.Patente}",
                        null);
                }

            case "Conductor":
                {
                    var conductor = await context.Conductores
                        .AsNoTracking()
                        .FirstOrDefaultAsync(
                            c => c.Id == envio.EntidadId,
                            cancellationToken);

                    if (conductor == null)
                        return (null, "El conductor ya no existe.");

                    if (!conductor.Activo)
                        return (null, "El conductor está desactivado.");

                    if (envio.TipoDocumento != "Licencia de conducir")
                        return (null, "Tipo de documento no reconocido.");

                    if (conductor.FechaControlLicencia == default ||
                        conductor.FechaControlLicencia.Date != envio.FechaVencimiento.Date)
                    {
                        return (null, "La fecha de vencimiento de la licencia cambió.");
                    }

                    var nombreCompleto =
                        $"{conductor.Nombres} {conductor.ApellidoPaterno} {conductor.ApellidoMaterno}".Trim();

                    return (
                        $"{nombreCompleto} · RUT {conductor.Rut}",
                        null);
                }

            default:
                return (null, $"Tipo de entidad no reconocido: {envio.TipoEntidad}.");
        }
    }

    private static bool FechaCoincide(
        DateTime? fechaDocumento,
        DateTime fechaNotificacion)
    {
        return fechaDocumento.HasValue &&
               fechaDocumento.Value.Date == fechaNotificacion.Date;
    }

    private async Task RegistrarErrorEnvioAsync(
        AppDbContext context,
        EnvioNotificacion envio,
        Exception excepcion,
        CancellationToken cancellationToken)
    {
        var ahoraUtc = DateTime.UtcNow;

        envio.UltimoError = excepcion.Message.Length > 2000
            ? excepcion.Message[..2000]
            : excepcion.Message;

        if (envio.Intentos >= MaximoIntentos)
        {
            envio.Estado = EnvioNotificacion.Fallido;
            envio.FechaProximoIntentoUtc = null;

            _logger.LogError(
                excepcion,
                "Notificación {EnvioId} fallida definitivamente después de {Intentos} intentos.",
                envio.Id,
                envio.Intentos);
        }
        else
        {
            var minutosEspera =
                MinutosReintento[envio.Intentos - 1];

            envio.Estado = EnvioNotificacion.Pendiente;
            envio.FechaProximoIntentoUtc =
                ahoraUtc.AddMinutes(minutosEspera);

            _logger.LogWarning(
                excepcion,
                "Falló la notificación {EnvioId}. Intento {Intento} de {Maximo}. Próximo intento en {Minutos} minutos.",
                envio.Id,
                envio.Intentos,
                MaximoIntentos,
                minutosEspera);
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}
