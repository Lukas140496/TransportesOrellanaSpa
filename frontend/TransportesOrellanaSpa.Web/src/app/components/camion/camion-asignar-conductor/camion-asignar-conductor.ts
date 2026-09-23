import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../core/services/api.service';
import { Camion } from '../../../core/models/camion';
import { Conductor } from '../../../core/models/conductor';

@Component({
  selector: 'app-camion-asignar-conductor',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './camion-asignar-conductor.html',
  styleUrl: './camion-asignar-conductor.scss'
})
export class CamionAsignarConductor implements OnInit {

  private readonly api = inject(ApiService);

  camiones: Camion[] = [];
  conductores: Conductor[] = [];

  camionSeleccionado: Camion | null = null;
  conductorSeleccionado: Conductor | null = null;

  patenteCamion = '';
  rutConductor = '';

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

        this.api.getConductores().subscribe({

          next: conductores => {

            this.conductores = conductores;
            this.cargando = false;

          },

          error: error => {

            console.error(
              'Error al cargar conductores:',
              error
            );

            this.error =
              'No fue posible cargar los conductores.';

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

    this.rutConductor = '';
    this.conductorSeleccionado = null;

  }

  seleccionarConductor(): void {

    this.conductorSeleccionado =
      this.conductores.find(
        conductor =>
          conductor.rut === this.rutConductor
      ) ?? null;

  }

  get conductoresActuales(): Conductor[] {

    if (!this.camionSeleccionado) {
      return [];
    }

    const ruts =
      this.camionSeleccionado.conductoresHabituales
        .map(conductor => conductor.rut);

    return this.conductores.filter(
      conductor =>
        ruts.includes(conductor.rut)
    );

  }

  get camionDelConductor(): Camion | null {

    if (!this.conductorSeleccionado) {
      return null;
    }

    return (
      this.camiones.find(
        camion =>
          camion.patente !==
            this.camionSeleccionado?.patente &&
          camion.conductoresHabituales.some(
            conductor =>
              conductor.rut ===
              this.conductorSeleccionado?.rut
          )
      ) ?? null
    );

  }

  get conductorYaAsignadoAlCamion(): boolean {

    if (
      !this.camionSeleccionado ||
      !this.conductorSeleccionado
    ) {
      return false;
    }

    return this.camionSeleccionado
      .conductoresHabituales
      .some(
        conductor =>
          conductor.rut ===
          this.conductorSeleccionado?.rut
      );

  }

  get puedeAsignar(): boolean {

    return (
      !!this.camionSeleccionado &&
      !!this.conductorSeleccionado &&
      !this.conductorYaAsignadoAlCamion &&
      !this.procesando
    );

  }

  get puedeDesasignar(): boolean {

    return (
      !!this.camionSeleccionado &&
      !!this.conductorSeleccionado &&
      this.conductorYaAsignadoAlCamion &&
      !this.procesando
    );

  }

  asignarConductor(): void {

    if (
      !this.camionSeleccionado ||
      !this.conductorSeleccionado
    ) {
      return;
    }

    this.procesando = true;

    this.api.asignarConductorHabitual(
      this.camionSeleccionado.patente,
      this.conductorSeleccionado.rut
    ).subscribe({

      next: respuesta => {

        this.procesando = false;

        this.mostrarModal(
          'exito',
          'Conductor asignado',
          `El conductor ${this.obtenerNombreConductor(
            this.conductorSeleccionado
          )} fue asignado correctamente al camión ${respuesta.camion.patente}.`
        );

        this.cargarDatosDespuesDeOperacion();

      },

      error: error => {

        console.error(
          'Error al asignar conductor:',
          error
        );

        this.procesando = false;

        this.mostrarModal(
          'error',
          'No fue posible asignar',
          this.obtenerMensajeError(
            error,
            'No fue posible asignar el conductor al camión.'
          )
        );

      }

    });

  }

  desasignarConductor(): void {

    if (
      !this.camionSeleccionado ||
      !this.conductorSeleccionado
    ) {
      return;
    }

    this.procesando = true;

    this.api.desasignarConductorHabitual(
      this.camionSeleccionado.patente,
      this.conductorSeleccionado.rut
    ).subscribe({

      next: respuesta => {

        this.procesando = false;

        this.mostrarModal(
          'exito',
          'Conductor desasignado',
          `El conductor ${respuesta.conductor} fue desasignado correctamente del camión ${respuesta.camion}.`
        );

        this.cargarDatosDespuesDeOperacion();

      },

      error: error => {

        console.error(
          'Error al desasignar conductor:',
          error
        );

        this.procesando = false;

        this.mostrarModal(
          'error',
          'No fue posible desasignar',
          this.obtenerMensajeError(
            error,
            'No fue posible desasignar el conductor.'
          )
        );

      }

    });

  }

  private cargarDatosDespuesDeOperacion(): void {

    this.api.getCamiones().subscribe({

      next: camiones => {

        this.camiones = camiones;

        this.api.getConductores().subscribe({

          next: conductores => {

            this.conductores = conductores;

            if (this.patenteCamion) {

              this.camionSeleccionado =
                this.camiones.find(
                  camion =>
                    camion.patente ===
                    this.patenteCamion
                ) ?? null;

            }

            this.rutConductor = '';
            this.conductorSeleccionado = null;

          },

          error: error => {

            console.error(
              'Error al actualizar conductores:',
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

  private obtenerNombreConductor(
    conductor: Conductor | null
  ): string {

    if (!conductor) {
      return '';
    }

    return (
      `${conductor.nombres} ${conductor.apellidoPaterno ?? ''}`
    ).trim();

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