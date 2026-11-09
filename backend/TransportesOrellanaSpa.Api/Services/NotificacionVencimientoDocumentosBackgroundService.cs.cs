
using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.Models;

namespace TransportesOrellanaSpa.Api.Services;

public sealed class NotificacionVencimientoDocumentosBackgroundService
    : BackgroundService
{
    private static readonly TimeZoneInfo ZonaHorariaChile =
        TimeZoneInfo.FindSystemTimeZoneById("America/Santiago");

    private static readonly int[] DiasAnticipacion = { 30, 10, 0 };

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificacionVencimientoDocumentosBackgroundService> _logger;

    public NotificacionVencimientoDocumentosBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<NotificacionVencimientoDocumentosBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcesarVencimientosAsync(stoppingToken);
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
                    "Error general al detectar vencimientos.");
            }

            try
            {
                var ahoraUtc = DateTime.UtcNow;

                var ahoraChile = TimeZoneInfo.ConvertTimeFromUtc(
                    ahoraUtc,
                    ZonaHorariaChile);

                var proximaMedianocheChile = DateTime.SpecifyKind(
                    ahoraChile.Date.AddDays(1),
                    DateTimeKind.Unspecified);

                var proximaEjecucionUtc =
                    TimeZoneInfo.ConvertTimeToUtc(
                        proximaMedianocheChile,
                        ZonaHorariaChile);

                var tiempoEspera =
                    proximaEjecucionUtc - DateTime.UtcNow;

                if (tiempoEspera > TimeSpan.Zero)
                {
                    await Task.Delay(tiempoEspera, stoppingToken);
                }
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    // =========================================
    // PROCESAR VENCIMIENTOS
    // =========================================

    private async Task ProcesarVencimientosAsync(
        CancellationToken cancellationToken)
    {
        var hoyChile = TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.UtcNow,
            ZonaHorariaChile).Date;

        _logger.LogInformation(
            "Iniciando detección de vencimientos. Fecha Chile: {Fecha}.",
            hoyChile);

        using var scope = _scopeFactory.CreateScope();

        var context = scope.ServiceProvider
            .GetRequiredService<AppDbContext>();

        var destinatarios = await context.Usuarios
            .AsNoTracking()
            .Where(u =>
                u.Activo &&
                !string.IsNullOrWhiteSpace(u.Email) &&
                u.UsuariosRoles.Any(ur =>
                    ur.Rol.Activo &&
                    ur.Rol.Nombre == "Administrador"))
            .Select(u => u.Email.Trim())
            .Distinct()
            .ToListAsync(cancellationToken);

        if (destinatarios.Count == 0)
        {
            _logger.LogWarning(
                "No existen administradores activos para recibir alertas.");

            return;
        }

        var totalEventos = 0;

        totalEventos += await ProcesarCamionesAsync(
            context, destinatarios, hoyChile, cancellationToken);

        totalEventos += await ProcesarRemolquesAsync(
            context, destinatarios, hoyChile, cancellationToken);

        totalEventos += await ProcesarConductoresAsync(
            context, destinatarios, hoyChile, cancellationToken);

        _logger.LogInformation(
            "Detección finalizada. Eventos nuevos registrados: {Cantidad}.",
            totalEventos);
    }

    // =========================================
    // CAMIONES
    // =========================================

    private async Task<int> ProcesarCamionesAsync(
        AppDbContext context,
        List<string> destinatarios,
        DateTime hoyChile,
        CancellationToken cancellationToken)
    {
        var fechasObjetivo = DiasAnticipacion
            .Select(dias => hoyChile.AddDays(dias))
            .ToArray();

        var camiones = await context.Camiones
            .AsNoTracking()
            .Where(c =>
                c.Activo &&
                (
                    (c.FechaRevisionTecnica.HasValue &&
                     fechasObjetivo.Contains(c.FechaRevisionTecnica.Value)) ||

                    (c.FechaPermisoCirculacion.HasValue &&
                     fechasObjetivo.Contains(c.FechaPermisoCirculacion.Value)) ||

                    (c.FechaSeguroObligatorio.HasValue &&
                     fechasObjetivo.Contains(c.FechaSeguroObligatorio.Value))
                ))
            .ToListAsync(cancellationToken);

        var total = 0;

        foreach (var camion in camiones)
        {
            if (camion.FechaRevisionTecnica.HasValue)
            {
                var fecha = camion.FechaRevisionTecnica.Value.Date;

                total += await RegistrarEventoCamionAsync(
                    context, destinatarios, camion,
                    "Revisión Técnica", fecha, hoyChile, cancellationToken);

                total += await RegistrarEventoCamionAsync(
                    context, destinatarios, camion,
                    "Certificado de Gases", fecha, hoyChile, cancellationToken);
            }

            if (camion.FechaPermisoCirculacion.HasValue)
            {
                total += await RegistrarEventoCamionAsync(
                    context, destinatarios, camion,
                    "Permiso de Circulación",
                    camion.FechaPermisoCirculacion.Value.Date,
                    hoyChile, cancellationToken);
            }

            if (camion.FechaSeguroObligatorio.HasValue)
            {
                total += await RegistrarEventoCamionAsync(
                    context, destinatarios, camion,
                    "Seguro Obligatorio (SOAP)",
                    camion.FechaSeguroObligatorio.Value.Date,
                    hoyChile, cancellationToken);
            }
        }

        return total;
    }

    private async Task<int> RegistrarEventoCamionAsync(
        AppDbContext context,
        List<string> destinatarios,
        Camion camion,
        string tipoDocumento,
        DateTime fechaVencimiento,
        DateTime hoyChile,
        CancellationToken cancellationToken)
    {
        var dias = ObtenerDiasAnticipacion(fechaVencimiento, hoyChile);

        if (dias == null)
            return 0;

        await using var transaction =
            await context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var existe = await context.NotificacionesVencimientoDocumentosCamion
                .AnyAsync(n =>
                    n.CamionId == camion.Id &&
                    n.TipoDocumento == tipoDocumento &&
                    n.FechaVencimiento == fechaVencimiento &&
                    n.DiasAnticipacion == dias.Value,
                    cancellationToken);

            if (existe)
            {
                await transaction.RollbackAsync(cancellationToken);
                return 0;
            }

            context.NotificacionesVencimientoDocumentosCamion.Add(
                new NotificacionVencimientoDocumentoCamion
                {
                    CamionId = camion.Id,
                    TipoDocumento = tipoDocumento,
                    FechaVencimiento = fechaVencimiento,
                    DiasAnticipacion = dias.Value,
                    FechaCreacionUtc = DateTime.UtcNow
                });

            await context.SaveChangesAsync(cancellationToken);

            AgregarEnviosPendientes(
                context,
                destinatarios,
                "Camión",
                camion.Id,
                tipoDocumento,
                fechaVencimiento,
                dias.Value);

            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "Evento registrado para camión {Patente}, documento {Documento}, anticipación {Dias} días. Destinatarios: {Cantidad}.",
                camion.Patente,
                tipoDocumento,
                dias.Value,
                destinatarios.Count);

            return 1;
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (DbUpdateException ex)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            DescartarCambiosPendientes(context);

            _logger.LogWarning(
                ex,
                "No se pudo registrar el evento del camión {Patente}. Puede existir un registro duplicado.",
                camion.Patente);

            return 0;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            DescartarCambiosPendientes(context);

            _logger.LogError(
                ex,
                "Error registrando vencimiento del camión {Patente}, documento {Documento}.",
                camion.Patente,
                tipoDocumento);

            return 0;
        }
    }

    // =========================================
    // REMOLQUES
    // =========================================

    private async Task<int> ProcesarRemolquesAsync(
        AppDbContext context,
        List<string> destinatarios,
        DateTime hoyChile,
        CancellationToken cancellationToken)
    {
        var fechasObjetivo = DiasAnticipacion
            .Select(dias => hoyChile.AddDays(dias))
            .ToArray();

        var remolques = await context.Remolques
            .AsNoTracking()
            .Where(r =>
                r.Activa &&
                (
                    (r.FechaPermisoCirculacion.HasValue &&
                     fechasObjetivo.Contains(r.FechaPermisoCirculacion.Value)) ||

                    (r.FechaSeguro.HasValue &&
                     fechasObjetivo.Contains(r.FechaSeguro.Value)) ||

                    (r.FechaRevisionTecnica.HasValue &&
                     fechasObjetivo.Contains(r.FechaRevisionTecnica.Value))
                ))
            .ToListAsync(cancellationToken);

        var total = 0;

        foreach (var remolque in remolques)
        {
            if (remolque.FechaPermisoCirculacion.HasValue)
            {
                total += await RegistrarEventoRemolqueAsync(
                    context, destinatarios, remolque,
                    "Permiso de Circulación",
                    remolque.FechaPermisoCirculacion.Value.Date,
                    hoyChile, cancellationToken);
            }

            if (remolque.FechaSeguro.HasValue)
            {
                total += await RegistrarEventoRemolqueAsync(
                    context, destinatarios, remolque,
                    "Seguro",
                    remolque.FechaSeguro.Value.Date,
                    hoyChile, cancellationToken);
            }

            if (remolque.FechaRevisionTecnica.HasValue)
            {
                total += await RegistrarEventoRemolqueAsync(
                    context, destinatarios, remolque,
                    "Revisión Técnica",
                    remolque.FechaRevisionTecnica.Value.Date,
                    hoyChile, cancellationToken);
            }
        }

        return total;
    }

    private async Task<int> RegistrarEventoRemolqueAsync(
        AppDbContext context,
        List<string> destinatarios,
        Remolque remolque,
        string tipoDocumento,
        DateTime fechaVencimiento,
        DateTime hoyChile,
        CancellationToken cancellationToken)
    {
        var dias = ObtenerDiasAnticipacion(fechaVencimiento, hoyChile);

        if (dias == null)
            return 0;

        await using var transaction =
            await context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var existe = await context.NotificacionesVencimientoDocumentosRemolque
                .AnyAsync(n =>
                    n.RemolqueId == remolque.Id &&
                    n.TipoDocumento == tipoDocumento &&
                    n.FechaVencimiento == fechaVencimiento &&
                    n.DiasAnticipacion == dias.Value,
                    cancellationToken);

            if (existe)
            {
                await transaction.RollbackAsync(cancellationToken);
                return 0;
            }

            context.NotificacionesVencimientoDocumentosRemolque.Add(
                new NotificacionVencimientoDocumentoRemolque
                {
                    RemolqueId = remolque.Id,
                    TipoDocumento = tipoDocumento,
                    FechaVencimiento = fechaVencimiento,
                    DiasAnticipacion = dias.Value,
                    FechaCreacionUtc = DateTime.UtcNow
                });

            await context.SaveChangesAsync(cancellationToken);

            AgregarEnviosPendientes(
                context,
                destinatarios,
                "Remolque",
                remolque.Id,
                tipoDocumento,
                fechaVencimiento,
                dias.Value);

            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "Evento registrado para remolque {Patente}, documento {Documento}, anticipación {Dias} días. Destinatarios: {Cantidad}.",
                remolque.Patente,
                tipoDocumento,
                dias.Value,
                destinatarios.Count);

            return 1;
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (DbUpdateException ex)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            DescartarCambiosPendientes(context);

            _logger.LogWarning(
                ex,
                "No se pudo registrar el evento del remolque {Patente}. Puede existir un registro duplicado.",
                remolque.Patente);

            return 0;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            DescartarCambiosPendientes(context);

            _logger.LogError(
                ex,
                "Error registrando vencimiento del remolque {Patente}, documento {Documento}.",
                remolque.Patente,
                tipoDocumento);

            return 0;
        }
    }

    // =========================================
    // CONDUCTORES
    // =========================================

    private async Task<int> ProcesarConductoresAsync(
        AppDbContext context,
        List<string> destinatarios,
        DateTime hoyChile,
        CancellationToken cancellationToken)
    {
        var fechasObjetivo = DiasAnticipacion
            .Select(dias => hoyChile.AddDays(dias))
            .ToArray();

        var conductores = await context.Conductores
            .AsNoTracking()
            .Where(c =>
                c.Activo &&
                c.FechaControlLicencia != default &&
                fechasObjetivo.Contains(c.FechaControlLicencia))
            .ToListAsync(cancellationToken);

        var total = 0;

        foreach (var conductor in conductores)
        {
            var nombreCompleto =
                $"{conductor.Nombres} {conductor.ApellidoPaterno} {conductor.ApellidoMaterno}".Trim();

            var identificacion = $"{nombreCompleto} - {conductor.Rut}";

            total += await RegistrarEventoConductorAsync(
                context,
                destinatarios,
                conductor,
                identificacion,
                conductor.FechaControlLicencia.Date,
                hoyChile,
                cancellationToken);
        }

        return total;
    }

    private async Task<int> RegistrarEventoConductorAsync(
        AppDbContext context,
        List<string> destinatarios,
        Conductor conductor,
        string identificacion,
        DateTime fechaVencimiento,
        DateTime hoyChile,
        CancellationToken cancellationToken)
    {
        const string tipoDocumento = "Licencia de conducir";

        var dias = ObtenerDiasAnticipacion(fechaVencimiento, hoyChile);

        if (dias == null)
            return 0;

        await using var transaction =
            await context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var existe = await context.NotificacionesVencimientoDocumentosConductor
                .AnyAsync(n =>
                    n.ConductorId == conductor.Id &&
                    n.TipoDocumento == tipoDocumento &&
                    n.FechaVencimiento == fechaVencimiento &&
                    n.DiasAnticipacion == dias.Value,
                    cancellationToken);

            if (existe)
            {
                await transaction.RollbackAsync(cancellationToken);
                return 0;
            }

            context.NotificacionesVencimientoDocumentosConductor.Add(
                new NotificacionVencimientoDocumentoConductor
                {
                    ConductorId = conductor.Id,
                    TipoDocumento = tipoDocumento,
                    FechaVencimiento = fechaVencimiento,
                    DiasAnticipacion = dias.Value,
                    FechaCreacionUtc = DateTime.UtcNow
                });

            await context.SaveChangesAsync(cancellationToken);

            AgregarEnviosPendientes(
                context,
                destinatarios,
                "Conductor",
                conductor.Id,
                tipoDocumento,
                fechaVencimiento,
                dias.Value);

            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation(
                "Evento registrado para conductor {Identificacion}, anticipación {Dias} días. Destinatarios: {Cantidad}.",
                identificacion,
                dias.Value,
                destinatarios.Count);

            return 1;
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (DbUpdateException ex)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            DescartarCambiosPendientes(context);

            _logger.LogWarning(
                ex,
                "No se pudo registrar el evento del conductor {Rut}. Puede existir un registro duplicado.",
                conductor.Rut);

            return 0;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            DescartarCambiosPendientes(context);

            _logger.LogError(
                ex,
                "Error registrando vencimiento de licencia del conductor {Rut}.",
                conductor.Rut);

            return 0;
        }
    }

    // =========================================
    // CREAR ENVIOS PENDIENTES
    // =========================================

    private static void AgregarEnviosPendientes(
        AppDbContext context,
        List<string> destinatarios,
        string tipoEntidad,
        int entidadId,
        string tipoDocumento,
        DateTime fechaVencimiento,
        int diasAnticipacion)
    {
        var fechaCreacionUtc = DateTime.UtcNow;

        foreach (var destinatario in destinatarios)
        {
            context.EnviosNotificaciones.Add(
                new EnvioNotificacion
                {
                    TipoEntidad = tipoEntidad,
                    EntidadId = entidadId,
                    TipoDocumento = tipoDocumento,
                    FechaVencimiento = fechaVencimiento,
                    DiasAnticipacion = diasAnticipacion,
                    Destinatario = destinatario,
                    Estado = EnvioNotificacion.Pendiente,
                    Intentos = 0,
                    FechaCreacionUtc = fechaCreacionUtc,
                    FechaProximoIntentoUtc = fechaCreacionUtc
                });
        }
    }

    // =========================================
    // LIMPIAR CAMBIOS TRAS ROLLBACK
    // =========================================

    private static void DescartarCambiosPendientes(
        AppDbContext context)
    {
        var entradasPendientes = context.ChangeTracker
            .Entries()
            .Where(e => e.State == EntityState.Added)
            .ToList();

        foreach (var entrada in entradasPendientes)
        {
            entrada.State = EntityState.Detached;
        }
    }

    // =========================================
    // UTILIDADES
    // =========================================

    private static int? ObtenerDiasAnticipacion(
        DateTime fechaVencimiento,
        DateTime hoyChile)
    {
        var diasRestantes =
            (fechaVencimiento.Date - hoyChile.Date).Days;

        return DiasAnticipacion.Contains(diasRestantes)
            ? diasRestantes
            : null;
    }
}
