import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Viaje } from '../../../core/models/viaje';

@Component({
  selector: 'app-viaje-detail',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './viaje-detail.html',
  styleUrl: './viaje-detail.scss'
})
export class ViajeDetail implements OnInit {

  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  viaje: Viaje | null = null;

  cargando = true;
  error = '';

  ngOnInit(): void {

    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      this.error = 'No se especificó un viaje.';
      this.cargando = false;
      return;
    }

    const id = Number(idParam);

    if (Number.isNaN(id)) {
      this.error = 'El identificador del viaje no es válido.';
      this.cargando = false;
      return;
    }

    this.api.getViajeById(id).subscribe({

      next: viaje => {
        this.viaje = viaje;
        this.cargando = false;
      },

      error: error => {
        console.error('Error al cargar viaje:', error);

        this.error = 'No fue posible cargar la información del viaje.';
        this.cargando = false;
      }

    });

  }

  volver(): void {
    this.router.navigate(['/viajes']);
  }

}