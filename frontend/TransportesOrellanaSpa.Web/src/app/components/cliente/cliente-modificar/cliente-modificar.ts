import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../core/models/cliente';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cliente-modificar',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './cliente-modificar.html',
  styleUrl: './cliente-modificar.scss'
})
export class ClienteModificar implements OnInit {

  private readonly clienteService = inject(ClienteService);
  private readonly router = inject(Router);

  clientes: Cliente[] = [];
  resultados: Cliente[] = [];

  terminoBusqueda = '';

  cargando = true;
  error = '';

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

  buscar(): void {

    const termino = this.normalizar(
      this.terminoBusqueda.trim()
    );

    if (!termino) {

      this.resultados = [];

      return;
    }

    this.resultados = this.clientes.filter(cliente => {

      const nombre = this.normalizar(cliente.nombre);
      const rut = this.normalizar(cliente.rut);

      return (
        nombre.includes(termino) ||
        rut.includes(termino)
      );

    });

  }

  limpiarBusqueda(): void {

    this.terminoBusqueda = '';
    this.resultados = [];

  }

  modificarCliente(id: number): void {

    this.router.navigate([
      '/clientes',
      id,
      'editar'
    ]);

  }

  volver(): void {

    this.router.navigate(['/clientes']);

  }

  private normalizar(valor: string): string {

    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  }

}