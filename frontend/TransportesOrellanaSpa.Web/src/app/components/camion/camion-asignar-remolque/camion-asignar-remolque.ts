import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Camion } from '../../../core/models/camion';
import { Remolque } from '../../../core/models/remolque';

@Component({
  selector: 'app-camion-asignar-remolque',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './camion-asignar-remolque.html',
  styleUrl: './camion-asignar-remolque.scss'
})
export class CamionAsignarRemolque implements OnInit {

  private readonly api = inject(ApiService);

  camiones: Camion[] = [];
  remolques: Remolque[] = [];

  camionSeleccionado: Camion | null = null;
  remolqueSeleccionado: Remolque | null = null;

  patenteCamion = '';
  patenteRemolque = '';

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

    this.api.getCamiones().subscribe({

      next: camiones => {

        this.camiones = camiones;

        this.api.getRemolques().subscribe({

          next: remolques => {

            this.remolques = remolques;

            this.cargando = false;

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

  }

  seleccionarCamion(): void {

    this.camionSeleccionado =
      this.camiones.find(
        camion =>
          camion.patente === this.patenteCamion
      ) ?? null;

    this.patenteRemolque = '';
    this.remolqueSeleccionado = null;

  }

  seleccionarRemolque(): void {

    this.remolqueSeleccionado =
      this.remolques.find(
        remolque =>
          remolque.patente === this.patenteRemolque
      ) ?? null;

  }

  get remolqueActual(): Remolque | null {

    if (!this.camionSeleccionado) {
      return null;
    }

    return this.remolques.find(
      remolque =>
        remolque.camionHabitualId ===
        this.camionSeleccionado?.id
    ) ?? null;

  }

  get puedeAsignar(): boolean {

    return (
      !!this.camionSeleccionado &&
      !!this.remolqueSeleccionado &&
      !this.procesando
    );

  }

  get puedeDesasignar(): boolean {

    return (
      !!this.camionSeleccionado &&
      !!this.remolqueActual &&
      !this.procesando
    );

  }

  asignarRemolque(): void {

    if (
      !this.camionSeleccionado ||
      !this.remolqueSeleccionado
    ) {
      return;
    }

    this.procesando = true;

    this.api.asignarRemolqueHabitual(
      this.camionSeleccionado.patente,
      this.remolqueSeleccionado.patente
    ).subscribe({

      next: respuesta => {

        this.procesando = false;

        this.mostrarModal(
          'exito',
          'Remolque asignado',
          `El remolque ${respuesta.remolque} fue asignado correctamente al camión ${respuesta.camion}.`
        );

        this.cargarDatosDespuesDeOperacion();

      },

      error: error => {

        console.error(
          'Error al asignar remolque:',
          error
        );

        this.procesando = false;

        this.mostrarModal(
          'error',
          'No fue posible asignar',
          this.obtenerMensajeError(
            error,
            'No fue posible asignar el remolque al camión.'
          )
        );

      }

    });

  }

  desasignarRemolque(): void {

    if (!this.camionSeleccionado) {
      return;
    }

    this.procesando = true;

    this.api.desasignarRemolquesHabituales(
      this.camionSeleccionado.patente
    ).subscribe({

      next: respuesta => {

        this.procesando = false;

        this.mostrarModal(
          'exito',
          'Remolque desasignado',
          `Se eliminó correctamente el remolque habitual del camión ${respuesta.camion}.`
        );

        this.cargarDatosDespuesDeOperacion();

      },

      error: error => {

        console.error(
          'Error al desasignar remolque:',
          error
        );

        this.procesando = false;

        this.mostrarModal(
          'error',
          'No fue posible desasignar',
          this.obtenerMensajeError(
            error,
            'No fue posible desasignar el remolque.'
          )
        );

      }

    });

  }

  private cargarDatosDespuesDeOperacion(): void {

    this.api.getCamiones().subscribe({

      next: camiones => {

        this.camiones = camiones;

        this.api.getRemolques().subscribe({

          next: remolques => {

            this.remolques = remolques;

            if (this.patenteCamion) {

              this.camionSeleccionado =
                this.camiones.find(
                  camion =>
                    camion.patente ===
                    this.patenteCamion
                ) ?? null;

            }

            this.patenteRemolque = '';
            this.remolqueSeleccionado = null;

          },

          error: error => {

            console.error(
              'Error al actualizar remolques:',
              error
            );

          }

        });

      },

      error: error => {

        console.error(
          'Error al actualizar camiones:',
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