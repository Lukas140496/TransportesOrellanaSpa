import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  ApiService
} from '../../../core/services/api.service';

import {
  Conductor
} from '../../../core/models/conductor';

@Component({

  selector: 'app-conductor-desactivar',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './conductor-desactivar.html',

  styleUrl: './conductor-desactivar.scss',

})

export class ConductorDesactivar implements OnInit {

  conductores: Conductor[] = [];

  conductoresFiltrados: Conductor[] = [];

  cargando = false;

  desactivando = false;

  busqueda = '';

  conductorSeleccionado: Conductor | null = null;

  modalDesactivarVisible = false;

  modalExitoVisible = false;

  modalErrorVisible = false;

  modalErrorTitulo = '';

  modalErrorMensaje = '';

  ngOnInit(): void {

    this.cargarConductores();

  }

  cargarConductores(): void {

    this.cargando = true;

    this.conductorSeleccionado = null;

    this.apiService.getConductores().subscribe({

      next: (conductores) => {

        this.conductores = conductores.filter(
          conductor => conductor.activo
        );

        this.filtrarConductores();

        this.cargando = false;

      },

      error: () => {

        this.cargando = false;

        this.mostrarError(
          'Error al cargar conductores',
          'No fue posible cargar la lista de conductores.'
        );

      }

    });

  }

  constructor(
    private apiService: ApiService
  ) {}

  filtrarConductores(): void {

    const texto = this.busqueda
      .trim()
      .toLowerCase();

    if (!texto) {

      this.conductoresFiltrados = [
        ...this.conductores
      ];

      return;

    }

    this.conductoresFiltrados =
      this.conductores.filter(conductor => {

        const nombreCompleto =
          `${conductor.nombres} ${conductor.apellidoPaterno} ${conductor.apellidoMaterno}`
            .toLowerCase();

        return (
          conductor.rut.toLowerCase().includes(texto) ||
          nombreCompleto.includes(texto) ||
          conductor.telefono.toLowerCase().includes(texto)
        );

      });

  }

  seleccionarConductor(
    conductor: Conductor
  ): void {

    this.conductorSeleccionado = conductor;

  }

  abrirModalDesactivar(): void {

    if (!this.conductorSeleccionado) {
      return;
    }

    this.modalDesactivarVisible = true;

  }

  cerrarModalDesactivar(): void {

    if (this.desactivando) {
      return;
    }

    this.modalDesactivarVisible = false;

  }

  confirmarDesactivacion(): void {

    if (
      !this.conductorSeleccionado ||
      this.desactivando
    ) {
      return;
    }

    this.desactivando = true;

    const rut =
      this.conductorSeleccionado.rut;

    this.apiService
      .desactivarConductor(rut)
      .subscribe({

        next: () => {

          this.desactivando = false;

          this.modalDesactivarVisible = false;

          this.modalExitoVisible = true;

          this.conductores =
            this.conductores.filter(
              conductor => conductor.rut !== rut
            );

          this.filtrarConductores();

          this.conductorSeleccionado = null;

        },

        error: (error) => {

          this.desactivando = false;

          this.modalDesactivarVisible = false;

          if (error?.status === 409) {

            this.mostrarError(
              'Conductor ya inactivo',
              'El conductor seleccionado ya se encuentra inactivo.'
            );

            return;

          }

          if (error?.status === 404) {

            this.mostrarError(
              'Conductor no encontrado',
              'El conductor seleccionado ya no existe.'
            );

            return;

          }

          this.mostrarError(
            'Error al desactivar',
            'No fue posible desactivar el conductor. Inténtalo nuevamente.'
          );

        }

      });

  }

  cerrarModalExito(): void {

    this.modalExitoVisible = false;

  }

  mostrarError(
    titulo: string,
    mensaje: string
  ): void {

    this.modalErrorTitulo = titulo;

    this.modalErrorMensaje = mensaje;

    this.modalErrorVisible = true;

  }

  cerrarModalError(): void {

    this.modalErrorVisible = false;

  }

}