import { Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Cliente } from '../../../core/models/cliente';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule
  ],
  templateUrl: './cliente-list.html',
  styleUrl: './cliente-list.scss'
})
export class ClienteList implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  clientes: Cliente[] = [];

  cargando = true;
  error = '';

  busqueda = '';
  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'todos';

  ngOnInit(): void {

    this.api.getClientes().subscribe({

      next: clientes => {

        this.clientes = clientes;
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

  get clientesFiltrados(): Cliente[] {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    return this.clientes.filter(cliente => {

      const coincideBusqueda =
        !texto ||
        cliente.nombre
          .toLowerCase()
          .includes(texto) ||
        cliente.rut
          .toLowerCase()
          .includes(texto) ||
        cliente.comuna
          .toLowerCase()
          .includes(texto) ||
        cliente.ciudad
          .toLowerCase()
          .includes(texto) ||
        cliente.tipoCarga
          .toLowerCase()
          .includes(texto);

      const coincideEstado =
        this.filtroEstado === 'todos' ||
        (
          this.filtroEstado === 'activos' &&
          cliente.activo
        ) ||
        (
          this.filtroEstado === 'inactivos' &&
          !cliente.activo
        );

      return (
        coincideBusqueda &&
        coincideEstado
      );

    });

  }

  get cantidadActivos(): number {

    return this.clientes.filter(
      cliente => cliente.activo
    ).length;

  }

  get cantidadInactivos(): number {

    return this.clientes.filter(
      cliente => !cliente.activo
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

  nuevoCliente(): void {

    this.router.navigate([
      '/clientes/nuevo'
    ]);

  }

  verDetalle(id: number): void {

    this.router.navigate([
      '/clientes',
      id
    ]);

  }

}