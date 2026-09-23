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
  modalIncompletoVisible = false;

  modalErrorTitulo = '';
  modalErrorMensaje = '';

  camposTocados: Record<string, boolean> = {};

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

    /*
     * Validamos antes de intentar guardar.
     */
    if (!this.formularioValido()) {

      this.marcarCamposInvalidos();

      this.modalIncompletoVisible = true;

      return;
    }

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

  /*
   * Valida los campos obligatorios antes de enviar
   * la información al backend.
   */
  private formularioValido(): boolean {

    return (

      this.camion.patente.trim() !== '' &&

      this.camion.marca.trim() !== '' &&

      this.camion.modelo.trim() !== '' &&

      !!this.camion.ano &&

      this.camion.tipo.trim() !== '' &&

      this.camion.color.trim() !== '' &&

      this.camion.capacidad.trim() !== '' &&

      this.camion.motor.trim() !== '' &&

      this.camion.caballos.trim() !== '' &&

      this.camion.cilindrada.trim() !== '' &&

      this.camion.transmision.trim() !== '' &&

      this.camion.fechaRevisionTecnica !== '' &&

      this.camion.fechaPermisoCirculacion !== '' &&

      this.camion.fechaSeguroObligatorio !== ''

    );

  }

  /*
   * Marca los campos obligatorios que estén vacíos.
   */
  private marcarCamposInvalidos(): void {

    this.camposTocados = {

      patente: this.camion.patente.trim() === '',

      marca: this.camion.marca.trim() === '',

      modelo: this.camion.modelo.trim() === '',

      ano: !this.camion.ano,

      tipo: this.camion.tipo.trim() === '',

      color: this.camion.color.trim() === '',

      capacidad: this.camion.capacidad.trim() === '',

      motor: this.camion.motor.trim() === '',

      caballos: this.camion.caballos.trim() === '',

      cilindrada: this.camion.cilindrada.trim() === '',

      transmision: this.camion.transmision.trim() === '',

      fechaRevisionTecnica:
        this.camion.fechaRevisionTecnica === '',

      fechaPermisoCirculacion:
        this.camion.fechaPermisoCirculacion === '',

      fechaSeguroObligatorio:
        this.camion.fechaSeguroObligatorio === ''

    };

  }

  campoInvalido(nombre: string): boolean {

    return this.camposTocados[nombre] === true;

  }

  cerrarModalIncompleto(): void {

    this.modalIncompletoVisible = false;

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