import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';

import { RutFormatDirective } from '../../../pipe/rut/rut-format.directive';
import { validarRut } from '../../../pipe/rut/rut-format';

@Component({
  selector: 'app-conductor-form',
  standalone: true,
  imports: [
    FormsModule,
    RutFormatDirective
  ],
  templateUrl: './conductor-form.html',
  styleUrl: './conductor-form.scss'
})
export class ConductorForm implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  guardando = false;

  error = '';

  modalExitoVisible = false;
  modalErrorVisible = false;
  modalIncompletoVisible = false;

  modalErrorTitulo = '';
  modalErrorMensaje = '';

  modalExitoTitulo = '';
  modalExitoMensaje = '';

  camposTocados: Record<string, boolean> = {};

  conductor = {
    rut: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    edad: 0,
    fechaIngreso: '',
    telefono: '',
    tipoLicencia: '',
    fechaControlLicencia: '',
    licenciaAlDia: true
  };

  ngOnInit(): void {
  }

  campoTocado(campo: string): void {

    this.camposTocados[campo] = true;

  }

  campoTieneError(campo: string): boolean {

    if (!this.camposTocados[campo]) {
      return false;
    }

    switch (campo) {

      case 'rut':
        return !this.conductor.rut.trim();

      case 'rutInvalido':
        return (
          !!this.conductor.rut.trim() &&
          !validarRut(this.conductor.rut)
        );

      case 'nombres':
        return !this.conductor.nombres.trim();

      case 'apellidoPaterno':
        return !this.conductor.apellidoPaterno.trim();

      case 'apellidoMaterno':
        return !this.conductor.apellidoMaterno.trim();

      case 'fechaNacimiento':
        return !this.conductor.fechaNacimiento;

      case 'fechaIngreso':
        return !this.conductor.fechaIngreso;

      case 'telefono':
        return !this.conductor.telefono.trim();

      case 'tipoLicencia':
        return !this.conductor.tipoLicencia;

      case 'fechaControlLicencia':
        return !this.conductor.fechaControlLicencia;

      default:
        return false;
    }

  }

  calcularEdad(): void {

    if (!this.conductor.fechaNacimiento) {

      this.conductor.edad = 0;

      return;
    }

    const nacimiento = new Date(
      `${this.conductor.fechaNacimiento}T00:00:00`
    );

    const hoy = new Date();

    let edad =
      hoy.getFullYear() -
      nacimiento.getFullYear();

    const mes =
      hoy.getMonth() -
      nacimiento.getMonth();

    if (
      mes < 0 ||
      (
        mes === 0 &&
        hoy.getDate() < nacimiento.getDate()
      )
    ) {
      edad--;
    }

    this.conductor.edad =
      edad >= 0
        ? edad
        : 0;

  }

  private formularioValido(): boolean {

    const camposObligatorios = [
      'rut',
      'nombres',
      'apellidoPaterno',
      'apellidoMaterno',
      'fechaNacimiento',
      'fechaIngreso',
      'telefono',
      'tipoLicencia',
      'fechaControlLicencia'
    ];

    camposObligatorios.forEach(campo => {
      this.camposTocados[campo] = true;
    });

    this.calcularEdad();

    if (
      !this.conductor.rut.trim() ||
      !this.conductor.nombres.trim() ||
      !this.conductor.apellidoPaterno.trim() ||
      !this.conductor.apellidoMaterno.trim() ||
      !this.conductor.fechaNacimiento ||
      !this.conductor.fechaIngreso ||
      !this.conductor.telefono.trim() ||
      !this.conductor.tipoLicencia ||
      !this.conductor.fechaControlLicencia
    ) {
      return false;
    }

    if (!validarRut(this.conductor.rut)) {
      this.camposTocados['rutInvalido'] = true;
      return false;
    }

    if (this.conductor.edad <= 0) {
      this.camposTocados['fechaNacimiento'] = true;
      return false;
    }

    return true;

  }

  guardar(): void {

    if (this.guardando) {
      return;
    }

    this.error = '';

    if (!this.formularioValido()) {

      this.modalIncompletoVisible = true;

      return;
    }

    this.guardando = true;

    const conductor = {

      rut:
        this.conductor.rut.trim(),

      nombres:
        this.conductor.nombres.trim(),

      apellidoPaterno:
        this.conductor.apellidoPaterno.trim(),

      apellidoMaterno:
        this.conductor.apellidoMaterno.trim(),

      fechaNacimiento:
        `${this.conductor.fechaNacimiento}T00:00:00`,

      edad:
        this.conductor.edad,

      fechaIngreso:
        `${this.conductor.fechaIngreso}T00:00:00`,

      telefono:
        this.conductor.telefono.trim(),

      tipoLicencia:
        this.conductor.tipoLicencia,

      fechaControlLicencia:
        `${this.conductor.fechaControlLicencia}T00:00:00`,

      licenciaAlDia:
        this.conductor.licenciaAlDia

    };

    this.api.crearConductor(conductor).subscribe({

      next: resultado => {

        this.guardando = false;

        this.modalExitoTitulo =
          'Conductor creado correctamente';

        this.modalExitoMensaje =
          `El conductor ${resultado.nombres} ${resultado.apellidoPaterno} fue registrado exitosamente.`;

        this.modalExitoVisible = true;

      },

      error: error => {

        console.error(
          'Error al crear conductor:',
          error
        );

        this.guardando = false;

        this.modalErrorTitulo =
          'No se pudo crear el conductor';

        if (error.status === 409) {

          this.modalErrorMensaje =
            error.error ||
            `Ya existe un conductor registrado con el RUT ${conductor.rut}.`;

        } else {

          this.modalErrorMensaje =
            'Ocurrió un error al intentar guardar el conductor. Inténtalo nuevamente.';

        }

        this.modalErrorVisible = true;

      }

    });

  }

  cerrarModalIncompleto(): void {

    this.modalIncompletoVisible = false;

  }

  cerrarModalError(): void {

    this.modalErrorVisible = false;

  }

  cerrarModalExito(): void {

    this.modalExitoVisible = false;

    this.router.navigate([
      '/conductores'
    ]);

  }

  volver(): void {

    if (this.guardando) {
      return;
    }

    this.router.navigate([
      '/conductores'
    ]);

  }

}