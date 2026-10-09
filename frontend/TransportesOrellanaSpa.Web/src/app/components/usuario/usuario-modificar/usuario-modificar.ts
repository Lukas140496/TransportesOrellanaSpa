import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { UsuarioService } from '../../../core/services/usuario.service';

import { Usuario } from '../../../core/models/usuario/usuario';
import { EditarUsuario } from '../../../core/models/usuario/editar-usuario';
import { Rol } from '../../../core/models/usuario/rol';

import { RutFormatDirective } from '../../../pipe/rut/rut-format.directive';

@Component({
  selector: 'app-usuario-modificar',
  standalone: true,
  imports: [
    FormsModule,
    RutFormatDirective
  ],
  templateUrl: './usuario-modificar.html',
  styleUrl: './usuario-modificar.scss'
})
export class UsuarioModificar implements OnInit {

  private readonly usuarioService = inject(UsuarioService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  usuarioId = 0;

  usuario: EditarUsuario = {
    rut: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    rolId: 0
  };

  roles: Rol[] = [];

  cargando = true;
  guardando = false;

  error = '';

  modalExitoVisible = false;
  modalErrorVisible = false;
  modalIncompletoVisible = false;

  modalErrorTitulo = '';
  modalErrorMensaje = '';

  modalExitoTitulo = '';
  modalExitoMensaje = '';

  camposTocados: Record<string, boolean> = {};

  ngOnInit(): void {

    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!id) {

      this.error =
        'No se pudo identificar el usuario.';

      this.cargando = false;

      return;

    }

    this.usuarioId = id;

    this.cargarDatos();

  }

  cargarDatos(): void {

    this.cargando = true;
    this.error = '';

    this.usuarioService.getRoles().subscribe({

      next: roles => {

        this.roles = roles;

        this.usuarioService.getUsuarios().subscribe({

          next: usuarios => {

            const usuarioEncontrado =
              usuarios.find(
                usuario =>
                  usuario.usuarioId === this.usuarioId
              );

            if (!usuarioEncontrado) {

              this.error =
                'No se encontró el usuario.';

              this.cargando = false;

              return;

            }

            this.cargarUsuario(
              usuarioEncontrado
            );

            this.cargando = false;

          },

          error: error => {

            console.error(
              'Error al cargar usuario:',
              error
            );

            this.error =
              'No fue posible cargar el usuario.';

            this.cargando = false;

          }

        });

      },

      error: error => {

        console.error(
          'Error al cargar roles:',
          error
        );

        this.error =
          'No fue posible cargar los roles.';

        this.cargando = false;

      }

    });

  }

  private cargarUsuario(
    usuario: Usuario
  ): void {

    this.usuario = {

      rut:
        usuario.rut,

      nombres:
        usuario.nombres,

      apellidoPaterno:
        usuario.apellidoPaterno,

      apellidoMaterno:
        usuario.apellidoMaterno,

      email:
        usuario.email,

      rolId:
        this.obtenerRolId(usuario)

    };

  }

  private obtenerRolId(
    usuario: Usuario
  ): number {

    const nombreRol =
      usuario.roles?.[0];

    if (!nombreRol) {
      return 0;
    }

    const rol =
      this.roles.find(
        item =>
          item.nombre === nombreRol
      );

    return rol?.id ?? 0;

  }

  campoTocado(
    campo: string
  ): void {

    this.camposTocados[campo] = true;

  }

  campoTieneError(
    campo: string
  ): boolean {

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
      'rolId'
    ];

    camposObligatorios.forEach(
      campo => {
        this.camposTocados[campo] = true;
      }
    );

    return (
      !!this.usuario.rut.trim() &&
      !!this.usuario.nombres.trim() &&
      !!this.usuario.apellidoPaterno.trim() &&
      !!this.usuario.apellidoMaterno.trim() &&
      !!this.usuario.email.trim() &&
      !!this.usuario.rolId
    );

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

    const datos: EditarUsuario = {

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

      rolId:
        this.usuario.rolId

    };

    this.usuarioService.editarUsuario(
      this.usuarioId,
      datos
    ).subscribe({

      next: respuesta => {

        this.guardando = false;

        this.modalExitoTitulo =
          'Usuario actualizado correctamente';

        this.modalExitoMensaje =
          respuesta.mensaje ||
          'Los datos del usuario fueron actualizados correctamente.';

        this.modalExitoVisible = true;

      },

      error: error => {

        console.error(
          'Error al modificar usuario:',
          error
        );

        this.guardando = false;

        this.modalErrorTitulo =
          'No se pudo actualizar el usuario';

        if (error.status === 409) {

          this.modalErrorMensaje =
            error.error?.mensaje ||
            error.error ||
            'Ya existe otro usuario registrado con ese RUT o correo electrónico.';

        } else {

          this.modalErrorMensaje =
            error.error?.mensaje ||
            'Ocurrió un error al intentar actualizar el usuario.';

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

    this.router.navigate([
      '/usuarios'
    ]);

  }

}