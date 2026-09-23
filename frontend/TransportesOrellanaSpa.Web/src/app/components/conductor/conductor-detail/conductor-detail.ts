import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';

import { ApiService } from '../../../core/services/api.service';
import { Conductor } from '../../../core/models/conductor';

@Component({
  selector: 'app-conductor-detail',
  imports: [DatePipe],
  templateUrl: './conductor-detail.html',
  styleUrl: './conductor-detail.scss'
})
export class ConductorDetail implements OnInit {

  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  conductor: Conductor | null = null;

  cargando = true;
  error = '';

  activando = false;

  modalActivarVisible = false;
  modalExitoVisible = false;
  modalErrorVisible = false;

  modalErrorTitulo = '';
  modalErrorMensaje = '';

  ngOnInit(): void {

    const rut = this.route.snapshot.paramMap.get('rut');

    if (!rut) {
      this.error = 'No se especificó un RUT.';
      this.cargando = false;
      return;
    }

    this.api.getConductorByRut(rut).subscribe({
      next: conductor => {
        this.conductor = conductor;
        this.cargando = false;
      },
      error: error => {
        console.error('Error al cargar conductor:', error);

        this.error = 'No fue posible cargar la información del conductor.';
        this.cargando = false;
      }
    });

  }

  volver(): void {
    this.router.navigate(['/conductores']);
  }

  abrirModalActivar(): void {

    if (!this.conductor || this.conductor.activo) {
      return;
    }

    this.modalActivarVisible = true;

  }

  cerrarModalActivar(): void {

    if (this.activando) {
      return;
    }

    this.modalActivarVisible = false;

  }

  confirmarActivacion(): void {

    if (
      !this.conductor ||
      this.activando
    ) {
      return;
    }

    this.activando = true;

    const rut = this.conductor.rut;

    this.api.activarConductor(rut).subscribe({

      next: () => {

        this.activando = false;

        this.modalActivarVisible = false;

        if (this.conductor) {
          this.conductor = {
            ...this.conductor,
            activo: true
          };
        }

        this.modalExitoVisible = true;

      },

      error: (error) => {

        this.activando = false;

        this.modalActivarVisible = false;

        if (error?.status === 409) {

          this.mostrarError(
            'Conductor ya activo',
            'El conductor seleccionado ya se encuentra activo.'
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
          'Error al activar',
          'No fue posible activar el conductor. Inténtalo nuevamente.'
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