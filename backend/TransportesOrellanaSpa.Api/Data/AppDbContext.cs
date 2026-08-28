using Microsoft.EntityFrameworkCore;
using TransportesOrellanaSpa.Api.Models;

namespace TransportesOrellanaSpa.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Camion> Camiones { get; set; }
    public DbSet<Conductor> Conductores { get; set; }
    public DbSet<Remolque> Remolques { get; set; }
    public DbSet<Cliente> Clientes { get; set; }
    public DbSet<Viaje> Viajes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // =========================
        // CAMIÓN - CONDUCTOR HABITUAL
        // =========================

        modelBuilder.Entity<Camion>()
            .HasOne(c => c.ConductorHabitual)
            .WithMany(c => c.CamionesHabituales)
            .HasForeignKey(c => c.ConductorHabitualId)
            .OnDelete(DeleteBehavior.SetNull);


        // =========================
        // Remolque - CAMIÓN HABITUAL
        // =========================

        modelBuilder.Entity<Remolque>()
            .HasOne(r => r.CamionHabitual)
            .WithMany(c => c.Remolques)
            .HasForeignKey(r => r.CamionHabitualId)
            .OnDelete(DeleteBehavior.SetNull);


        // =========================
        // VIAJE - CLIENTE
        // =========================

        modelBuilder.Entity<Viaje>()
            .HasOne(v => v.Cliente)
            .WithMany(c => c.Viajes)
            .HasForeignKey(v => v.ClienteId)
            .OnDelete(DeleteBehavior.Restrict);


        // =========================
        // VIAJE - CAMIÓN
        // =========================

        modelBuilder.Entity<Viaje>()
            .HasOne(v => v.Camion)
            .WithMany(c => c.Viajes)
            .HasForeignKey(v => v.CamionId)
            .OnDelete(DeleteBehavior.Restrict);


        // =========================
        // VIAJE - CONDUCTOR
        // =========================

        modelBuilder.Entity<Viaje>()
            .HasOne(v => v.Conductor)
            .WithMany(c => c.Viajes)
            .HasForeignKey(v => v.ConductorId)
            .OnDelete(DeleteBehavior.Restrict);


        // =========================
        // VIAJE - REMOLQUE
        // =========================

        modelBuilder.Entity<Viaje>()
            .HasOne(v => v.Remolque)
            .WithMany(r => r.Viajes)
            .HasForeignKey(v => v.RemolqueId)
            .OnDelete(DeleteBehavior.Restrict);


        // =========================
        // CAMIÓN - FECHAS
        // =========================

        modelBuilder.Entity<Camion>()
            .Property(c => c.FechaRevisionTecnica)
            .HasColumnType("date");

        modelBuilder.Entity<Camion>()
            .Property(c => c.FechaPermisoCirculacion)
            .HasColumnType("date");

        modelBuilder.Entity<Camion>()
            .Property(c => c.FechaSeguroObligatorio)
            .HasColumnType("date");

            
        // =========================
        // VIAJE - ESTADOS
        // =========================

        modelBuilder.Entity<Viaje>()
            .Property(v => v.Estado)
            .HasConversion<string>();

        modelBuilder.Entity<Viaje>()
            .Property(v => v.EstadoPago)
            .HasConversion<string>();

            
        // =========================
        // ÍNDICES
        // =========================

        modelBuilder.Entity<Camion>()
            .HasIndex(c => c.Patente)
            .IsUnique();

        modelBuilder.Entity<Conductor>()
            .HasIndex(c => c.Rut)
            .IsUnique();

        modelBuilder.Entity<Remolque>()
            .HasIndex(r => r.Patente)
            .IsUnique();

        modelBuilder.Entity<Cliente>()
            .HasIndex(c => c.Rut)
            .IsUnique();
    }
}