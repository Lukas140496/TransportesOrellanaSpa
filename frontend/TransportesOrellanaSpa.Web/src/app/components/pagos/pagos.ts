import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api.service';
import { Cliente } from '../../core/models/cliente';
import { Viaje } from '../../core/models/viaje';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule
  ],
  templateUrl: './pagos.html',
  styleUrl: './pagos.scss'
})
export class Pagos implements OnInit {

  private readonly api = inject(ApiService);

  clientes: Cliente[] = [];
  viajes: Viaje[] = [];

  cargando = true;
  error = '';

  clienteId: number | null = null;

  viajesSeleccionados = new Set<number>();

  modalConfirmacionVisible = false;

  pagando = false;

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarViajesPendientes();
  }

  private cargarClientes(): void {

    this.api.getClientes().subscribe({
      next: clientes => {
        this.clientes = clientes;
      },

      error: error => {
        console.error(
          'Error al cargar clientes:',
          error
        );
      }
    });

  }

  cargarViajesPendientes(): void {

    this.cargando = true;
    this.error = '';

    this.viajesSeleccionados.clear();

    this.api.getViajesPendientesPago(
      this.clienteId ?? undefined
    ).subscribe({

      next: viajes => {

        this.viajes = viajes;
        this.cargando = false;

      },

      error: error => {

        console.error(
          'Error al cargar viajes pendientes:',
          error
        );

        this.error =
          'No fue posible cargar los viajes pendientes de pago.';

        this.cargando = false;

      }

    });

  }

  cambiarCliente(): void {
    this.cargarViajesPendientes();
  }

  limpiarFiltro(): void {

    this.clienteId = null;

    this.cargarViajesPendientes();

  }

  estaSeleccionado(id: number): boolean {
    return this.viajesSeleccionados.has(id);
  }

  cambiarSeleccion(
    id: number,
    seleccionado: boolean
  ): void {

    if (seleccionado) {

      this.viajesSeleccionados.add(id);

    } else {

      this.viajesSeleccionados.delete(id);

    }

  }

  seleccionarTodos(): void {

    this.viajes.forEach(viaje => {

      this.viajesSeleccionados.add(
        viaje.id
      );

    });

  }

  deseleccionarTodos(): void {

    this.viajesSeleccionados.clear();

  }

  todosSeleccionados(): boolean {

    return (
      this.viajes.length > 0 &&
      this.viajes.every(viaje =>
        this.viajesSeleccionados.has(viaje.id)
      )
    );

  }

  alternarSeleccionTodos(): void {

    if (this.todosSeleccionados()) {

      this.deseleccionarTodos();

    } else {

      this.seleccionarTodos();

    }

  }

  cantidadSeleccionados(): number {

    return this.viajesSeleccionados.size;

  }

  totalSeleccionado(): number {

    return this.viajes
      .filter(viaje =>
        this.viajesSeleccionados.has(viaje.id)
      )
      .reduce(
        (total, viaje) =>
          total + viaje.tarifa,
        0
      );

  }

  obtenerGuiasSeleccionadas(): string[] {

    return this.viajes
      .filter(viaje =>
        this.viajesSeleccionados.has(viaje.id)
      )
      .map(viaje =>
        viaje.numeroGuiaDespacho
      );

  }

  mostrarConfirmacionPagoMasivo(): void {

    if (
      this.cantidadSeleccionados() === 0 ||
      this.pagando
    ) {
      return;
    }

    this.modalConfirmacionVisible = true;

  }

  cerrarModalConfirmacion(): void {

    if (this.pagando) {
      return;
    }

    this.modalConfirmacionVisible = false;

  }

  confirmarPagoMasivo(): void {

    if (
      this.pagando ||
      this.cantidadSeleccionados() === 0
    ) {
      return;
    }

    const guias =
      this.obtenerGuiasSeleccionadas();

    if (guias.length === 0) {
      return;
    }

    this.pagando = true;

    this.api.pagarViajesMasivo(
      guias
    ).subscribe({

      next: respuesta => {

        console.log(
          'Pago masivo realizado:',
          respuesta
        );

        this.pagando = false;
        this.modalConfirmacionVisible = false;

        this.cargarViajesPendientes();

      },

      error: error => {

        console.error(
          'Error al realizar pago masivo:',
          error
        );

        this.pagando = false;
        this.modalConfirmacionVisible = false;

        this.error =
          error.error?.mensaje ||
          'No fue posible registrar los pagos seleccionados.';

      }

    });

  }

}