using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Data;
using TransportesOrellanaSpa.Api.Services;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using TransportesOrellanaSpa.Api.Authorization;

var builder = WebApplication.CreateBuilder(args);

// =========================
// SERVICIOS
// =========================

builder.Services.AddOpenApi();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter());
    });

// =========================
// CORS
// =========================

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:4200",
                "http://172.20.10.13:4200",
                "http://localhost:8080",
                "https://transportesorellana-web-d8hfbucyh9fjffcj.chilecentral-01.azurewebsites.net"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// =========================
// BASE DE DATOS
// =========================

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// =========================
// SERVICIOS DE AUTENTICACIÓN
// =========================

builder.Services.AddScoped<PasswordService>();
builder.Services.AddScoped<AutenticacionService>();
builder.Services.AddScoped<JwtService>();

builder.Services.AddScoped<IAuthorizationHandler, PermissionHandler>();

builder.Services.AddSingleton<
    IAuthorizationPolicyProvider,
    PermissionPolicyProvider
>();

var jwtSection = builder.Configuration.GetSection("Jwt");

var jwtKey = jwtSection["Key"]
    ?? throw new InvalidOperationException(
        "La configuración 'Jwt:Key' no está definida."
    );

var jwtIssuer = jwtSection["Issuer"]
    ?? throw new InvalidOperationException(
        "La configuración 'Jwt:Issuer' no está definida."
    );

var jwtAudience = jwtSection["Audience"]
    ?? throw new InvalidOperationException(
        "La configuración 'Jwt:Audience' no está definida."
    );

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            ),

            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateLifetime = true,

            ClockSkew = TimeSpan.Zero
        };
    });

// =========================
// APP
// =========================

var app = builder.Build();

// =========================
// SEED INICIAL
// =========================

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider
        .GetRequiredService<AppDbContext>();

    var passwordService = scope.ServiceProvider
        .GetRequiredService<PasswordService>();

    await DataSeeder.SeedAsync(
        context,
        passwordService,
        builder.Configuration
    );
}

// =========================
// HTTP REQUEST PIPELINE
// =========================

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("Frontend");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();