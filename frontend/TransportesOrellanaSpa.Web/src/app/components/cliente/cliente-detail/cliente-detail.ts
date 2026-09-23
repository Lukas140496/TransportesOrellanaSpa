import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../core/models/cliente';

@Component({
  selector: 'app-cliente-detail',
  imports: [DecimalPipe],
  templateUrl: './cliente-detail.html',
  styleUrl: './cliente-detail.scss'
})
export class ClienteDetail implements OnInit {

  private readonly clienteService = inject(ClienteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  cliente: Cliente | null = null;

  cargando = true;
  procesandoEstado = false;
  error = '';

  // =========================
  // MODAL DE CONFIRMACIÓN
  // =========================

  modalConfirmacionVisible = false;

  // =========================
  // MODAL DE ERROR
  // =========================

  modalErrorVisible = false;
  modalErrorTitulo = '';
  modalErrorMensaje = '';

  // =========================
  // MODAL DE ÉXITO
  // =========================

  modalExitoVisible = false;
  modalExitoTitulo = '';
  modalExitoMensaje = '';

  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error = 'No se especificó un cliente.';
      this.cargando = false;
      return;
    }

    const clienteId = Number(id);

    if (isNaN(clienteId)) {
      this.error = 'El identificador del cliente no es válido.';
      this.cargando = false;
      return;
    }

    this.clienteService.getClienteById(clienteId).subscribe({

      next: cliente => {
        this.cliente = cliente;
        this.cargando = false;
      },

      error: error => {

        console.error(
          'Error al cargar cliente:',
          error
        );

        this.error =
          'No fue posible cargar la información del cliente.';

        this.cargando = false;
      }

    });

  }

  // =========================
  // VOLVER
  // =========================

  volver(): void {
    this.router.navigate(['/clientes']);
  }

  // =========================
  // EDITAR
  // =========================

  editar(): void {

    if (!this.cliente) {
      return;
    }

    this.router.navigate([
      '/clientes',
      this.cliente.id,
      'editar'
    ]);

  }

  // =========================
  // CAMBIO DE ESTADO
  // =========================

  mostrarConfirmacionEstado(): void {

    if (!this.cliente || this.procesandoEstado) {
      return;
    }

    this.modalConfirmacionVisible = true;
  }

  cerrarModalConfirmacion(): void {

    if (this.procesandoEstado) {
      return;
    }

    this.modalConfirmacionVisible = false;
  }

  confirmarCambioEstado(): void {

    if (!this.cliente || this.procesandoEstado) {
      return;
    }

    this.procesandoEstado = true;

    const estabaActivo = this.cliente.activo;

    const operacion = estabaActivo
      ? this.clienteService.desactivarCliente(this.cliente.id)
      : this.clienteService.activarCliente(this.cliente.id);

    operacion.subscribe({

      next: resultado => {

        console.log(
          estabaActivo
            ? 'Cliente desactivado correctamente:'
            : 'Cliente activado correctamente:',
          resultado
        );

        this.procesandoEstado = false;
        this.modalConfirmacionVisible = false;

        this.cliente = resultado;

        if (estabaActivo) {

          this.mostrarExito(
            'Cliente desactivado correctamente',
            `El cliente ${resultado.nombre} fue desactivado y ya no podrá utilizarse para nuevos viajes.`
          );

        } else {

          this.mostrarExito(
            'Cliente activado correctamente',
            `El cliente ${resultado.nombre} fue activado nuevamente y podrá utilizarse para nuevos viajes.`
          );

        }

      },

      error: error => {

        console.error(
          'Error al cambiar estado del cliente:',
          error
        );

        this.procesandoEstado = false;
        this.modalConfirmacionVisible = false;

        this.mostrarError(
          estabaActivo
            ? 'No se pudo desactivar el cliente'
            : 'No se pudo activar el cliente',
          error.error ||
          'Ocurrió un error al intentar cambiar el estado del cliente.'
        );

      }

    });

  }

  // =========================
  // MODAL DE ERROR
  // =========================

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

  // =========================
  // MODAL DE ÉXITO
  // =========================

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

  }

}