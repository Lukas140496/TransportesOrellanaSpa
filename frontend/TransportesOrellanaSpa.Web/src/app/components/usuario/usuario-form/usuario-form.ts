import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { UsuarioService } from '../../../core/services/usuario.service';

import { CrearUsuario } from '../../../core/models/usuario/crear-usuario';
import { Rol } from '../../../core/models/usuario/rol';
import { RutFormatDirective } from '../../../pipe/rut/rut-format.directive';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [
    FormsModule,
    RutFormatDirective
  ],
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.scss'
})
export class UsuarioForm implements OnInit {

  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);

  guardando = false;

  error = '';

  roles: Rol[] = [];

  modalExitoVisible = false;
  modalErrorVisible = false;
  modalIncompletoVisible = false;

  modalErrorTitulo = '';
  modalErrorMensaje = '';

  modalExitoTitulo = '';
  modalExitoMensaje = '';

  // Modal de cambios sin guardar
  modalSalirVisible = false;

  // Indica si el usuario modificó el formulario
  formularioModificado = false;

  // Resuelve la navegación cuando el guard está esperando
  private resolverSalida: ((salir: boolean) => void) | null = null;

  camposTocados: Record<string, boolean> = {};

  usuario: CrearUsuario = {
    rut: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    password: '',
    rolId: 0
  };

  repetirPassword = '';

  ngOnInit(): void {
    this.cargarRoles();
  }

  cargarRoles(): void {

    this.usuarioService.getRoles().subscribe({

      next: roles => {

        this.roles = roles;

      },

      error: error => {

        console.error(
          'Error al cargar roles:',
          error
        );

        this.modalErrorTitulo =
          'No fue posible cargar los roles';

        this.modalErrorMensaje =
          'Ocurrió un error al cargar los roles disponibles. Inténtalo nuevamente.';

        this.modalErrorVisible = true;

      }

    });

  }

  campoTocado(campo: string): void {

    this.camposTocados[campo] = true;

  }

  campoTieneError(campo: string): boolean {

    if (!this.camposTocados[campo]) {
      return false;
    }

    switch (campo) {

      case 'rut':
        return !this.usuario.rut.trim();

      case 'nombres':
        return !this.usuario.nombres.trim();

      case 'apellidoPaterno':
        return !this.usuario.apellidoPaterno.trim();

      case 'apellidoMaterno':
        return !this.usuario.apellidoMaterno.trim();

      case 'email':
        return !this.usuario.email.trim();

      case 'password':
        return !this.usuario.password;

      case 'repetirPassword':
        return (
          !this.repetirPassword ||
          this.repetirPassword !== this.usuario.password
        );

      case 'rolId':
        return !this.usuario.rolId;

      default:
        return false;

    }

  }

  private formularioValido(): boolean {

    const camposObligatorios = [
      'rut',
      'nombres',
      'apellidoPaterno',
      'apellidoMaterno',
      'email',
      'password',
      'repetirPassword',
      'rolId'
    ];

    camposObligatorios.forEach(campo => {
      this.camposTocados[campo] = true;
    });

    if (
      !this.usuario.rut.trim() ||
      !this.usuario.nombres.trim() ||
      !this.usuario.apellidoPaterno.trim() ||
      !this.usuario.apellidoMaterno.trim() ||
      !this.usuario.email.trim() ||
      !this.usuario.password ||
      !this.usuario.rolId
    ) {
      return false;
    }

    if (this.usuario.password.length < 6) {
      return false;
    }

    if (this.usuario.password !== this.repetirPassword) {
      this.camposTocados['repetirPassword'] = true;
      return false;
    }

    return true;

  }

  marcarFormularioModificado(): void {

    if (!this.guardando) {
      this.formularioModificado = true;
    }

  }

  puedeSalir(): boolean | Promise<boolean> {

    if (this.guardando) {
      return false;
    }

    if (!this.formularioModificado) {
      return true;
    }

    this.modalSalirVisible = true;

    return new Promise<boolean>((resolve) => {
      this.resolverSalida = resolve;
    });

  }

  seguirEditando(): void {

    this.modalSalirVisible = false;

    if (this.resolverSalida) {

      this.resolverSalida(false);

      this.resolverSalida = null;

    }

  }

  salirSinGuardar(): void {

    this.modalSalirVisible = false;

    if (this.resolverSalida) {

      this.formularioModificado = false;

      this.resolverSalida(true);

      this.resolverSalida = null;

      return;

    }

    this.formularioModificado = false;

    this.router.navigate([
      '/usuarios'
    ]);

  }

  guardar(): void {

    if (this.guardando) {
      return;
    }

    this.error = '';

    if (!this.formularioValido()) {

      this.modalIncompletoVisible = true;

      return;

    }

    this.guardando = true;

    const usuario: CrearUsuario = {

      rut:
        this.usuario.rut.trim(),

      nombres:
        this.usuario.nombres.trim(),

      apellidoPaterno:
        this.usuario.apellidoPaterno.trim(),

      apellidoMaterno:
        this.usuario.apellidoMaterno.trim(),

      email:
        this.usuario.email.trim(),

      password:
        this.usuario.password,

      rolId:
        this.usuario.rolId

    };

    this.usuarioService.crearUsuario(usuario).subscribe({

      next: resultado => {

        this.guardando = false;

        this.formularioModificado = false;

        this.modalExitoTitulo =
          'Usuario creado correctamente';

        this.modalExitoMensaje =
          'El usuario fue registrado exitosamente.';

        this.modalExitoVisible = true;

      },

      error: error => {

        console.error(
          'Error al crear usuario:',
          error
        );

        this.guardando = false;

        this.modalErrorTitulo =
          'No se pudo crear el usuario';

        if (error.status === 409) {

          this.modalErrorMensaje =
            error.error ||
            'Ya existe un usuario registrado con ese RUT o correo electrónico.';

        } else {

          this.modalErrorMensaje =
            'Ocurrió un error al intentar guardar el usuario. Inténtalo nuevamente.';

        }

        this.modalErrorVisible = true;

      }

    });

  }

  cerrarModalIncompleto(): void {

    this.modalIncompletoVisible = false;

  }

  cerrarModalError(): void {

    this.modalErrorVisible = false;

  }

  cerrarModalExito(): void {

    this.modalExitoVisible = false;

    this.router.navigate([
      '/usuarios'
    ]);

  }

  volver(): void {

    if (this.guardando) {
      return;
    }

    if (this.formularioModificado) {

      this.modalSalirVisible = true;

      return;

    }

    this.router.navigate([
      '/usuarios'
    ]);

  }

}