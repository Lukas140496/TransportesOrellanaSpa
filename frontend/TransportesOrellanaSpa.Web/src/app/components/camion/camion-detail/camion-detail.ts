import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Camion } from '../../../core/models/camion';

@Component({
  selector: 'app-camion-detail',
  imports: [DatePipe],
  templateUrl: './camion-detail.html',
  styleUrl: './camion-detail.scss'
})
export class CamionDetail implements OnInit {

  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  camion: Camion | null = null;

  cargando = true;

  error = '';

  modalConfirmacionVisible = false;
  modalErrorVisible = false;
  modalErrorTitulo = '';
  modalErrorMensaje = '';
  modalExitoVisible = false;
  modalExitoTitulo = '';
  modalExitoMensaje = '';
  procesandoEstado = false;

  ngOnInit(): void {

    const patente =
      this.route.snapshot.paramMap.get('patente');

    if (!patente) {
      this.error =
        'No se indicó la patente del camión.';

      this.cargando = false;

      return;
    }

    this.api.getCamiones().subscribe({

      next: camiones => {

        this.camion =
          camiones.find(
            camion =>
              camion.patente.toUpperCase() ===
              patente.toUpperCase()
          ) ?? null;

        if (!this.camion) {

          this.error =
            'No se encontró el camión solicitado.';

        }

        this.cargando = false;

      },

      error: error => {

        console.error(
          'Error al cargar el detalle del camión:',
          error
        );

        this.error =
          'No fue posible cargar la información del camión.';

        this.cargando = false;

      }

    });
  }

  editarCamion(): void {

    if (!this.camion) {
      return;
    }

    this.router.navigate([
      '/camiones/modificar',
      this.camion.patente
    ]);

  }

  // =========================
  // CAMBIO DE ESTADO
  // =========================

  mostrarConfirmacionEstado(): void {

    if (!this.camion || this.procesandoEstado) {
      return;
    }

    this.modalConfirmacionVisible = true;
  }


  cerrarModalConfirmacion(): void {

    if (this.procesandoEstado) {
      return;
    }

    this.modalConfirmacionVisible = false;
  }


  confirmarCambioEstado(): void {

    if (!this.camion || this.procesandoEstado) {
      return;
    }

    this.procesandoEstado = true;

    const estabaActivo = this.camion.activo;

    const operacion = estabaActivo
      ? this.api.desactivarCamion(this.camion.patente)
      : this.api.activarCamion(this.camion.patente);

    operacion.subscribe({

      next: resultado => {

        console.log(
          estabaActivo
            ? 'Camión desactivado correctamente:'
            : 'Camión activado correctamente:',
          resultado
        );

        this.procesandoEstado = false;

        this.modalConfirmacionVisible = false;

        this.camion = resultado;

        if (estabaActivo) {

          this.mostrarExito(
            'Camión desactivado correctamente',
            `El camión ${resultado.patente} fue desactivado y ya no podrá utilizarse para nuevos viajes.`
          );

        } else {

          this.mostrarExito(
            'Camión activado correctamente',
            `El camión ${resultado.patente} fue activado nuevamente y podrá utilizarse para nuevos viajes.`
          );

        }

      },

      error: error => {

        console.error(
          'Error al cambiar estado del camión:',
          error
        );

        this.procesandoEstado = false;

        this.modalConfirmacionVisible = false;

        this.mostrarError(
          estabaActivo
            ? 'No se pudo desactivar el camión'
            : 'No se pudo activar el camión',
          error.error ||
          'Ocurrió un error al intentar cambiar el estado del camión.'
        );

      }

    });

  }

  volver(): void {

    this.router.navigate([
      '/camiones'
    ]);

  }

  // =========================
  // MODAL DE ERROR
  // =========================

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


  // =========================
  // MODAL DE ÉXITO
  // =========================

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

}