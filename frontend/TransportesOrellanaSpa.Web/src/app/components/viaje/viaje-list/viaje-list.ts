import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Viaje } from '../../../core/models/viaje';

@Component({
  selector: 'app-viaje-list',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './viaje-list.html',
  styleUrl: './viaje-list.scss'
})
export class ViajeList implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  viajes: Viaje[] = [];
  cargando = true;
  error = '';

  ngOnInit(): void {

    this.api.getViajes().subscribe({

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

  verDetalle(id: number): void {
    this.router.navigate(['/viajes', id]);
  }

}