using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace TransportesOrellanaSpa.Api.Authorization;

public class PermissionPolicyProvider : IAuthorizationPolicyProvider
{
    private const string Prefix = "PERMISO:";
    private readonly DefaultAuthorizationPolicyProvider _fallbackPolicyProvider;

    public PermissionPolicyProvider(
        IOptions<AuthorizationOptions> options)
    {
        _fallbackPolicyProvider =
            new DefaultAuthorizationPolicyProvider(options);
    }

    public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        if (!policyName.StartsWith(Prefix, StringComparison.OrdinalIgnoreCase))
        {
            return _fallbackPolicyProvider.GetPolicyAsync(policyName);
        }

        var permission = policyName[Prefix.Length..];

        var policy = new AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .AddRequirements(new PermissionRequirement(permission))
            .Build();

        return Task.FromResult<AuthorizationPolicy?>(policy);
    }

    public Task<AuthorizationPolicy> GetDefaultPolicyAsync()
    {
        return _fallbackPolicyProvider.GetDefaultPolicyAsync();
    }

    public Task<AuthorizationPolicy?> GetFallbackPolicyAsync()
    {
        return _fallbackPolicyProvider.GetFallbackPolicyAsync();
    }
}