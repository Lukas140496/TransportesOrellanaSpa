using Microsoft.AspNetCore.Authorization;

namespace TransportesOrellanaSpa.Api.Authorization;

[AttributeUsage(
    AttributeTargets.Class | AttributeTargets.Method,
    AllowMultiple = true
)]
public class RequirePermissionAttribute : AuthorizeAttribute
{
    public RequirePermissionAttribute(string permission)
    {
        Policy = $"PERMISO:{permission}";
    }
}