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
            new EmailContent("Bienvenido a Flota360 | Transportes Orellana SpA")
            {
                Html = contenidoHtml,
                PlainText = contenidoTexto
            });

        await _emailClient.SendAsync(
            WaitUntil.Completed,
            mensaje);
    }
}
