import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Conductor } from '../../../core/models/conductor';

@Component({
  selector: 'app-conductor-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule
  ],
  templateUrl: './conductor-list.html',
  styleUrl: './conductor-list.scss'
})
export class ConductorList implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  conductores: Conductor[] = [];

  cargando = true;
  error = '';

  busqueda = '';

  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'todos';

  ngOnInit(): void {

    this.api.getConductores().subscribe({

      next: conductores => {

        this.conductores = conductores;
        this.cargando = false;

      },

      error: error => {

        console.error(
          'Error al cargar conductores:',
          error
        );

        this.error =
          'No fue posible cargar los conductores.';

        this.cargando = false;

      }

    });

  }

  get conductoresFiltrados(): Conductor[] {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    return this.conductores.filter(conductor => {

      // =====================================================
      // FILTRO POR ESTADO
      // =====================================================

      const coincideEstado =
        this.filtroEstado === 'todos' ||
        (
          this.filtroEstado === 'activos' &&
          conductor.activo
        ) ||
        (
          this.filtroEstado === 'inactivos' &&
          !conductor.activo
        );

      if (!coincideEstado) {
        return false;
      }


      // =====================================================
      // FILTRO DE BÚSQUEDA
      // =====================================================

      if (!texto) {
        return true;
      }

      const nombreCompleto = [
        conductor.nombres,
        conductor.apellidoPaterno,
        conductor.apellidoMaterno
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        conductor.rut
          .toLowerCase()
          .includes(texto) ||

        nombreCompleto
          .includes(texto) ||

        conductor.telefono
          .toLowerCase()
          .includes(texto) ||

        conductor.tipoLicencia
          .toLowerCase()
          .includes(texto)
      );

    });

  }

  get cantidadActivos(): number {

    return this.conductores.filter(
      conductor => conductor.activo
    ).length;

  }

  get cantidadInactivos(): number {

    return this.conductores.filter(
      conductor => !conductor.activo
    ).length;

  }

  get licenciasAlDia(): number {

    return this.conductores.filter(
      conductor => conductor.licenciaAlDia
    ).length;

  }

  get licenciasVencidas(): number {

    return this.conductores.filter(
      conductor => !conductor.licenciaAlDia
    ).length;

  }

  cambiarFiltroEstado(
    filtro: 'todos' | 'activos' | 'inactivos'
  ): void {

    this.filtroEstado = filtro;

  }

  limpiarBusqueda(): void {

    this.busqueda = '';

  }

  limpiarFiltros(): void {

    this.busqueda = '';
    this.filtroEstado = 'todos';

  }

  hayFiltrosAplicados(): boolean {

    return (
      this.busqueda.trim().length > 0 ||
      this.filtroEstado !== 'todos'
    );

  }

  verDetalle(rut: string): void {

    this.router.navigate([
      '/conductores',
      rut
    ]);

  }

}