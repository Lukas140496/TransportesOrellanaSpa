using System.Globalization;
using Azure;
using Azure.Communication.Email;

namespace TransportesOrellanaSpa.Api.Services;

public class CorreoService
{
    private readonly EmailClient _emailClient;
    private readonly string _senderAddress;

    public CorreoService(IConfiguration configuration)
    {
        var connectionString =
            configuration["AzureCommunicationServices:ConnectionString"];

        _senderAddress =
            configuration["AzureCommunicationServices:SenderAddress"]
            ?? throw new InvalidOperationException(
                "No está configurado el remitente de correo.");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "No está configurada la conexión de Azure Communication Services.");
        }

        _emailClient = new EmailClient(connectionString);
    }

    public async Task EnviarBienvenidaAsync(
        string destinatario,
        string nombres,
        string enlaceAplicacion,
        string rolNombre)
    {
        var nombreSeguro =
            System.Net.WebUtility.HtmlEncode(nombres);

        var enlaceSeguro =
            System.Net.WebUtility.HtmlEncode(enlaceAplicacion);

        var emailSeguro =
            System.Net.WebUtility.HtmlEncode(destinatario);

        var rolSeguro =
            System.Net.WebUtility.HtmlEncode(rolNombre);

        var contenidoHtml = $"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bienvenido a Flota360</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f1f3f6;font-family:Arial,Helvetica,sans-serif;color:#263746;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f3f6;padding:32px 12px;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:10px;overflow:hidden;">

                            <!-- ENCABEZADO -->
                            <tr>
                                <td align="center" style="background-color:#102d46;padding:30px 24px;">
                                    <!-- REEMPLAZAR POR EL LOGO CUANDO ESTÉ DISPONIBLE -->
                                    <div style="font-size:30px;line-height:38px;font-weight:bold;letter-spacing:0.5px;color:#ffffff;">
                                        🚚 Flota360
                                    </div>
                                    <div style="margin-top:6px;font-size:11px;letter-spacing:2px;color:#d4e2ed;">
                                        BY TRANSPORTES ORELLANA SpA
                                    </div>
                                </td>
                            </tr>

                            <!-- CONTENIDO -->
                            <tr>
                                <td style="padding:32px 28px 18px;">
                                    <h1 style="margin:0 0 22px;font-size:25px;line-height:32px;color:#182c3e;">
                                        ¡Bienvenido a Flota360!
                                    </h1>

                                    <p style="margin:0 0 16px;font-size:15px;line-height:24px;">
                                        Hola <strong>{nombreSeguro}</strong>,
                                    </p>

                                    <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#53677b;">
                                        Tu cuenta ha sido creada correctamente. Ya tienes acceso a nuestra plataforma de gestión de flota y operaciones.
                                    </p>

                                    <!-- DATOS DE ACCESO -->
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f2f6fa;border:1px solid #e0e8ef;border-radius:8px;">
                                        <tr>
                                            <td style="padding:20px 20px 8px;">
                                                <div style="font-size:11px;font-weight:bold;letter-spacing:1.2px;color:#53677b;">
                                                    TUS DATOS DE ACCESO
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:12px 20px 8px;">
                                                <div style="font-size:12px;color:#64748b;margin-bottom:6px;">
                                                    Usuario / correo electrónico
                                                </div>
                                                <div style="font-size:15px;font-weight:bold;color:#182c3e;word-break:break-word;">
                                                    {emailSeguro}
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:12px 20px 8px;">
                                                <div style="font-size:12px;color:#64748b;margin-bottom:6px;">
                                                    Rol asignado
                                                </div>
                                                <div style="font-size:15px;font-weight:bold;color:#182c3e;">
                                                    {rolSeguro}
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:12px 20px 20px;">
                                                <div style="font-size:12px;color:#64748b;margin-bottom:6px;">
                                                    Contraseña
                                                </div>
                                                <div style="font-size:14px;color:#182c3e;">
                                                    Utiliza la contraseña inicial que te proporcionó el administrador.
                                                </div>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- BOTÓN -->
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:28px auto;">
                                        <tr>
                                            <td align="center" bgcolor="#173f5f" style="border-radius:6px;">
                                                <a href="{enlaceSeguro}" target="_blank" style="display:inline-block;padding:15px 28px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">
                                                    Ingresar a Flota360 &rarr;
                                                </a>
                                            </td>
                                        </tr>
                                    </table>

                                    <p style="margin:0 0 20px;font-size:13px;line-height:21px;color:#64748b;">
                                        Si necesitas ayuda para acceder, ponte en contacto con el administrador de tu cuenta.
                                    </p>
                                </td>
                            </tr>

                            <!-- FIRMA -->
                            <tr>
                                <td style="padding:0 28px 28px;">
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                        <tr>
                                            <td style="border-top:1px solid #e0e8ef;padding-top:22px;">
                                                <p style="margin:0 0 5px;font-size:14px;color:#263746;">
                                                    Saludos cordiales,
                                                </p>
                                                <p style="margin:0;font-size:15px;font-weight:bold;color:#182c3e;">
                                                    Equipo Flota360
                                                </p>
                                                <p style="margin:4px 0 10px;font-size:13px;color:#64748b;">
                                                    Transportes Orellana SpA
                                                </p>
                                                <!-- ESPACIO PARA TU FIRMA CORPORATIVA -->
                                                <p style="margin:0;font-size:12px;line-height:19px;color:#82909c;">
                                                    Gestión inteligente de flota y transporte.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- PIE -->
                            <tr>
                                <td align="center" style="background-color:#f8fafc;padding:16px 24px;border-top:1px solid #e8edf2;">
                                    <p style="margin:0;font-size:11px;line-height:18px;color:#8a98a6;">
                                        © Flota360 · Transportes Orellana SpA
                                    </p>
                                    <p style="margin:4px 0 0;font-size:11px;color:#8a98a6;">
                                        Este es un correo automático de bienvenida.
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """;

        var contenidoTexto = $"""
        ¡Bienvenido a Flota360!
        By Transportes Orellana SpA

        Hola {nombres},

        Tu cuenta ha sido creada correctamente.

        Usuario: {destinatario}
        Rol asignado: {rolNombre}
        Contraseña: utiliza la contraseña inicial que te proporcionó el administrador.

        Ingresa a la aplicación:
        {enlaceAplicacion}

        Saludos cordiales,
        Equipo Flota360
        Transportes Orellana SpA
        Gestión inteligente de flota y transporte.
        """;

        var mensaje = new EmailMessage(
            _senderAddress,
            new EmailRecipients(
                new[] { new EmailAddress(destinatario) }),
            new EmailContent("Bienvenido a Flota360 - Transportes Orellana SpA")
            {
                Html = contenidoHtml,
                PlainText = contenidoTexto
            });

        await _emailClient.SendAsync(
            WaitUntil.Completed,
            mensaje);
    }


    // =========================================
    // ALERTA DE VENCIMIENTO DE DOCUMENTOS
    // =========================================

    // Método compatible con el servicio actual.
    // Envía un correo individual a cada destinatario.
    public async Task EnviarAlertaVencimientoAsync(
        IEnumerable<string> destinatarios,
        string tipoEntidad,
        string identificadorEntidad,
        string tipoDocumento,
        DateTime fechaVencimiento,
        int diasRestantes)
    {
        var correos = destinatarios
            .Where(email => !string.IsNullOrWhiteSpace(email))
            .Select(email => email.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        foreach (var destinatario in correos)
        {
            await EnviarAlertaVencimientoAsync(
                destinatario,
                tipoEntidad,
                identificadorEntidad,
                tipoDocumento,
                fechaVencimiento,
                diasRestantes);
        }
    }

    // Método principal: procesa un único destinatario.
    public async Task EnviarAlertaVencimientoAsync(
        string destinatario,
        string tipoEntidad,
        string identificadorEntidad,
        string tipoDocumento,
        DateTime fechaVencimiento,
        int diasRestantes)
    {
        if (string.IsNullOrWhiteSpace(destinatario))
            throw new ArgumentException(
                "El destinatario del correo es obligatorio.",
                nameof(destinatario));

        destinatario = destinatario.Trim();

        var entidadSegura =
            System.Net.WebUtility.HtmlEncode(tipoEntidad);

        var identificadorSeguro =
            System.Net.WebUtility.HtmlEncode(identificadorEntidad);

        var documentoSeguro =
            System.Net.WebUtility.HtmlEncode(tipoDocumento);

        var fechaFormateada = fechaVencimiento.ToString(
            "dd 'de' MMMM 'de' yyyy",
            new CultureInfo("es-CL"));

        var fechaSegura =
            System.Net.WebUtility.HtmlEncode(fechaFormateada);

        var tiempoRestante = diasRestantes switch
        {
            0 => "Vence hoy",
            1 => "Vence mañana",
            _ => $"Vence en {diasRestantes} días"
        };

        var titulo = diasRestantes switch
        {
            0 => "Documento vence hoy",
            <= 10 => "Documento próximo a vencer",
            _ => "Recordatorio de vencimiento"
        };

        var tituloSeguro =
            System.Net.WebUtility.HtmlEncode(titulo);

        var mensajeDescripcion = diasRestantes switch
        {
            0 => "Uno de los documentos registrados en Flota360 vence hoy. Es importante gestionar su renovación para mantener la documentación al día.",
            <= 10 => "Uno de los documentos registrados en Flota360 está próximo a vencer. Te recomendamos gestionar su renovación cuanto antes para evitar inconvenientes.",
            _ => "Te recordamos que uno de los documentos registrados en Flota360 tiene una fecha de vencimiento próxima. Puedes anticipar su renovación para mantener la documentación al día."
        };

        var etiquetaAlerta = diasRestantes switch
        {
            0 => "VENCE HOY",
            <= 10 => "VENCIMIENTO PRÓXIMO",
            _ => "RECORDATORIO DE VENCIMIENTO"
        };

        var colorAlerta = diasRestantes switch
        {
            0 => "#dc2626",
            <= 10 => "#c2410c",
            _ => "#b45309"
        };

        var contenidoHtml = $"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{tituloSeguro}</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f1f3f6;font-family:Arial,Helvetica,sans-serif;color:#263746;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f3f6;padding:32px 12px;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:10px;overflow:hidden;">

                            <tr>
                                <td align="center" style="background-color:#102d46;padding:30px 24px;">
                                    <div style="font-size:30px;line-height:38px;font-weight:bold;letter-spacing:0.5px;color:#ffffff;">
                                        🚚 Flota360
                                    </div>
                                    <div style="margin-top:6px;font-size:11px;letter-spacing:2px;color:#d4e2ed;">
                                        BY TRANSPORTES ORELLANA SpA
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:32px 28px 28px;">
                                    <div style="display:inline-block;background-color:#fff4e5;color:{colorAlerta};padding:7px 12px;border-radius:5px;font-size:11px;font-weight:bold;letter-spacing:1px;">
                                        {etiquetaAlerta}
                                    </div>

                                    <h1 style="margin:20px 0 16px;font-size:24px;line-height:32px;color:#182c3e;">
                                        {tituloSeguro}
                                    </h1>

                                    <p style="margin:0 0 22px;font-size:15px;line-height:24px;color:#53677b;">
                                        {mensajeDescripcion}
                                    </p>

                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f2f6fa;border:1px solid #e0e8ef;border-radius:8px;">
                                        <tr>
                                            <td style="padding:20px 20px 8px;">
                                                <div style="font-size:11px;font-weight:bold;letter-spacing:1.2px;color:#53677b;">
                                                    INFORMACIÓN DEL DOCUMENTO
                                                </div>
                                            </td>
                                        </tr>

                                        <tr>
                                            <td style="padding:12px 20px 8px;">
                                                <div style="font-size:12px;color:#64748b;margin-bottom:6px;">
                                                    Tipo de entidad
                                                </div>
                                                <div style="font-size:15px;font-weight:bold;color:#182c3e;">
                                                    {entidadSegura}
                                                </div>
                                            </td>
                                        </tr>

                                        <tr>
                                            <td style="padding:12px 20px 8px;">
                                                <div style="font-size:12px;color:#64748b;margin-bottom:6px;">
                                                    Identificación
                                                </div>
                                                <div style="font-size:17px;font-weight:bold;color:#182c3e;">
                                                    {identificadorSeguro}
                                                </div>
                                            </td>
                                        </tr>

                                        <tr>
                                            <td style="padding:12px 20px 8px;">
                                                <div style="font-size:12px;color:#64748b;margin-bottom:6px;">
                                                    Documento
                                                </div>
                                                <div style="font-size:15px;font-weight:bold;color:#182c3e;">
                                                    {documentoSeguro}
                                                </div>
                                            </td>
                                        </tr>

                                        <tr>
                                            <td style="padding:12px 20px 8px;">
                                                <div style="font-size:12px;color:#64748b;margin-bottom:6px;">
                                                    Fecha de vencimiento
                                                </div>
                                                <div style="font-size:15px;font-weight:bold;color:#182c3e;">
                                                    {fechaSegura}
                                                </div>
                                            </td>
                                        </tr>

                                        <tr>
                                            <td style="padding:12px 20px 20px;">
                                                <div style="font-size:12px;color:#64748b;margin-bottom:6px;">
                                                    Estado
                                                </div>
                                                <div style="font-size:18px;font-weight:bold;color:{colorAlerta};">
                                                    {System.Net.WebUtility.HtmlEncode(tiempoRestante)}
                                                </div>
                                            </td>
                                        </tr>
                                    </table>

                                    <p style="margin:24px 0 0;font-size:14px;line-height:23px;color:#53677b;">
                                        Por favor, revisa la documentación correspondiente en Flota360 y coordina la renovación.
                                    </p>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:0 28px 28px;">
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                        <tr>
                                            <td style="border-top:1px solid #e0e8ef;padding-top:22px;">
                                                <p style="margin:0 0 5px;font-size:14px;color:#263746;">
                                                    Saludos cordiales,
                                                </p>
                                                <p style="margin:0;font-size:15px;font-weight:bold;color:#182c3e;">
                                                    Equipo Flota360
                                                </p>
                                                <p style="margin:4px 0 10px;font-size:13px;color:#64748b;">
                                                    Transportes Orellana SpA
                                                </p>
                                                <p style="margin:0;font-size:12px;line-height:19px;color:#82909c;">
                                                    Gestión inteligente de flota y transporte.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td align="center" style="background-color:#f8fafc;padding:16px 24px;border-top:1px solid #e8edf2;">
                                    <p style="margin:0;font-size:11px;line-height:18px;color:#8a98a6;">
                                        © Flota360 · Transportes Orellana SpA
                                    </p>
                                    <p style="margin:4px 0 0;font-size:11px;color:#8a98a6;">
                                        Este es un correo automático de notificación.
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """;

        var contenidoTexto = $"""
        FLOTA360 - TRANSPORTES ORELLANA SpA

        AVISO DE VENCIMIENTO DE DOCUMENTO

        Tipo de entidad: {tipoEntidad}
        Identificación: {identificadorEntidad}
        Documento: {tipoDocumento}
        Fecha de vencimiento: {fechaFormateada}
        Estado: {tiempoRestante}

        {mensajeDescripcion}

        Por favor, revisa la documentación correspondiente en Flota360 y coordina la renovación.

        Saludos cordiales,
        Equipo Flota360
        Transportes Orellana SpA
        Gestión inteligente de flota y transporte.

        Este es un correo automático de notificación.
        """;

        var mensaje = new EmailMessage(
            _senderAddress,
            new EmailRecipients(
                new[] { new EmailAddress(destinatario) }),
            new EmailContent(
                $"Alerta de vencimiento: {identificadorEntidad} - {tipoDocumento}")
            {
                Html = contenidoHtml,
                PlainText = contenidoTexto
            });

        await _emailClient.SendAsync(
            WaitUntil.Completed,
            mensaje);
    }
}
