import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Camion } from '../../../core/models/camion';

@Component({
  selector: 'app-camion-modificar',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './camion-modificar.html',
  styleUrl: './camion-modificar.scss'
})
export class CamionModificar implements OnInit {

  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  camiones: Camion[] = [];
  camionesFiltrados: Camion[] = [];

  camionSeleccionado: Camion | null = null;

  camionConfirmado = {
    patente: '',
    marca: '',
    modelo: ''
  };

  cargando = true;
  guardando = false;

  error = '';

  busqueda = '';

  modalExitoVisible = false;
  modalErrorVisible = false;

  modalErrorTitulo = '';
  modalErrorMensaje = '';

  ngOnInit(): void {

    const patente =
      this.route.snapshot.paramMap.get('patente');

    this.cargarCamiones(patente);

  }

  cargarCamiones(patente?: string | null): void {

    this.cargando = true;
    this.error = '';

    this.api.getCamiones().subscribe({

      next: camiones => {

        this.camiones = camiones;
        this.camionesFiltrados = camiones;

        this.cargando = false;

        if (patente) {

          const camion =
            camiones.find(
              camion =>
                camion.patente.toLowerCase() ===
                patente.toLowerCase()
            );

          if (camion) {

            this.seleccionarCamion(camion);

          } else {

            this.error =
              'No se encontró el camión solicitado.';

          }

        }

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

  buscarCamiones(): void {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    if (!texto) {

      this.camionesFiltrados =
        this.camiones;

      return;

    }

    this.camionesFiltrados =
      this.camiones.filter(camion => {

        return (
          camion.patente
            .toLowerCase()
            .includes(texto) ||

          camion.marca
            .toLowerCase()
            .includes(texto) ||

          camion.modelo
            .toLowerCase()
            .includes(texto)
        );

      });

  }

  seleccionarCamion(camion: Camion): void {

    this.camionSeleccionado = {
      ...camion
    };

    setTimeout(() => {

      document
        .querySelector('.form-card')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

    }, 100);

  }

  limpiarSeleccion(): void {

    if (this.guardando) {
      return;
    }

    this.camionSeleccionado = null;

  }

  guardarCambios(): void {

    if (!this.camionSeleccionado || this.guardando) {
      return;
    }

    this.error = '';
    this.guardando = true;

    const camion = this.camionSeleccionado;

    this.camionConfirmado = {
      patente: camion.patente,
      marca: camion.marca,
      modelo: camion.modelo
    };

    this.api
      .actualizarCamion(
        camion.patente,
        camion
      )
      .subscribe({

        next: camionActualizado => {

          this.guardando = false;

          this.camionSeleccionado = {
            ...camionActualizado
          };

          this.modalExitoVisible = true;

        },

        error: error => {

          console.error(
            'Error al modificar camión:',
            error
          );

          this.guardando = false;

          this.modalErrorTitulo =
            'No fue posible guardar los cambios';

          if (error.status === 404) {

            this.modalErrorMensaje =
              'El camión no existe o ya no está disponible.';

          } else if (error.status === 409) {

            this.modalErrorMensaje =
              error.error ||
              'No fue posible modificar el camión.';

          } else {

            this.modalErrorMensaje =
              'Ocurrió un error al intentar guardar los cambios.';

          }

          this.modalErrorVisible = true;

        }

      });

  }

  cancelar(): void {

    if (this.guardando) {
      return;
    }

    this.router.navigate([
      '/camiones'
    ]);

  }

  cerrarModalExito(): void {

    this.modalExitoVisible = false;

    this.router.navigate([
      '/camiones'
    ]);

  }

  cerrarModalError(): void {

    this.modalErrorVisible = false;

  }

}