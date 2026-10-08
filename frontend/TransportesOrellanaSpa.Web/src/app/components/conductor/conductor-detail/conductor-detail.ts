import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';

import { ApiService } from '../../../core/services/api.service';
import { Conductor } from '../../../core/models/conductor';
import { PermissionService } from '../../../core/services/permission.service';

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
  readonly permissionService = inject(PermissionService);

  conductor: Conductor | null = null;

  cargando = true;
  error = '';

  modalEstadoVisible = false;
  modalExitoVisible = false;
  modalErrorVisible = false;

  modalExitoTitulo = '';
  modalExitoMensaje = '';

  modalErrorTitulo = '';
  modalErrorMensaje = '';

  procesandoEstado = false;

  ngOnInit(): void {

    const rut =
      this.route.snapshot.paramMap.get('rut');

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

        console.error(
          'Error al cargar conductor:',
          error
        );

        this.error =
          'No fue posible cargar la información del conductor.';

        this.cargando = false;

      }

    });

  }

  editarConductor(): void {

    if (!this.conductor) {
      return;
    }
  
    this.router.navigate([
      '/conductores/modificar',
      this.conductor.rut
    ]);
  
  }

  volver(): void {

    this.router.navigate([
      '/conductores'
    ]);

  }

  abrirModalEstado(): void {

    if (
      !this.conductor ||
      this.procesandoEstado
    ) {
      return;
    }

    this.modalEstadoVisible = true;

  }

  cerrarModalEstado(): void {

    if (this.procesandoEstado) {
      return;
    }

    this.modalEstadoVisible = false;

  }

  confirmarCambioEstado(): void {

    if (
      !this.conductor ||
      this.procesandoEstado
    ) {
      return;
    }

    this.procesandoEstado = true;

    const estabaActivo =
      this.conductor.activo;

    const rut =
      this.conductor.rut;

    const operacion =
      estabaActivo
        ? this.api.desactivarConductor(rut)
        : this.api.activarConductor(rut);

    operacion.subscribe({

      next: resultado => {

        console.log(
          estabaActivo
            ? 'Conductor desactivado correctamente:'
            : 'Conductor activado correctamente:',
          resultado
        );

        this.procesandoEstado = false;

        this.modalEstadoVisible = false;

        if (this.conductor) {

          this.conductor = {
            ...this.conductor,
            activo: !estabaActivo
          };

        }

        if (estabaActivo) {

          this.mostrarExito(
            'Conductor desactivado',
            `El conductor ${rut} fue desactivado correctamente y ya no podrá utilizarse para nuevos viajes.`
          );

        } else {

          this.mostrarExito(
            'Conductor activado',
            `El conductor ${rut} fue activado correctamente y podrá utilizarse para nuevos viajes.`
          );

        }

      },

      error: error => {

        console.error(
          'Error al cambiar estado del conductor:',
          error
        );

        this.procesandoEstado = false;

        this.modalEstadoVisible = false;

        if (error?.status === 409) {

          this.mostrarError(
            estabaActivo
              ? 'Conductor ya desactivado'
              : 'Conductor ya activo',
            estabaActivo
              ? 'El conductor seleccionado ya se encuentra inactivo.'
              : 'El conductor seleccionado ya se encuentra activo.'
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
          estabaActivo
            ? 'No se pudo desactivar el conductor'
            : 'No se pudo activar el conductor',
          error?.error ||
          'Ocurrió un error al intentar cambiar el estado del conductor.'
        );

      }

    });

  }

  private mostrarExito(
    titulo: string,
    mensaje: string
  ): void {

    this.modalExitoTitulo = titulo;
    this.modalExitoMensaje = mensaje;
    this.modalExitoVisible = true;

  }

  cerrarModalExito(): void {

    this.modalExitoVisible = false;

  }

  private mostrarError(
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