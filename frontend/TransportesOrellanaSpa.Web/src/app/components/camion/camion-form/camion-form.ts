import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { CrearCamion } from '../../../core/models/crear-camion';

@Component({
  selector: 'app-camion-form',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './camion-form.html',
  styleUrl: './camion-form.scss'
})
export class CamionForm {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  guardando = false;

  error = '';

  modalExitoVisible = false;
  modalErrorVisible = false;

  modalErrorTitulo = '';
  modalErrorMensaje = '';

  camion: CrearCamion = {
    patente: '',
    marca: '',
    modelo: '',
    ano: new Date().getFullYear(),
    tipo: '',
    color: '',
    capacidad: '',
    motor: '',
    caballos: '',
    cilindrada: '',
    transmision: '',
    fechaRevisionTecnica: '',
    fechaPermisoCirculacion: '',
    fechaSeguroObligatorio: '',
    revisionAlDia: true,
    permisoAlDia: true,
    seguroAlDia: true
  };

  guardarCamion(): void {

    if (this.guardando) {
      return;
    }

    this.error = '';

    this.guardando = true;

    const camion: CrearCamion = {
      ...this.camion,
      patente: this.camion.patente
        .trim()
        .toUpperCase(),
      marca: this.camion.marca.trim(),
      modelo: this.camion.modelo.trim(),
      tipo: this.camion.tipo.trim(),
      color: this.camion.color.trim(),
      capacidad: this.camion.capacidad.trim(),
      motor: this.camion.motor.trim(),
      caballos: this.camion.caballos.trim(),
      cilindrada: this.camion.cilindrada.trim(),
      transmision: this.camion.transmision.trim()
    };

    this.api.crearCamion(camion).subscribe({

      next: () => {

        this.guardando = false;

        this.modalExitoVisible = true;

      },

      error: error => {

        console.error(
          'Error al crear camión:',
          error
        );

        this.guardando = false;

        this.modalErrorTitulo =
          'No fue posible guardar el camión';

        if (error.status === 409) {

          this.modalErrorMensaje =
            error.error ||
            'Ya existe un camión con esa patente.';

        } else {

          this.modalErrorMensaje =
            'Ocurrió un error al intentar guardar el camión.';

        }

        this.modalErrorVisible = true;

      }

    });

  }

  cancelar(): void {

    if (this.guardando) {
      return;
    }

    this.router.navigate(['/camiones']);

  }

  cerrarModalExito(): void {

    this.modalExitoVisible = false;

    this.router.navigate(['/camiones']);

  }

  cerrarModalError(): void {

    this.modalErrorVisible = false;

  }

}