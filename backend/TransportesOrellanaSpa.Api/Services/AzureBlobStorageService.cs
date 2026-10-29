
using Azure.Core;
using Azure.Identity;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace TransportesOrellanaSpa.Api.Services;

public class AzureBlobStorageService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly BlobContainerClient _containerClient;

    public AzureBlobStorageService(
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        var accountUrl = configuration["AzureStorage:AccountUrl"]
            ?? throw new InvalidOperationException(
                "Falta configurar AzureStorage:AccountUrl.");

        var containerName = configuration["AzureStorage:ContainerName"]
            ?? throw new InvalidOperationException(
                "Falta configurar AzureStorage:ContainerName.");

        TokenCredential credential;

        if (environment.IsDevelopment())
        {
            credential = new InteractiveBrowserCredential(
                new InteractiveBrowserCredentialOptions
                {
                    TenantId = "e75c40bb-acce-4f3d-809a-9383ceaca041"
                });
        }
        else
        {
            credential = new ManagedIdentityCredential(
                new ManagedIdentityCredentialOptions());
        }

        _blobServiceClient = new BlobServiceClient(
            new Uri(accountUrl),
            credential);

        // Contenedor predeterminado: se conserva para documentos de camiones.
        _containerClient =
            _blobServiceClient.GetBlobContainerClient(containerName);
    }

    private BlobContainerClient ObtenerContenedor(string containerName)
    {
        if (string.IsNullOrWhiteSpace(containerName))
        {
            throw new ArgumentException(
                "El nombre del contenedor es obligatorio.",
                nameof(containerName));
        }

        return _blobServiceClient.GetBlobContainerClient(containerName);
    }

    // =========================================================
    // MÉTODOS EXISTENTES: CONTENEDOR PREDETERMINADO (CAMIONES)
    // =========================================================

    public Task<string> SubirArchivoAsync(
        Stream archivo,
        string blobName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        return SubirArchivoAsync(
            _containerClient,
            archivo,
            blobName,
            contentType,
            cancellationToken);
    }

    public Task<Stream> DescargarArchivoAsync(
        string blobName,
        CancellationToken cancellationToken = default)
    {
        return DescargarArchivoAsync(
            _containerClient,
            blobName,
            cancellationToken);
    }

    public Task<bool> ExisteArchivoAsync(
        string blobName,
        CancellationToken cancellationToken = default)
    {
        return ExisteArchivoAsync(
            _containerClient,
            blobName,
            cancellationToken);
    }

    public Task EliminarArchivoAsync(
        string blobName,
        CancellationToken cancellationToken = default)
    {
        return EliminarArchivoAsync(
            _containerClient,
            blobName,
            cancellationToken);
    }

    // =========================================================
    // MÉTODOS PARA CONTENEDORES ESPECÍFICOS
    // =========================================================

    public Task<string> SubirArchivoEnContenedorAsync(
        string containerName,
        Stream archivo,
        string blobName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var container = ObtenerContenedor(containerName);

        return SubirArchivoAsync(
            container,
            archivo,
            blobName,
            contentType,
            cancellationToken);
    }

    public Task<Stream> DescargarArchivoEnContenedorAsync(
        string containerName,
        string blobName,
        CancellationToken cancellationToken = default)
    {
        var container = ObtenerContenedor(containerName);

        return DescargarArchivoAsync(
            container,
            blobName,
            cancellationToken);
    }

    public Task<bool> ExisteArchivoEnContenedorAsync(
        string containerName,
        string blobName,
        CancellationToken cancellationToken = default)
    {
        var container = ObtenerContenedor(containerName);

        return ExisteArchivoAsync(
            container,
            blobName,
            cancellationToken);
    }

    public Task EliminarArchivoEnContenedorAsync(
        string containerName,
        string blobName,
        CancellationToken cancellationToken = default)
    {
        var container = ObtenerContenedor(containerName);

        return EliminarArchivoAsync(
            container,
            blobName,
            cancellationToken);
    }

    // =========================================================
    // IMPLEMENTACIÓN INTERNA COMPARTIDA
    // =========================================================

    private static async Task<string> SubirArchivoAsync(
        BlobContainerClient container,
        Stream archivo,
        string blobName,
        string contentType,
        CancellationToken cancellationToken)
    {
        var blobClient = container.GetBlobClient(blobName);

        await blobClient.UploadAsync(
            archivo,
            new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders
                {
                    ContentType = contentType
                }
            },
            cancellationToken);

        return blobClient.Name;
    }

    private static async Task<Stream> DescargarArchivoAsync(
        BlobContainerClient container,
        string blobName,
        CancellationToken cancellationToken)
    {
        var blobClient = container.GetBlobClient(blobName);

        return await blobClient.OpenReadAsync(
            cancellationToken: cancellationToken);
    }

    private static async Task<bool> ExisteArchivoAsync(
        BlobContainerClient container,
        string blobName,
        CancellationToken cancellationToken)
    {
        var blobClient = container.GetBlobClient(blobName);

        var resultado = await blobClient.ExistsAsync(cancellationToken);

        return resultado.Value;
    }

    private static async Task EliminarArchivoAsync(
        BlobContainerClient container,
        string blobName,
        CancellationToken cancellationToken)
    {
        var blobClient = container.GetBlobClient(blobName);

        await blobClient.DeleteIfExistsAsync(
            cancellationToken: cancellationToken);
    }
}
