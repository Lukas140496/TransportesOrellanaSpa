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
  // FILTROS
  // =========================

  guia = '';
  fechaDesde = '';
  fechaHasta = '';
  clienteId: number | null = null;

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
      this.clienteId ?? undefined
    ).subscribe({

      next: viajes => {
        this.viajes = viajes;
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
  // BUSCAR
  // =========================

  buscar(): void {
    this.cargarViajes();
  }

  // =========================
  // LIMPIAR FILTROS
  // =========================

  limpiarFiltros(): void {

    this.guia = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.clienteId = null;

    this.cargarViajes();
  }

  // =========================
  // DETALLE
  // =========================

  verDetalle(id: number): void {
    this.router.navigate(['/viajes', id]);
  }

  formatoEstadoViaje(estado: string): string {
    switch (estado) {
      case 'EnCurso':
        return 'En Curso';
  
      default:
        return estado;
    }
  }

}