import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Remolque } from '../../../core/models/remolque';
import { PermissionService } from '../../../core/services/permission.service';

@Component({
  selector: 'app-remolque-detail',
  imports: [],
  templateUrl: './remolque-detail.html',
  styleUrl: './remolque-detail.scss'
})
export class RemolqueDetail implements OnInit {

  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly permissionService = inject(PermissionService);

  remolque: Remolque | null = null;

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

    const patente =
      this.route.snapshot.paramMap.get('patente');

    if (!patente) {
      this.error = 'No se especificó una patente.';
      this.cargando = false;
      return;
    }

    this.api.getRemolqueByPatente(patente).subscribe({

      next: remolque => {

        this.remolque = remolque;
        this.cargando = false;

      },

      error: error => {

        console.error(
          'Error al cargar remolque:',
          error
        );

        this.error =
          'No fue posible cargar la información del remolque.';

        this.cargando = false;

      }

    });

  }

  editarRemolque(): void {

    if (!this.remolque) {
      return;
    }
  
    this.router.navigate([
      '/remolques/modificar',
      this.remolque.patente
    ]);
  
  }

  volver(): void {

    this.router.navigate([
      '/remolques'
    ]);

  }

  abrirModalEstado(): void {

    if (
      !this.remolque ||
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
      !this.remolque ||
      this.procesandoEstado
    ) {
      return;
    }

    this.procesandoEstado = true;

    const estabaActivo =
      this.remolque.activa;

    const patente =
      this.remolque.patente;

    const operacion =
      estabaActivo
        ? this.api.desactivarRemolque(patente)
        : this.api.activarRemolque(patente);

    operacion.subscribe({

      next: resultado => {

        console.log(
          estabaActivo
            ? 'Remolque desactivado correctamente:'
            : 'Remolque activado correctamente:',
          resultado
        );

        this.procesandoEstado = false;

        this.modalEstadoVisible = false;

        if (this.remolque) {

          this.remolque = {
            ...this.remolque,
            activa: !estabaActivo
          };

        }

        if (estabaActivo) {

          this.mostrarExito(
            'Remolque desactivado',
            `El remolque ${patente} fue desactivado correctamente y ya no podrá utilizarse para nuevos viajes.`
          );

        } else {

          this.mostrarExito(
            'Remolque activado',
            `El remolque ${patente} fue activado correctamente y podrá utilizarse para nuevos viajes.`
          );

        }

      },

      error: error => {

        console.error(
          'Error al cambiar estado del remolque:',
          error
        );

        this.procesandoEstado = false;

        this.modalEstadoVisible = false;

        if (error?.status === 409) {

          this.mostrarError(
            estabaActivo
              ? 'Remolque ya desactivado'
              : 'Remolque ya activo',
            estabaActivo
              ? 'El remolque seleccionado ya se encuentra inactivo.'
              : 'El remolque seleccionado ya se encuentra activo.'
          );

          return;

        }

        if (error?.status === 404) {

          this.mostrarError(
            'Remolque no encontrado',
            'El remolque seleccionado ya no existe.'
          );

          return;

        }

        this.mostrarError(
          estabaActivo
            ? 'No se pudo desactivar el remolque'
            : 'No se pudo activar el remolque',
          error?.error ||
          'Ocurrió un error al intentar cambiar el estado del remolque.'
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