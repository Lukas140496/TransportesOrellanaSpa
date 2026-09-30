import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioPerfil } from '../../core/models/usuario-perfil';
import { ActualizarMiPerfil } from '../../core/models/actualizar-mi-perfil';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.scss'
})
export class MiPerfil {

  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);

  perfil: UsuarioPerfil | null = null;

  cargando = true;
  guardando = false;

  error = '';
  mensajeExito = '';

  editando = false;

  formularioModificado = false;

  datosEditados: ActualizarMiPerfil = {
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: ''
  };

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.cargando = true;
    this.error = '';
    this.mensajeExito = '';

    this.apiService.getMiPerfil().subscribe({
      next: (perfil) => {
        this.perfil = perfil;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No fue posible cargar la información del perfil.';
        this.cargando = false;
      }
    });
  }

  iniciarEdicion(): void {
    if (!this.perfil) {
      return;
    }

    this.datosEditados = {
      nombres: this.perfil.nombres,
      apellidoPaterno: this.perfil.apellidoPaterno,
      apellidoMaterno: this.perfil.apellidoMaterno,
      email: this.perfil.email
    };

    this.error = '';
    this.mensajeExito = '';
    this.formularioModificado = false;
    this.editando = true;
  }

  cancelarEdicion(): void {
    this.editando = false;
    this.formularioModificado = false;
    this.error = '';
    this.mensajeExito = '';
  }

  marcarFormularioModificado(): void {
    this.formularioModificado = true;
  }

  guardarCambios(): void {

    if (this.guardando) {
      return;
    }

    this.error = '';
    this.mensajeExito = '';

    const datos: ActualizarMiPerfil = {
      nombres: this.datosEditados.nombres.trim(),
      apellidoPaterno: this.datosEditados.apellidoPaterno.trim(),
      apellidoMaterno: this.datosEditados.apellidoMaterno.trim(),
      email: this.datosEditados.email.trim()
    };

    if (
      !datos.nombres ||
      !datos.apellidoPaterno ||
      !datos.apellidoMaterno ||
      !datos.email
    ) {
      this.error = 'Todos los campos son obligatorios.';
      return;
    }

    this.guardando = true;

    this.apiService.actualizarMiPerfil(datos).subscribe({
      next: () => {

        this.apiService.getMiPerfil().subscribe({
          next: (perfilActualizado) => {

            this.perfil = perfilActualizado;

            this.authService.actualizarUsuarioLocalmente(
              perfilActualizado
            );

            this.guardando = false;
            this.editando = false;
            this.formularioModificado = false;

            this.mensajeExito =
              'Tus datos fueron actualizados correctamente.';
          },

          error: () => {
            this.guardando = false;

            this.error =
              'Los cambios se guardaron, pero no fue posible actualizar la información mostrada.';
          }
        });

      },

      error: (error) => {
        this.guardando = false;

        if (error.status === 409) {
          this.error =
            error.error?.mensaje ??
            'El correo electrónico ya está registrado.';
          return;
        }

        if (error.status === 400) {
          this.error =
            error.error?.mensaje ??
            'Revisa los datos ingresados.';
          return;
        }

        this.error =
          'No fue posible actualizar tus datos. Inténtalo nuevamente.';
      }
    });
  }

  get iniciales(): string {
    if (!this.perfil) {
      return '';
    }

    const nombres = this.perfil.nombres
      ?.trim()
      .split(/\s+/)
      .filter(Boolean) ?? [];

    const apellido = this.perfil.apellidoPaterno?.trim() ?? '';

    const inicialNombre = nombres[0]?.charAt(0) ?? '';
    const inicialApellido = apellido.charAt(0);

    return `${inicialNombre}${inicialApellido}`.toUpperCase();
  }

  get rolPrincipal(): string {
    return this.perfil?.roles?.[0] ?? '';
  }

  get fechaCreacionFormateada(): string {
    if (!this.perfil?.fechaCreacion) {
      return '-';
    }

    return new Date(this.perfil.fechaCreacion).toLocaleDateString(
      'es-CL',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }
    );
  }

  get ultimoAccesoFormateado(): string {
    if (!this.perfil?.ultimoAcceso) {
      return 'Nunca';
    }

    return new Date(this.perfil.ultimoAcceso).toLocaleString(
      'es-CL',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    );
  }
}