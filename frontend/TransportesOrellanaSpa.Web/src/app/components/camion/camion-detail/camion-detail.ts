import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '../../../core/services/api';
import { Camion } from '../../../core/models/camion';

@Component({
  selector: 'app-camion-detail',
  imports: [DatePipe],
  templateUrl: './camion-detail.html',
  styleUrl: './camion-detail.scss'
})
export class CamionDetail implements OnInit {

  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  camion: Camion | null = null;

  cargando = true;

  error = '';

  ngOnInit(): void {

    const patente = this.route.snapshot.paramMap.get('patente');

    if (!patente) {
      this.error = 'No se indicó la patente del camión.';
      this.cargando = false;
      return;
    }

    this.api.getCamiones().subscribe({

      next: camiones => {

        this.camion =
          camiones.find(
            camion =>
              camion.patente.toUpperCase() === patente.toUpperCase()
          ) ?? null;

        if (!this.camion) {
          this.error = 'No se encontró el camión solicitado.';
        }

        this.cargando = false;
      },

      error: error => {

        console.error(
          'Error al cargar el detalle del camión:',
          error
        );

        this.error =
          'No fue posible cargar la información del camión.';

        this.cargando = false;
      }

    });
  }

  volver(): void {
    this.router.navigate(['/camiones']);
  }
}