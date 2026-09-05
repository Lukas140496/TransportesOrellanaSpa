import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Cliente } from '../../../core/models/cliente';

@Component({
  selector: 'app-cliente-list',
  imports: [],
  templateUrl: './cliente-list.html',
  styleUrl: './cliente-list.scss'
})
export class ClienteList implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  clientes: Cliente[] = [];
  cargando = true;
  error = '';

  ngOnInit(): void {

    this.api.getClientes().subscribe({

      next: clientes => {
        this.clientes = clientes;
        this.cargando = false;
      },

      error: error => {
        console.error('Error al cargar clientes:', error);

        this.error = 'No fue posible cargar los clientes.';
        this.cargando = false;
      }

    });

  }

  nuevoCliente(): void {
    this.router.navigate(['/clientes/nuevo']);
  }

  verDetalle(id: number): void {
    this.router.navigate(['/clientes', id]);
  }

}