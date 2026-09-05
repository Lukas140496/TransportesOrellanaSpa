import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';

import { ClienteService } from '../../../core/services/cliente.service';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './cliente-form.html',
  styleUrl: './cliente-form.scss',
})
export class ClienteForm {

  private readonly fb = inject(FormBuilder);
  private readonly clienteService = inject(ClienteService);
  private readonly router = inject(Router);

  clienteForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    rut: ['', [Validators.required, Validators.maxLength(20)]],
    direccion: ['', [Validators.required, Validators.maxLength(200)]],
    comuna: ['', [Validators.required, Validators.maxLength(100)]],
    ciudad: ['', [Validators.required, Validators.maxLength(100)]],
    tarifa: [0, [Validators.required, Validators.min(0)]],
    tipoCarga: ['', [Validators.required, Validators.maxLength(100)]],
    activo: [true],
    observaciones: ['', [Validators.maxLength(500)]]
  });

  guardando = false;

  // Modal de error
  modalErrorVisible = false;
  modalErrorTitulo = '';
  modalErrorMensaje = '';

  // Modal de éxito
  modalExitoVisible = false;
  modalExitoTitulo = '';
  modalExitoMensaje = '';

  get titulo(): string {
    return 'Nuevo Cliente';
  }

  cancelar(): void {
    this.router.navigate(['/clientes']);
  }

  guardar(): void {

    if (this.guardando) {
      return;
    }

    if (this.clienteForm.invalid) {

      this.clienteForm.markAllAsTouched();

      this.mostrarError(
        'Formulario incompleto',
        'Debes completar todos los campos obligatorios antes de guardar el cliente.'
      );

      return;
    }

    this.guardando = true;

    const cliente = this.clienteForm.getRawValue();

    console.log('Enviando cliente:', cliente);

    this.clienteService.crearCliente(cliente).subscribe({

      next: resultado => {

        console.log(
          'Cliente creado correctamente:',
          resultado
        );

        this.guardando = false;

        this.mostrarExito(
          'Cliente creado correctamente',
          `El cliente ${resultado.nombre} fue registrado exitosamente.`
        );

      },

      error: error => {

        console.error(
          'Error al crear cliente:',
          error
        );

        this.guardando = false;

        if (error.status === 409) {

          this.mostrarError(
            'No se pudo crear el cliente',
            error.error ||
            'Ya existe un cliente registrado con ese RUT.'
          );

        } else {

          this.mostrarError(
            'No se pudo crear el cliente',
            'Ocurrió un error al intentar guardar el cliente. Inténtalo nuevamente.'
          );

        }

      }

    });
  }

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

    this.router.navigate(['/clientes']);

  }

}