import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  ActivatedRoute,
  Router
} from '@angular/router';

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
  private readonly route = inject(ActivatedRoute);

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
  cargando = false;

  private clienteId: number | null = null;

  // Modal de error
  modalErrorVisible = false;
  modalErrorTitulo = '';
  modalErrorMensaje = '';

  // Modal de éxito
  modalExitoVisible = false;
  modalExitoTitulo = '';
  modalExitoMensaje = '';

  get modoEdicion(): boolean {
    return this.clienteId !== null;
  }

  get titulo(): string {
    return this.modoEdicion
      ? 'Editar cliente'
      : 'Nuevo cliente';
  }

  constructor() {

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {

      const clienteId = Number(id);

      if (isNaN(clienteId)) {

        this.mostrarError(
          'Cliente no válido',
          'El identificador del cliente no es válido.'
        );

        return;
      }

      this.clienteId = clienteId;

      this.cargarCliente(clienteId);
    }
  }

  private cargarCliente(id: number): void {

    this.cargando = true;

    this.clienteService.getClienteById(id).subscribe({

      next: cliente => {

        this.clienteForm.patchValue({
          nombre: cliente.nombre,
          rut: cliente.rut,
          direccion: cliente.direccion,
          comuna: cliente.comuna,
          ciudad: cliente.ciudad,
          tarifa: cliente.tarifa,
          tipoCarga: cliente.tipoCarga,
          activo: cliente.activo,
          observaciones: cliente.observaciones
        });

        this.cargando = false;

      },

      error: error => {

        console.error(
          'Error al cargar cliente:',
          error
        );

        this.cargando = false;

        this.mostrarError(
          'No se pudo cargar el cliente',
          'No fue posible obtener la información del cliente.'
        );

      }

    });
  }

  cancelar(): void {
    this.router.navigate(['/clientes']);
  }

  guardar(): void {

    if (this.guardando || this.cargando) {
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

    console.log(
      this.modoEdicion
        ? 'Actualizando cliente:'
        : 'Creando cliente:',
      cliente
    );

    if (this.modoEdicion && this.clienteId !== null) {

      this.clienteService
        .actualizarCliente(this.clienteId, cliente)
        .subscribe({

          next: resultado => {

            console.log(
              'Cliente actualizado correctamente:',
              resultado
            );

            this.guardando = false;

            this.mostrarExito(
              'Cliente actualizado correctamente',
              `Los datos de ${resultado.nombre} fueron actualizados exitosamente.`
            );

          },

          error: error => {

            console.error(
              'Error al actualizar cliente:',
              error
            );

            this.guardando = false;

            if (error.status === 409) {

              this.mostrarError(
                'No se pudo actualizar el cliente',
                error.error ||
                'Ya existe otro cliente registrado con ese RUT.'
              );

            } else {

              this.mostrarError(
                'No se pudo actualizar el cliente',
                'Ocurrió un error al intentar guardar los cambios. Inténtalo nuevamente.'
              );

            }

          }

        });

      return;
    }

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

    if (this.modoEdicion && this.clienteId !== null) {

      this.router.navigate([
        '/clientes',
        this.clienteId
      ]);

      return;
    }

    this.router.navigate(['/clientes']);

  }

}