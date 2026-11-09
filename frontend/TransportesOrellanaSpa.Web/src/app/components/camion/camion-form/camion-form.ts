
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

  // Modal de cambios sin guardar
  modalSalirVisible = false;

  // Indica si el usuario modificó el formulario
  formularioModificado = false;

  // Resuelve la navegación cuando el guard está esperando
  private resolverSalida: ((salir: boolean) => void) | null = null;

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
    fechaSeguroObligatorio: ''
  };

  /**
   * Se ejecuta cuando el usuario modifica cualquier campo.
   */
  marcarFormularioModificado(): void {
    if (!this.guardando) {
      this.formularioModificado = true;
    }
  }

  /**
   * Controla si Angular puede abandonar el formulario.
   * Lo utiliza unsavedChangesGuard.
   */
  puedeSalir(): boolean | Promise<boolean> {
    if (this.guardando) {
      return false;
    }

    if (!this.formularioModificado) {
      return true;
    }

    this.modalSalirVisible = true;

    return new Promise<boolean>((resolve) => {
      this.resolverSalida = resolve;
    });
  }

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
      transmision: this.camion.transmision.trim(),

      // Las fechas son opcionales.
      // Si están vacías, enviamos null al backend.
      fechaRevisionTecnica:
        this.camion.fechaRevisionTecnica || null,

      fechaPermisoCirculacion:
        this.camion.fechaPermisoCirculacion || null,

      fechaSeguroObligatorio:
        this.camion.fechaSeguroObligatorio || null
    };

    this.api.crearCamion(camion).subscribe({
      next: () => {
        this.guardando = false;
        this.formularioModificado = false;
        this.modalExitoVisible = true;
      },
      error: error => {
        console.error('Error al crear camión:', error);
        this.guardando = false;
        this.modalErrorTitulo = 'No fue posible guardar el camión';

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
      this.camion.transmision.trim() !== ''
    );
  }

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
      transmision: this.camion.transmision.trim() === ''
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

    if (this.formularioModificado) {
      this.modalSalirVisible = true;
      return;
    }

    this.router.navigate(['/camiones']);
  }

  seguirEditando(): void {
    this.modalSalirVisible = false;

    if (this.resolverSalida) {
      this.resolverSalida(false);
      this.resolverSalida = null;
    }
  }

  salirSinGuardar(): void {
    this.modalSalirVisible = false;

    if (this.resolverSalida) {
      this.formularioModificado = false;
      this.resolverSalida(true);
      this.resolverSalida = null;
      return;
    }

    this.formularioModificado = false;
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
