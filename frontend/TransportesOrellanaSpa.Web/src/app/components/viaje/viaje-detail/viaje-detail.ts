import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Viaje } from '../../../core/models/viaje';

@Component({
  selector: 'app-viaje-detail',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './viaje-detail.html',
  styleUrl: './viaje-detail.scss'
})
export class ViajeDetail implements OnInit {

  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  modalConfirmacionVisible = false;
  modalPagoVisible = false;

  modalExitoVisible = false;
  modalExitoTitulo = '';
  modalExitoMensaje = '';

  modalErrorVisible = false;
  modalErrorTitulo = '';
  modalErrorMensaje = '';

  completando = false;
  pagando = false;

  viaje: Viaje | null = null;

  cargando = true;
  error = '';

  ngOnInit(): void {

    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      this.error = 'No se especificó un viaje.';
      this.cargando = false;
      return;
    }

    const id = Number(idParam);

    if (Number.isNaN(id)) {
      this.error = 'El identificador del viaje no es válido.';
      this.cargando = false;
      return;
    }

    this.api.getViajeById(id).subscribe({

      next: viaje => {
        this.viaje = viaje;
        this.cargando = false;
      },

      error: error => {
        console.error('Error al cargar viaje:', error);

        this.error = 'No fue posible cargar la información del viaje.';
        this.cargando = false;
      }

    });

  }

  mostrarConfirmacionCompletar(): void {

    if (!this.viaje) {
      return;
    }
  
    if (
      this.viaje.estado !== 'Pendiente' &&
      this.viaje.estado !== 'EnCurso'
    ) {
      return;
    }
  
    this.modalConfirmacionVisible = true;
  }

  cerrarModalConfirmacion(): void {

    if (this.completando) {
      return;
    }
  
    this.modalConfirmacionVisible = false;
  }

  confirmarCompletar(): void {

    if (
      !this.viaje ||
      this.completando
    ) {
      return;
    }
  
    this.completando = true;
  
    this.api.completarViaje(
      this.viaje.id
    ).subscribe({
  
      next: viajeActualizado => {
  
        this.viaje = viajeActualizado;
  
        this.completando = false;
        this.modalConfirmacionVisible = false;
  
        this.modalExitoTitulo =
          'Viaje completado correctamente';
  
        this.modalExitoMensaje =
          `El viaje con guía ${viajeActualizado.numeroGuiaDespacho} fue marcado como completado.`;
  
        this.modalExitoVisible = true;
      },
  
      error: error => {
  
        console.error(
          'Error al completar viaje:',
          error
        );
  
        this.completando = false;
        this.modalConfirmacionVisible = false;
  
        this.modalErrorTitulo =
          'No se pudo completar el viaje';
  
        this.modalErrorMensaje =
          error.error ||
          'Ocurrió un error al intentar marcar el viaje como completado.';
  
        this.modalErrorVisible = true;
      }
  
    });
  }

  mostrarConfirmacionPago(): void {

    if (!this.viaje) {
      return;
    }
  
    if (this.viaje.estadoPago === 'Pagado') {
      return;
    }
  
    this.modalPagoVisible = true;
  }

  cerrarModalPago(): void {

    if (this.pagando) {
      return;
    }
  
    this.modalPagoVisible = false;
  }

  confirmarPago(): void {

    if (
      !this.viaje ||
      this.pagando
    ) {
      return;
    }
  
    this.pagando = true;
  
    this.api.pagarViaje(
      this.viaje.id
    ).subscribe({
  
      next: viajeActualizado => {
  
        this.viaje = viajeActualizado;
  
        this.pagando = false;
        this.modalPagoVisible = false;
  
        this.modalExitoTitulo =
          'Pago registrado correctamente';
  
        this.modalExitoMensaje =
          `El viaje con guía ${viajeActualizado.numeroGuiaDespacho} fue marcado como pagado.`;
  
        this.modalExitoVisible = true;
      },
  
      error: error => {
  
        console.error(
          'Error al registrar pago:',
          error
        );
  
        this.pagando = false;
        this.modalPagoVisible = false;
  
        this.modalErrorTitulo =
          'No se pudo registrar el pago';
  
        this.modalErrorMensaje =
          error.error ||
          'Ocurrió un error al intentar registrar el pago.';
  
        this.modalErrorVisible = true;
      }
  
    });
  }

  cerrarModalExito(): void {

    this.modalExitoVisible = false;
  }

  cerrarModalError(): void {

    this.modalErrorVisible = false;
  }

  volver(): void {
    this.router.navigate(['/viajes']);
  }

}