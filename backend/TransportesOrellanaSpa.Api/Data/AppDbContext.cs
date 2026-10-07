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
    public DbSet<Gasto> Gastos { get; set; }
    public DbSet<GastoRemolque> GastosRemolque { get; set; }

    // =========================
    // AUTENTICACIÓN Y PERMISOS
    // =========================
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Rol> Roles { get; set; }
    public DbSet<Modulo> Modulos { get; set; }
    public DbSet<Permiso> Permisos { get; set; }
    public DbSet<UsuarioRol> UsuariosRoles { get; set; }
    public DbSet<RolPermiso> RolesPermisos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ===================================
        // CAMIÓN - CONDUCTOR (MUCHOS A MUCHOS)
        // ===================================
        modelBuilder.Entity<Camion>()
            .HasMany(c => c.ConductoresHabituales)
            .WithMany(c => c.CamionesHabituales)
            .UsingEntity<Dictionary<string, object>>(
                "CamionConductor",
                j => j.HasOne<Conductor>()
                    .WithMany()
                    .HasForeignKey("ConductorId")
                    .OnDelete(DeleteBehavior.Cascade),
                j => j.HasOne<Camion>()
                    .WithMany()
                    .HasForeignKey("CamionId")
                    .OnDelete(DeleteBehavior.Cascade)
            );

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
        // GASTO - CAMIÓN
        // =========================
        modelBuilder.Entity<Gasto>()
            .HasOne(g => g.Camion)
            .WithMany(c => c.Gastos)
            .HasForeignKey(g => g.CamionId)
            .OnDelete(DeleteBehavior.Restrict);

        // =========================
        // GASTO - VIAJE
        // =========================
        modelBuilder.Entity<Gasto>()
            .HasOne(g => g.Viaje)
            .WithMany(v => v.Gastos)
            .HasForeignKey(g => g.ViajeId)
            .OnDelete(DeleteBehavior.SetNull);

        // =========================
        // GASTO - MONTO
        // =========================
        modelBuilder.Entity<Gasto>()
            .Property(g => g.Monto)
            .HasPrecision(12, 2);

        // =========================
        // GASTO - FECHA
        // =========================
        modelBuilder.Entity<Gasto>()
            .Property(g => g.Fecha)
            .HasColumnType("date");

        // =========================
        // GASTO - REMOLQUE
        // =========================

        modelBuilder.Entity<GastoRemolque>()
            .HasOne(g => g.Remolque)
            .WithMany(r => r.Gastos)
            .HasForeignKey(g => g.RemolqueId)
            .OnDelete(DeleteBehavior.Restrict);

        // =========================
        // GASTO REMOLQUE - MONTO
        // =========================

        modelBuilder.Entity<GastoRemolque>()
            .Property(g => g.Monto)
            .HasPrecision(12, 2);

        // =========================
        // GASTO REMOLQUE - FECHA
        // =========================

        modelBuilder.Entity<GastoRemolque>()
            .Property(g => g.Fecha)
            .HasColumnType("date");
            
        // =========================
        // USUARIO - ROL
        // =========================
        modelBuilder.Entity<UsuarioRol>()
            .HasKey(ur => new
            {
                ur.UsuarioId,
                ur.RolId
            });

        modelBuilder.Entity<UsuarioRol>()
            .HasOne(ur => ur.Usuario)
            .WithMany(u => u.UsuariosRoles)
            .HasForeignKey(ur => ur.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UsuarioRol>()
            .HasOne(ur => ur.Rol)
            .WithMany(r => r.UsuariosRoles)
            .HasForeignKey(ur => ur.RolId)
            .OnDelete(DeleteBehavior.Cascade);

        // =========================
        // ROL - PERMISO
        // =========================
        modelBuilder.Entity<RolPermiso>()
            .HasKey(rp => new
            {
                rp.RolId,
                rp.PermisoId
            });

        modelBuilder.Entity<RolPermiso>()
            .HasOne(rp => rp.Rol)
            .WithMany(r => r.RolesPermisos)
            .HasForeignKey(rp => rp.RolId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RolPermiso>()
            .HasOne(rp => rp.Permiso)
            .WithMany(p => p.RolesPermisos)
            .HasForeignKey(rp => rp.PermisoId)
            .OnDelete(DeleteBehavior.Cascade);

        // =========================
        // PERMISO - MODULO
        // =========================
        modelBuilder.Entity<Permiso>()
            .HasOne(p => p.Modulo)
            .WithMany(m => m.Permisos)
            .HasForeignKey(p => p.ModuloId)
            .OnDelete(DeleteBehavior.Cascade);

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
        // CONDUCTOR - FECHAS
        // =========================
        modelBuilder.Entity<Conductor>()
            .Property(c => c.FechaNacimiento)
            .HasColumnType("date");

        modelBuilder.Entity<Conductor>()
            .Property(c => c.FechaIngreso)
            .HasColumnType("date");

        modelBuilder.Entity<Conductor>()
            .Property(c => c.FechaControlLicencia)
            .HasColumnType("date");

        // =========================
        // VIAJE - COMBUSTIBLE
        // =========================
        modelBuilder.Entity<Viaje>()
            .Property(v => v.LitrosCombustible)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Viaje>()
            .Property(v => v.CostoCombustible)
            .HasPrecision(12, 2);

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
        // ÍNDICES EXISTENTES
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

        modelBuilder.Entity<Viaje>()
            .HasIndex(v => v.NumeroGuiaDespacho)
            .IsUnique();

        // =========================
        // ÍNDICES AUTENTICACIÓN
        // =========================

        // RUT único por usuario
        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Rut)
            .IsUnique();

        // Email único para iniciar sesión
        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Nombre de rol único
        modelBuilder.Entity<Rol>()
            .HasIndex(r => r.Nombre)
            .IsUnique();

        // Código de módulo único
        modelBuilder.Entity<Modulo>()
            .HasIndex(m => m.Codigo)
            .IsUnique();

        // Código de permiso único
        modelBuilder.Entity<Permiso>()
            .HasIndex(p => p.Codigo)
            .IsUnique();
    }
}