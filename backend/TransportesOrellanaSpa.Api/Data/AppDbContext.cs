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
    public DbSet<GastoConductor> GastosConductor { get; set; }
    public DbSet<DocumentoCamion> DocumentosCamion { get; set; } = null!;
    public DbSet<DocumentoViaje> DocumentosViaje { get; set; }
    public DbSet<DocumentoConductor> DocumentosConductor { get; set; } = null!;
    public DbSet<DocumentoRemolque> DocumentosRemolque { get; set; } = null!;

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
        // CONDUCTOR - DOCUMENTOS
        // ===================================

        modelBuilder.Entity<DocumentoConductor>()
            .ToTable("DocumentoConductor");

        modelBuilder.Entity<DocumentoConductor>()
            .HasOne(d => d.Conductor)
            .WithMany(c => c.Documentos)
            .HasForeignKey(d => d.ConductorId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DocumentoConductor>()
            .Property(d => d.TipoDocumento)
            .HasMaxLength(50)
            .IsRequired();

        modelBuilder.Entity<DocumentoConductor>()
            .Property(d => d.NombreArchivo)
            .HasMaxLength(255)
            .IsRequired();

        modelBuilder.Entity<DocumentoConductor>()
            .Property(d => d.BlobName)
            .HasMaxLength(500)
            .IsRequired();

        modelBuilder.Entity<DocumentoConductor>()
            .Property(d => d.ContentType)
            .HasMaxLength(150)
            .IsRequired();

        modelBuilder.Entity<DocumentoConductor>()
            .Property(d => d.Periodo)
            .HasMaxLength(7);

        modelBuilder.Entity<DocumentoConductor>()
            .HasIndex(d => d.BlobName)
            .IsUnique();

        modelBuilder.Entity<DocumentoConductor>()
            .HasIndex(d => new
            {
                d.ConductorId,
                d.TipoDocumento,
                d.Periodo
            });


        // ===================================
        // REMOLQUE - DOCUMENTOS
        // ===================================

        modelBuilder.Entity<DocumentoRemolque>()
            .ToTable("DocumentoRemolque");

        modelBuilder.Entity<DocumentoRemolque>()
            .HasOne(d => d.Remolque)
            .WithMany(r => r.Documentos)
            .HasForeignKey(d => d.RemolqueId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DocumentoRemolque>()
            .Property(d => d.TipoDocumento)
            .HasMaxLength(50)
            .IsRequired();

        modelBuilder.Entity<DocumentoRemolque>()
            .Property(d => d.NombreArchivo)
            .HasMaxLength(255)
            .IsRequired();

        modelBuilder.Entity<DocumentoRemolque>()
            .Property(d => d.BlobName)
            .HasMaxLength(500)
            .IsRequired();

        modelBuilder.Entity<DocumentoRemolque>()
            .Property(d => d.ContentType)
            .HasMaxLength(150)
            .IsRequired();

        // Un documento por tipo para cada remolque.
        modelBuilder.Entity<DocumentoRemolque>()
            .HasIndex(d => new
            {
                d.RemolqueId,
                d.TipoDocumento
            })
            .IsUnique();

        modelBuilder.Entity<DocumentoRemolque>()
            .HasIndex(d => d.BlobName)
            .IsUnique();

        // =========================
        // DOCUMENTO - VIAJE
        // =========================

        modelBuilder.Entity<DocumentoViaje>()
            .ToTable("DocumentoViaje");

        modelBuilder.Entity<DocumentoViaje>()
            .HasOne(d => d.Viaje)
            .WithMany(v => v.Documentos)
            .HasForeignKey(d => d.ViajeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DocumentoViaje>()
            .Property(d => d.TipoDocumento)
            .HasConversion<string>();

        modelBuilder.Entity<DocumentoViaje>()
            .Property(d => d.NombreArchivo)
            .HasMaxLength(255)
            .IsRequired();

        modelBuilder.Entity<DocumentoViaje>()
            .Property(d => d.BlobName)
            .HasMaxLength(500)
            .IsRequired();

        modelBuilder.Entity<DocumentoViaje>()
            .Property(d => d.ContentType)
            .HasMaxLength(150)
            .IsRequired();

        modelBuilder.Entity<DocumentoViaje>()
            .HasIndex(d => d.BlobName)
            .IsUnique();

        modelBuilder.Entity<DocumentoViaje>()
            .HasIndex(d => new
            {
                d.ViajeId,
                d.TipoDocumento
            });

        // ===================================
        // CAMIÓN - DOCUMENTOS
        // ===================================
        modelBuilder.Entity<DocumentoCamion>()
            .ToTable("DocumentoCamion");

        modelBuilder.Entity<DocumentoCamion>()
            .HasOne(d => d.Camion)
            .WithMany(c => c.Documentos)
            .HasForeignKey(d => d.CamionId)
            .OnDelete(DeleteBehavior.Cascade);

        // Un documento por tipo para cada camión.
        modelBuilder.Entity<DocumentoCamion>()
            .HasIndex(d => new { d.CamionId, d.TipoDocumento })
            .IsUnique();

        // Un nombre de blob único por documento.
        modelBuilder.Entity<DocumentoCamion>()
            .HasIndex(d => d.BlobName)
            .IsUnique();


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
        // GASTO - CONDUCTOR
        // =========================
        modelBuilder.Entity<GastoConductor>()
            .HasOne(g => g.Conductor)
            .WithMany()
            .HasForeignKey(g => g.ConductorId)
            .OnDelete(DeleteBehavior.Restrict);

        // =========================
        // GASTO CONDUCTOR - MONTO
        // =========================
        modelBuilder.Entity<GastoConductor>()
            .Property(g => g.Monto)
            .HasPrecision(12, 2);

        // =========================
        // GASTO CONDUCTOR - FECHA
        // =========================
        modelBuilder.Entity<GastoConductor>()
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