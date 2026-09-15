import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Camion } from '../../../core/models/camion';

@Component({
  selector: 'app-camion-list',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './camion-list.html',
  styleUrl: './camion-list.scss'
})
export class CamionList implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  camiones: Camion[] = [];

  cargando = true;
  error = '';

  busqueda = '';
  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'todos';

  ngOnInit(): void {

    this.api.getCamiones().subscribe({

      next: camiones => {

        this.camiones = camiones;
        this.cargando = false;

      },

      error: error => {

        console.error(
          'Error al cargar camiones:',
          error
        );

        this.error =
          'No fue posible cargar los camiones.';

        this.cargando = false;

      }

    });

  }

  get camionesFiltrados(): Camion[] {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    return this.camiones.filter(camion => {

      const coincideBusqueda =
        !texto ||
        camion.patente
          .toLowerCase()
          .includes(texto) ||
        camion.marca
          .toLowerCase()
          .includes(texto) ||
        camion.modelo
          .toLowerCase()
          .includes(texto);

      const coincideEstado =
        this.filtroEstado === 'todos' ||
        (
          this.filtroEstado === 'activos' &&
          camion.activo
        ) ||
        (
          this.filtroEstado === 'inactivos' &&
          !camion.activo
        );

      return coincideBusqueda && coincideEstado;

    });

  }

  get cantidadActivos(): number {

    return this.camiones.filter(
      camion => camion.activo
    ).length;

  }

  get cantidadInactivos(): number {

    return this.camiones.filter(
      camion => !camion.activo
    ).length;

  }

  get revisionesAlDia(): number {

    return this.camiones.filter(
      camion => camion.revisionAlDia
    ).length;

  }

  get revisionesVencidas(): number {

    return this.camiones.filter(
      camion => !camion.revisionAlDia
    ).length;

  }

  cambiarFiltroEstado(
    filtro: 'todos' | 'activos' | 'inactivos'
  ): void {

    this.filtroEstado = filtro;

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

  limpiarBusqueda(): void {

    this.busqueda = '';
  
  }

  verDetalle(patente: string): void {

    this.router.navigate([
      '/camiones',
      patente
    ]);

  }

}