import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api';
import { Camion } from '../../../core/models/camion';

@Component({
  selector: 'app-camion-list',
  imports: [],
  templateUrl: './camion-list.html',
  styleUrl: './camion-list.scss'
})
export class CamionList implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  camiones: Camion[] = [];
  cargando = true;
  error = '';

  ngOnInit(): void {
    this.api.getCamiones().subscribe({
      next: camiones => {
        this.camiones = camiones;
        this.cargando = false;
      },
      error: error => {
        console.error('Error al cargar camiones:', error);

        this.error = 'No fue posible cargar los camiones.';
        this.cargando = false;
      }
    });
  }

  verDetalle(patente: string): void {
    this.router.navigate(['/camiones', patente]);
  }
}