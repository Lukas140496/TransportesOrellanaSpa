import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Cliente } from '../../../core/models/cliente';
import { Viaje } from '../../../core/models/viaje';

@Component({
  selector: 'app-viaje-list',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule
  ],
  templateUrl: './viaje-list.html',
  styleUrl: './viaje-list.scss'
})
export class ViajeList implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  viajes: Viaje[] = [];
  clientes: Cliente[] = [];

  cargando = true;
  error = '';

  // =========================
  // PAGINACIÓN
  // =========================

  paginaActual = 1;
  viajesPorPagina = 15;

  // =========================
  // FILTROS
  // =========================

  guia = '';
  fechaDesde = '';
  fechaHasta = '';
  clienteId: number | null = null;
  estadoPago = '';

  private guiaTimeout: ReturnType<typeof setTimeout> | null = null;

  // =========================
  // INICIALIZACIÓN
  // =========================

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarViajes();
  }

  // =========================
  // CARGAR CLIENTES
  // =========================

  private cargarClientes(): void {

    this.api.getClientes().subscribe({

      next: clientes => {
        this.clientes = clientes;
      },

      error: error => {
        console.error('Error al cargar clientes:', error);
      }

    });

  }

  // =========================
  // CARGAR VIAJES
  // =========================

  cargarViajes(): void {

    this.cargando = true;
    this.error = '';

    this.api.getViajes(
      this.guia,
      this.fechaDesde || undefined,
      this.fechaHasta || undefined,
      this.clienteId ?? undefined,
      this.estadoPago || undefined
    ).subscribe({

      next: viajes => {
        this.viajes = viajes;
        this.paginaActual = 1;
        this.cargando = false;
      },

      error: error => {
        console.error('Error al cargar viajes:', error);

        this.error = 'No fue posible cargar los viajes.';
        this.cargando = false;
      }

    });

  }

  // =========================
  // VIAJES PAGINADOS
  // =========================

  get viajesPaginados(): Viaje[] {

    const inicio = (this.paginaActual - 1) * this.viajesPorPagina;
    const fin = inicio + this.viajesPorPagina;

    return this.viajes.slice(inicio, fin);
  }

  // =========================
  // TOTAL DE PÁGINAS
  // =========================

  get totalPaginas(): number {

    return Math.ceil(
      this.viajes.length / this.viajesPorPagina
    );

  }

  // =========================
  // CAMBIAR PÁGINA
  // =========================

  paginaAnterior(): void {

    if (this.paginaActual > 1) {
      this.paginaActual--;
    }

  }

  paginaSiguiente(): void {

    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }

  }

  // =========================
  // RANGO MOSTRADO
  // =========================

  get indiceInicio(): number {

    if (this.viajes.length === 0) {
      return 0;
    }

    return (this.paginaActual - 1) * this.viajesPorPagina + 1;

  }

  get indiceFin(): number {

    return Math.min(
      this.paginaActual * this.viajesPorPagina,
      this.viajes.length
    );

  }

  // =========================
  // FILTRO GUÍA
  // =========================

  onGuiaChange(): void {

    if (this.guiaTimeout) {
      clearTimeout(this.guiaTimeout);
    }

    this.guiaTimeout = setTimeout(() => {
      this.cargarViajes();
    }, 300);

  }

  // =========================
  // FILTRO FECHAS
  // =========================

  onFechaChange(): void {

    this.paginaActual = 1;
    this.cargarViajes();

  }

  // =========================
  // FILTRO CLIENTE
  // =========================

  onClienteChange(): void {

    this.paginaActual = 1;
    this.cargarViajes();

  }

  // =========================
  // FILTRO ESTADO DE PAGO
  // =========================

  onEstadoPagoChange(): void {

    this.paginaActual = 1;
    this.cargarViajes();

  }

  // =========================
  // LIMPIAR FILTROS
  // =========================

  limpiarFiltros(): void {

    if (this.guiaTimeout) {
      clearTimeout(this.guiaTimeout);
      this.guiaTimeout = null;
    }

    this.guia = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.clienteId = null;
    this.estadoPago = '';

    this.paginaActual = 1;

    this.cargarViajes();

  }

  // =========================
  // DETALLE
  // =========================

  verDetalle(id: number): void {
    this.router.navigate(['/viajes', id]);
  }

  // =========================
  // FORMATO ESTADO
  // =========================

  formatoEstadoViaje(estado: string): string {

    switch (estado) {

      case 'EnCurso':
        return 'En Curso';

      default:
        return estado;
    }

  }

}