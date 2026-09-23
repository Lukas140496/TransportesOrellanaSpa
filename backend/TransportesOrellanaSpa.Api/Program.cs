using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Data;
using System.Text.Json.Serialization;

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
                "http://172.20.10.13:4200"
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
// APP
// =========================

var app = builder.Build();

// =========================
// HTTP REQUEST PIPELINE
// =========================

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("Frontend");

app.UseAuthorization();

app.MapControllers();

app.Run();