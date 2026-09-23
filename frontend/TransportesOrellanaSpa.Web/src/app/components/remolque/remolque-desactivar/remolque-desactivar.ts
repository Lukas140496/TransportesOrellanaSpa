import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../core/services/api.service';
import { Remolque } from '../../../core/models/remolque';

@Component({
  selector: 'app-remolque-desactivar',
  imports: [
    FormsModule
  ],
  templateUrl: './remolque-desactivar.html',
  styleUrl: './remolque-desactivar.scss'
})
export class RemolqueDesactivar implements OnInit {

  private readonly api = inject(ApiService);

  remolques: Remolque[] = [];
  remolquesFiltrados: Remolque[] = [];

  cargando = true;
  desactivando = false;
  error = '';

  busqueda = '';
  remolqueSeleccionado: Remolque | null = null;

  modalConfirmacionVisible = false;
  modalErrorVisible = false;
  modalExitoVisible = false;

  modalErrorTitulo = '';
  modalErrorMensaje = '';

  ngOnInit(): void {
    this.cargarRemolques();
  }

  cargarRemolques(): void {
    this.cargando = true;
    this.error = '';

    this.api.getRemolques().subscribe({
      next: remolques => {
        this.remolques = remolques;

        this.remolquesFiltrados = remolques.filter(
          remolque => remolque.activa
        );

        this.cargando = false;
      },

      error: error => {
        console.error('Error al cargar remolques:', error);

        this.error = 'No fue posible cargar los remolques.';
        this.cargando = false;
      }
    });
  }

  buscarRemolques(): void {
    const texto = this.busqueda.trim().toLowerCase();

    const remolquesActivos = this.remolques.filter(
      remolque => remolque.activa
    );

    if (!texto) {
      this.remolquesFiltrados = remolquesActivos;
      return;
    }

    this.remolquesFiltrados = remolquesActivos.filter(remolque =>
      remolque.patente.toLowerCase().includes(texto) ||
      remolque.marca.toLowerCase().includes(texto) ||
      remolque.modelo.toLowerCase().includes(texto)
    );
  }

  seleccionarRemolque(remolque: Remolque): void {
    if (!remolque.activa) {
      return;
    }

    this.remolqueSeleccionado = remolque;

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

    this.remolqueSeleccionado = null;
  }

  abrirModalConfirmacion(): void {
    if (!this.remolqueSeleccionado || this.desactivando) {
      return;
    }

    if (!this.remolqueSeleccionado.activa) {
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
    if (!this.remolqueSeleccionado || this.desactivando) {
      return;
    }

    if (!this.remolqueSeleccionado.activa) {
      return;
    }

    const patente = this.remolqueSeleccionado.patente;

    this.desactivando = true;

    this.api.desactivarRemolque(patente).subscribe({
      next: remolqueActualizado => {
        this.desactivando = false;
        this.modalConfirmacionVisible = false;

        this.remolqueSeleccionado = remolqueActualizado;
        this.modalExitoVisible = true;
      },

      error: error => {
        console.error(
          'Error al desactivar remolque:',
          error
        );

        this.desactivando = false;
        this.modalConfirmacionVisible = false;

        this.modalErrorTitulo =
          'No fue posible desactivar el remolque';

        if (error.status === 409) {
          this.modalErrorMensaje =
            'El remolque ya se encuentra desactivado.';
        } else if (error.status === 404) {
          this.modalErrorMensaje =
            'El remolque no existe o ya no está disponible.';
        } else {
          this.modalErrorMensaje =
            'Ocurrió un error al intentar desactivar el remolque.';
        }

        this.modalErrorVisible = true;
      }
    });
  }

  cerrarModalExito(): void {
    this.modalExitoVisible = false;

    this.remolqueSeleccionado = null;
    this.busqueda = '';

    this.cargarRemolques();
  }

  cerrarModalError(): void {
    this.modalErrorVisible = false;
  }
}