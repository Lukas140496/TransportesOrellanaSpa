import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../core/models/cliente';

@Component({
  selector: 'app-cliente-desactivar',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './cliente-desactivar.html',
  styleUrl: './cliente-desactivar.scss'
})
export class ClienteDesactivar implements OnInit {

  private readonly clienteService = inject(ClienteService);

  clientes: Cliente[] = [];
  resultados: Cliente[] = [];

  terminoBusqueda = '';

  cargando = true;
  procesandoEstado = false;
  error = '';

  // =========================
  // MODAL DE CONFIRMACIÓN
  // =========================

  modalConfirmacionVisible = false;
  clienteSeleccionado: Cliente | null = null;

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

    this.clienteService.getClientes().subscribe({

      next: clientes => {

        this.clientes = clientes;

        this.resultados = [];

        this.cargando = false;

      },

      error: error => {

        console.error(
          'Error al cargar clientes:',
          error
        );

        this.error =
          'No fue posible cargar los clientes.';

        this.cargando = false;

      }

    });

  }

  // =========================
  // BUSCAR
  // =========================

  buscar(): void {

    const termino = this.normalizar(
      this.terminoBusqueda.trim()
    );

    if (!termino) {

      this.resultados = [];

      return;
    }

    this.resultados = this.clientes.filter(cliente => {

      // Solo mostramos clientes activos
      // porque esta pantalla permite desactivarlos.
      if (!cliente.activo) {
        return false;
      }

      const nombre = this.normalizar(
        cliente.nombre
      );

      const rut = this.normalizar(
        cliente.rut
      );

      return (
        nombre.includes(termino) ||
        rut.includes(termino)
      );

    });

  }

  // =========================
  // LIMPIAR
  // =========================

  limpiarBusqueda(): void {

    this.terminoBusqueda = '';

    this.resultados = [];

  }

  // =========================
  // MOSTRAR CONFIRMACIÓN
  // =========================

  mostrarConfirmacion(cliente: Cliente): void {

    if (this.procesandoEstado) {
      return;
    }

    this.clienteSeleccionado = cliente;

    this.modalConfirmacionVisible = true;

  }

  // =========================
  // CERRAR CONFIRMACIÓN
  // =========================

  cerrarModalConfirmacion(): void {

    if (this.procesandoEstado) {
      return;
    }

    this.modalConfirmacionVisible = false;

    this.clienteSeleccionado = null;

  }

  // =========================
  // CONFIRMAR DESACTIVACIÓN
  // =========================

  confirmarDesactivacion(): void {

    if (
      !this.clienteSeleccionado ||
      this.procesandoEstado
    ) {
      return;
    }

    this.procesandoEstado = true;

    const cliente = this.clienteSeleccionado;

    this.clienteService
      .desactivarCliente(cliente.id)
      .subscribe({

        next: resultado => {

          console.log(
            'Cliente desactivado correctamente:',
            resultado
          );

          this.procesandoEstado = false;

          this.modalConfirmacionVisible = false;

          this.clienteSeleccionado = null;

          // Actualizamos el cliente dentro de la lista local.
          const indice = this.clientes.findIndex(
            item => item.id === resultado.id
          );

          if (indice !== -1) {

            this.clientes[indice] = resultado;

          }

          // Lo quitamos inmediatamente de los resultados.
          this.resultados = this.resultados.filter(
            cliente => cliente.id !== resultado.id
          );

          this.mostrarExito(
            'Cliente desactivado correctamente',
            `El cliente ${resultado.nombre} fue desactivado y ya no podrá utilizarse para nuevos viajes.`
          );

        },

        error: error => {

          console.error(
            'Error al desactivar cliente:',
            error
          );

          this.procesandoEstado = false;

          this.modalConfirmacionVisible = false;

          this.clienteSeleccionado = null;

          this.mostrarError(
            'No se pudo desactivar el cliente',
            error.error ||
            'Ocurrió un error al intentar desactivar el cliente.'
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

  // =========================
  // NORMALIZAR BÚSQUEDA
  // =========================

  private normalizar(valor: string): string {

    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  }

}