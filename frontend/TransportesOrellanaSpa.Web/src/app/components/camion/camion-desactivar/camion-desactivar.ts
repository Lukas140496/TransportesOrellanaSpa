import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../core/services/api.service';
import { Camion } from '../../../core/models/camion';

@Component({
  selector: 'app-camion-desactivar',
  imports: [
    FormsModule
  ],
  templateUrl: './camion-desactivar.html',
  styleUrl: './camion-desactivar.scss'
})
export class CamionDesactivar implements OnInit {

  private readonly api = inject(ApiService);

  camiones: Camion[] = [];
  camionesFiltrados: Camion[] = [];

  cargando = true;
  desactivando = false;
  error = '';

  busqueda = '';
  camionSeleccionado: Camion | null = null;

  modalConfirmacionVisible = false;
  modalErrorVisible = false;
  modalExitoVisible = false;

  modalErrorTitulo = '';
  modalErrorMensaje = '';

  ngOnInit(): void {
    this.cargarCamiones();
  }

  cargarCamiones(): void {
    this.cargando = true;
    this.error = '';

    this.api.getCamiones().subscribe({
      next: camiones => {
        this.camiones = camiones;
        this.camionesFiltrados = camiones.filter(
          camion => camion.activo
        );
        this.cargando = false;
      },
      error: error => {
        console.error('Error al cargar camiones:', error);
        this.error = 'No fue posible cargar los camiones.';
        this.cargando = false;
      }
    });
  }

  buscarCamiones(): void {
    const texto = this.busqueda.trim().toLowerCase();

    const camionesActivos = this.camiones.filter(
      camion => camion.activo
    );

    if (!texto) {
      this.camionesFiltrados = camionesActivos;
      return;
    }

    this.camionesFiltrados = camionesActivos.filter(camion =>
      camion.patente.toLowerCase().includes(texto) ||
      camion.marca.toLowerCase().includes(texto) ||
      camion.modelo.toLowerCase().includes(texto)
    );
  }

  seleccionarCamion(camion: Camion): void {
    if (!camion.activo) {
      return;
    }

    this.camionSeleccionado = camion;

    setTimeout(() => {
      document.querySelector('.selected-summary')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
    }, 100);
  }

  limpiarSeleccion(): void {
    if (this.desactivando) {
      return;
    }

    this.camionSeleccionado = null;
  }

  abrirModalConfirmacion(): void {
    if (!this.camionSeleccionado || this.desactivando) {
      return;
    }

    if (!this.camionSeleccionado.activo) {
      return;
    }

    this.modalConfirmacionVisible = true;
  }

  cerrarModalConfirmacion(): void {
    if (this.desactivando) {
      return;
    }

    this.modalConfirmacionVisible = false;
  }

  confirmarDesactivacion(): void {
    if (!this.camionSeleccionado || this.desactivando) {
      return;
    }

    if (!this.camionSeleccionado.activo) {
      return;
    }

    const patente = this.camionSeleccionado.patente;

    this.desactivando = true;

    this.api.desactivarCamion(patente).subscribe({
      next: camionActualizado => {
        this.desactivando = false;
        this.modalConfirmacionVisible = false;

        this.camionSeleccionado = camionActualizado;
        this.modalExitoVisible = true;
      },
      error: error => {
        console.error('Error al desactivar camión:', error);

        this.desactivando = false;
        this.modalConfirmacionVisible = false;

        this.modalErrorTitulo =
          'No fue posible desactivar el camión';

        if (error.status === 409) {
          this.modalErrorMensaje =
            'El camión ya se encuentra desactivado.';
        } else if (error.status === 404) {
          this.modalErrorMensaje =
            'El camión no existe o ya no está disponible.';
        } else {
          this.modalErrorMensaje =
            'Ocurrió un error al intentar desactivar el camión.';
        }

        this.modalErrorVisible = true;
      }
    });
  }

  cerrarModalExito(): void {
    this.modalExitoVisible = false;

    this.camionSeleccionado = null;
    this.busqueda = '';

    this.cargarCamiones();
  }

  cerrarModalError(): void {
    this.modalErrorVisible = false;
  }
}