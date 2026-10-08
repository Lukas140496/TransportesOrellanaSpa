import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { UsuarioService } from '../../../core/services/usuario.service';
import { Usuario } from '../../../core/models/usuario/usuario';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule
  ],
  templateUrl: './usuario-list.html',
  styleUrl: './usuario-list.scss'
})
export class UsuarioList implements OnInit {

  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);

  usuarios: Usuario[] = [];

  cargando = true;
  error = '';

  busqueda = '';

  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'todos';

  ngOnInit(): void {

    this.cargarUsuarios();

  }

  cargarUsuarios(): void {

    this.cargando = true;
    this.error = '';

    this.usuarioService.getUsuarios().subscribe({

      next: usuarios => {

        this.usuarios = usuarios;
        this.cargando = false;

      },

      error: error => {

        console.error(
          'Error al cargar usuarios:',
          error
        );

        this.error =
          'No fue posible cargar los usuarios.';

        this.cargando = false;

      }

    });

  }

  get usuariosFiltrados(): Usuario[] {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    return this.usuarios.filter(usuario => {

      // =====================================================
      // FILTRO POR ESTADO
      // =====================================================

      const coincideEstado =
        this.filtroEstado === 'todos' ||
        (
          this.filtroEstado === 'activos' &&
          usuario.activo
        ) ||
        (
          this.filtroEstado === 'inactivos' &&
          !usuario.activo
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

      const roles =
        usuario.roles
          .join(' ')
          .toLowerCase();

      return (
        usuario.rut
          .toLowerCase()
          .includes(texto) ||

        usuario.nombreCompleto
          .toLowerCase()
          .includes(texto) ||

        usuario.email
          .toLowerCase()
          .includes(texto) ||

        roles.includes(texto)
      );

    });

  }

  get cantidadActivos(): number {

    return this.usuarios.filter(
      usuario => usuario.activo
    ).length;

  }

  get cantidadInactivos(): number {

    return this.usuarios.filter(
      usuario => !usuario.activo
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

  nuevoUsuario(): void {

    this.router.navigate([
      '/usuarios/nuevo'
    ]);

  }

}