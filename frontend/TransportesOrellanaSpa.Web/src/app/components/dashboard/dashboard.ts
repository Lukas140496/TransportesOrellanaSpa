import { Component, OnInit, inject } from '@angular/core';

import { ApiService } from '../../core/services/api';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  private readonly api = inject(ApiService);

  camionesCount = 0;
  conductoresCount = 0;
  remolquesCount = 0;
  clientesCount = 0;
  viajesCount = 0;

  ngOnInit(): void {

    this.api.getCamiones().subscribe({
      next: camiones => {
        this.camionesCount = camiones.length;
      },
      error: error => {
        console.error('ERROR CAMIONES:', error);
      }
    });

    this.api.getConductores().subscribe({
      next: conductores => {
        this.conductoresCount = conductores.length;
      },
      error: error => {
        console.error('ERROR CONDUCTORES:', error);
      }
    });

    this.api.getRemolques().subscribe({
      next: remolques => {
        this.remolquesCount = remolques.length;
      },
      error: error => {
        console.error('ERROR REMOLQUES:', error);
      }
    });

    this.api.getClientes().subscribe({
      next: clientes => {
        this.clientesCount = clientes.length;
      },
      error: error => {
        console.error('ERROR CLIENTES:', error);
      }
    });

    this.api.getViajes().subscribe({
      next: viajes => {
        this.viajesCount = viajes.length;
      },
      error: error => {
        console.error('ERROR VIAJES:', error);
      }
    });

  }
}