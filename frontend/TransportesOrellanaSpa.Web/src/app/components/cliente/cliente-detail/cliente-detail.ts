import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../core/models/cliente';

@Component({
  selector: 'app-cliente-detail',
  imports: [DecimalPipe],
  templateUrl: './cliente-detail.html',
  styleUrl: './cliente-detail.scss'
})
export class ClienteDetail implements OnInit {

  private readonly clienteService = inject(ClienteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  cliente: Cliente | null = null;

  cargando = true;
  error = '';

  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error = 'No se especificó un cliente.';
      this.cargando = false;
      return;
    }

    const clienteId = Number(id);

    if (isNaN(clienteId)) {
      this.error = 'El identificador del cliente no es válido.';
      this.cargando = false;
      return;
    }

    this.clienteService.getClienteById(clienteId).subscribe({

      next: cliente => {
        this.cliente = cliente;
        this.cargando = false;
      },

      error: error => {
        console.error('Error al cargar cliente:', error);

        this.error = 'No fue posible cargar la información del cliente.';
        this.cargando = false;
      }

    });

  }

  volver(): void {
    this.router.navigate(['/clientes']);
  }

  editar(): void {

    if (!this.cliente) {
      return;
    }

    this.router.navigate([
      '/clientes',
      this.cliente.id,
      'editar'
    ]);

  }

}