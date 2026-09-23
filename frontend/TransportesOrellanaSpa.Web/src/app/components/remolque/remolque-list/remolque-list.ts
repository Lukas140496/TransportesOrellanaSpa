import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Remolque } from '../../../core/models/remolque';

@Component({
  selector: 'app-remolque-list',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './remolque-list.html',
  styleUrl: './remolque-list.scss'
})
export class RemolqueList implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  remolques: Remolque[] = [];

  cargando = true;
  error = '';

  busqueda = '';

  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'todos';

  ngOnInit(): void {

    this.api.getRemolques().subscribe({

      next: remolques => {

        this.remolques = remolques;
        this.cargando = false;

      },

      error: error => {

        console.error(
          'Error al cargar remolques:',
          error
        );

        this.error =
          'No fue posible cargar los remolques.';

        this.cargando = false;

      }

    });

  }

  get remolquesFiltrados(): Remolque[] {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    return this.remolques.filter(remolque => {

      const patenteCamion =
        remolque.camionHabitual?.patente
          ?.toLowerCase() ?? '';

      const coincideBusqueda =
        !texto ||
        remolque.patente
          .toLowerCase()
          .includes(texto) ||

        remolque.marca
          .toLowerCase()
          .includes(texto) ||

        remolque.modelo
          .toLowerCase()
          .includes(texto) ||

        remolque.tipo
          .toLowerCase()
          .includes(texto) ||

        patenteCamion.includes(texto);

      const coincideEstado =
        this.filtroEstado === 'todos' ||

        (
          this.filtroEstado === 'activos' &&
          remolque.activa
        ) ||

        (
          this.filtroEstado === 'inactivos' &&
          !remolque.activa
        );

      return coincideBusqueda && coincideEstado;

    });

  }

  get remolquesActivos(): number {

    return this.remolques.filter(
      remolque => remolque.activa
    ).length;

  }

  get remolquesInactivos(): number {

    return this.remolques.filter(
      remolque => !remolque.activa
    ).length;

  }

  get remolquesSinCamion(): number {

    return this.remolques.filter(
      remolque => !remolque.camionHabitual
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

  hayBusqueda(): boolean {

    return this.busqueda.trim().length > 0;

  }

  hayFiltrosAplicados(): boolean {

    return (
      this.busqueda.trim().length > 0 ||
      this.filtroEstado !== 'todos'
    );

  }

  limpiarFiltros(): void {

    this.busqueda = '';
    this.filtroEstado = 'todos';

  }

  verDetalle(patente: string): void {

    this.router.navigate([
      '/remolques',
      patente
    ]);

  }

}