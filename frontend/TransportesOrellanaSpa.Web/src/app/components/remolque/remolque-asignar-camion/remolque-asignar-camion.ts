import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../core/services/api.service';
import { Camion } from '../../../core/models/camion';
import { Remolque } from '../../../core/models/remolque';

@Component({
  selector: 'app-remolque-asignar-camion',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './remolque-asignar-camion.html',
  styleUrl: './remolque-asignar-camion.scss'
})
export class RemolqueAsignarCamion implements OnInit {

  private readonly api = inject(ApiService);

  remolques: Remolque[] = [];
  camiones: Camion[] = [];

  remolqueSeleccionado: Remolque | null = null;
  camionSeleccionado: Camion | null = null;

  patenteRemolque = '';
  patenteCamion = '';

  cargando = true;
  procesando = false;

  error = '';

  modalVisible = false;
  modalTipo: 'exito' | 'error' = 'exito';
  modalTitulo = '';
  modalMensaje = '';

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {

    this.cargando = true;
    this.error = '';

    this.api.getRemolques().subscribe({

      next: remolques => {

        this.remolques = remolques;

        this.api.getCamiones().subscribe({

          next: camiones => {

            this.camiones = camiones;
            this.cargando = false;

          },

          error: error => {

            console.error(
              'Error al cargar camiones:',
              error
            );

            this.error =
              'No fue posible cargar los camiones.';

            this.cargando = false;

          }

        });

      },

      error: error => {

        console.error(
          'Error al cargar remolques:',
          error
        );

        this.error =
          'No fue posible cargar los remolques.';

        this.cargando = false;

      }

    });

  }

  seleccionarRemolque(): void {

    this.remolqueSeleccionado =
      this.remolques.find(
        remolque =>
          remolque.patente ===
          this.patenteRemolque
      ) ?? null;

    this.patenteCamion = '';
    this.camionSeleccionado = null;

  }

  seleccionarCamion(): void {

    this.camionSeleccionado =
      this.camiones.find(
        camion =>
          camion.patente ===
          this.patenteCamion
      ) ?? null;

  }

  get camionActual(): Camion | null {

    if (!this.remolqueSeleccionado) {
      return null;
    }

    return (
      this.camiones.find(
        camion =>
          camion.id ===
          this.remolqueSeleccionado?.camionHabitualId
      ) ?? null
    );

  }

  get puedeAsignar(): boolean {

    return (
      !!this.remolqueSeleccionado &&
      !!this.camionSeleccionado &&
      !this.procesando &&
      !this.camionYaAsignadoAlRemolque
    );

  }

  get puedeDesasignar(): boolean {

    return (
      !!this.remolqueSeleccionado &&
      !!this.camionActual &&
      !this.procesando
    );

  }

  get camionYaAsignadoAlRemolque(): boolean {

    if (
      !this.remolqueSeleccionado ||
      !this.camionSeleccionado
    ) {
      return false;
    }

    return (
      this.remolqueSeleccionado.camionHabitualId ===
      this.camionSeleccionado.id
    );

  }

  asignarCamion(): void {

    if (
      !this.remolqueSeleccionado ||
      !this.camionSeleccionado
    ) {
      return;
    }

    this.procesando = true;

    this.api.asignarCamionHabitual(
      this.remolqueSeleccionado.patente,
      this.camionSeleccionado.patente
    ).subscribe({

      next: respuesta => {

        this.procesando = false;

        this.mostrarModal(
          'exito',
          'Camión asignado',
          `El camión ${respuesta.camion} fue asignado correctamente al remolque ${respuesta.remolque}.`
        );

        this.cargarDatosDespuesDeOperacion();

      },

      error: error => {

        console.error(
          'Error al asignar camión:',
          error
        );

        this.procesando = false;

        this.mostrarModal(
          'error',
          'No fue posible asignar',
          this.obtenerMensajeError(
            error,
            'No fue posible asignar el camión al remolque.'
          )
        );

      }

    });

  }

  desasignarCamion(): void {

    if (!this.remolqueSeleccionado) {
      return;
    }

    this.procesando = true;

    this.api.desasignarCamionHabitual(
      this.remolqueSeleccionado.patente
    ).subscribe({

      next: respuesta => {

        this.procesando = false;

        this.mostrarModal(
          'exito',
          'Camión desasignado',
          `El camión habitual fue desasignado correctamente del remolque ${respuesta.remolque}.`
        );

        this.cargarDatosDespuesDeOperacion();

      },

      error: error => {

        console.error(
          'Error al desasignar camión:',
          error
        );

        this.procesando = false;

        this.mostrarModal(
          'error',
          'No fue posible desasignar',
          this.obtenerMensajeError(
            error,
            'No fue posible desasignar el camión del remolque.'
          )
        );

      }

    });

  }

  private cargarDatosDespuesDeOperacion(): void {

    this.api.getRemolques().subscribe({

      next: remolques => {

        this.remolques = remolques;

        this.api.getCamiones().subscribe({

          next: camiones => {

            this.camiones = camiones;

            if (this.patenteRemolque) {

              this.remolqueSeleccionado =
                this.remolques.find(
                  remolque =>
                    remolque.patente ===
                    this.patenteRemolque
                ) ?? null;

            }

            this.patenteCamion = '';
            this.camionSeleccionado = null;

          },

          error: error => {

            console.error(
              'Error al actualizar camiones:',
              error
            );

          }

        });

      },

      error: error => {

        console.error(
          'Error al actualizar remolques:',
          error
        );

      }

    });

  }

  private mostrarModal(
    tipo: 'exito' | 'error',
    titulo: string,
    mensaje: string
  ): void {

    this.modalTipo = tipo;
    this.modalTitulo = titulo;
    this.modalMensaje = mensaje;
    this.modalVisible = true;

  }

  cerrarModal(): void {

    this.modalVisible = false;

  }

  private obtenerMensajeError(
    error: any,
    mensajePorDefecto: string
  ): string {

    return (
      error?.error?.mensaje ||
      error?.error?.message ||
      mensajePorDefecto
    );

  }

}