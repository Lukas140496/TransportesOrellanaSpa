import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Viaje } from '../../../core/models/viaje';

@Component({
  selector: 'app-viaje-eliminar',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule
  ],
  templateUrl: './viaje-eliminar.html',
  styleUrl: './viaje-eliminar.scss'
})
export class ViajeEliminar implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  viajes: Viaje[] = [];
  viajesFiltrados: Viaje[] = [];

  cargando = true;
  eliminando = false;
  error = '';

  guia = '';
  viajeSeleccionado: Viaje | null = null;

  modalConfirmacionVisible = false;
  modalErrorVisible = false;
  modalExitoVisible = false;

  modalErrorTitulo = '';
  modalErrorMensaje = '';

  ngOnInit(): void {
    this.cargarViajes();
  }

  cargarViajes(): void {
    this.cargando = true;
    this.error = '';

    this.api.getViajes().subscribe({
      next: viajes => {
        this.viajes = viajes;
        this.viajesFiltrados = viajes;
        this.cargando = false;
      },
      error: error => {
        console.error('Error al cargar viajes:', error);
        this.error = 'No fue posible cargar los viajes.';
        this.cargando = false;
      }
    });
  }

  buscarViajes(): void {
    const texto = this.guia.trim().toLowerCase();

    if (!texto) {
      this.viajesFiltrados = this.viajes;
      return;
    }

    this.viajesFiltrados = this.viajes.filter(viaje =>
      viaje.numeroGuiaDespacho
        ?.toLowerCase()
        .includes(texto)
    );
  }

  seleccionarViaje(viaje: Viaje): void {
    this.viajeSeleccionado = viaje;

    setTimeout(() => {
      document.querySelector('.selected-summary')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
    }, 100);
  }

  limpiarSeleccion(): void {
    if (this.eliminando) {
      return;
    }

    this.viajeSeleccionado = null;
  }

  abrirModalConfirmacion(): void {
    if (!this.viajeSeleccionado) {
      return;
    }

    if (this.viajeSeleccionado.estadoPago === 'Pagado') {
      return;
    }

    this.modalConfirmacionVisible = true;
  }

  cerrarModalConfirmacion(): void {
    if (this.eliminando) {
      return;
    }

    this.modalConfirmacionVisible = false;
  }

  confirmarEliminacion(): void {
    if (!this.viajeSeleccionado || this.eliminando) {
      return;
    }

    const id = this.viajeSeleccionado.id;

    this.eliminando = true;

    this.api.eliminarViaje(id).subscribe({
      next: () => {
        this.eliminando = false;
        this.modalConfirmacionVisible = false;

        this.modalExitoVisible = true;
      },
      error: error => {
        console.error('Error al eliminar viaje:', error);

        this.eliminando = false;
        this.modalConfirmacionVisible = false;

        this.modalErrorTitulo = 'No fue posible eliminar el viaje';

        if (error.status === 409) {
          this.modalErrorMensaje =
            'El viaje ya fue pagado y no puede eliminarse.';
        } else if (error.status === 404) {
          this.modalErrorMensaje =
            'El viaje no existe o ya fue eliminado.';
        } else {
          this.modalErrorMensaje =
            'Ocurrió un error al intentar eliminar el viaje.';
        }

        this.modalErrorVisible = true;
      }
    });
  }

  cerrarModalExito(): void {
    this.modalExitoVisible = false;

    this.viajeSeleccionado = null;
    this.guia = '';

    this.cargarViajes();
  }

  cerrarModalError(): void {
    this.modalErrorVisible = false;
  }

  formatoEstadoViaje(estado: string): string {
    switch (estado) {
      case 'EnCurso':
        return 'En Curso';

      default:
        return estado;
    }
  }
}