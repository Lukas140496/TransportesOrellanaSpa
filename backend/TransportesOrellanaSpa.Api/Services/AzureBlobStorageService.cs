
using Azure.Core;
using Azure.Identity;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace TransportesOrellanaSpa.Api.Services;

public class AzureBlobStorageService
{
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

        var blobServiceClient = new BlobServiceClient(
            new Uri(accountUrl),
            credential);

        _containerClient =
            blobServiceClient.GetBlobContainerClient(containerName);
    }

    public async Task<string> SubirArchivoAsync(
        Stream archivo,
        string blobName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var blobClient = _containerClient.GetBlobClient(blobName);

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

    public async Task<Stream> DescargarArchivoAsync(
        string blobName,
        CancellationToken cancellationToken = default)
    {
        var blobClient = _containerClient.GetBlobClient(blobName);

        return await blobClient.OpenReadAsync(
            cancellationToken: cancellationToken);
    }

    public async Task<bool> ExisteArchivoAsync(
        string blobName,
        CancellationToken cancellationToken = default)
    {
        var blobClient = _containerClient.GetBlobClient(blobName);

        var resultado = await blobClient.ExistsAsync(cancellationToken);

        return resultado.Value;
    }

    public async Task EliminarArchivoAsync(
        string blobName,
        CancellationToken cancellationToken = default)
    {
        var blobClient = _containerClient.GetBlobClient(blobName);

        await blobClient.DeleteIfExistsAsync(
            cancellationToken: cancellationToken);
    }
}
