import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Remolque } from '../../../core/models/remolque';

@Component({
  selector: 'app-remolque-list',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './remolque-list.html',
  styleUrl: './remolque-list.scss'
})
export class RemolqueList implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  remolques: Remolque[] = [];

  cargando = true;
  error = '';

  busqueda = '';

  ngOnInit(): void {

    this.api.getRemolques().subscribe({

      next: remolques => {

        this.remolques = remolques;
        this.cargando = false;

      },

      error: error => {

        console.error(
          'Error al cargar remolques:',
          error
        );

        this.error =
          'No fue posible cargar los remolques.';

        this.cargando = false;

      }

    });

  }

  get remolquesFiltrados(): Remolque[] {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    if (!texto) {
      return this.remolques;
    }

    return this.remolques.filter(remolque => {

      const patenteCamion =
        remolque.camionHabitual?.patente
          ?.toLowerCase() ?? '';

      return (
        remolque.patente
          .toLowerCase()
          .includes(texto) ||

        remolque.marca
          .toLowerCase()
          .includes(texto) ||

        remolque.modelo
          .toLowerCase()
          .includes(texto) ||

        remolque.tipo
          .toLowerCase()
          .includes(texto) ||

        patenteCamion.includes(texto)
      );

    });

  }

  get remolquesActivos(): number {

    return this.remolques.filter(
      remolque => remolque.activa
    ).length;

  }

  get remolquesInactivos(): number {

    return this.remolques.filter(
      remolque => !remolque.activa
    ).length;

  }

  get remolquesSinCamion(): number {

    return this.remolques.filter(
      remolque => !remolque.camionHabitual
    ).length;

  }

  limpiarBusqueda(): void {

    this.busqueda = '';

  }

  hayBusqueda(): boolean {

    return this.busqueda.trim().length > 0;

  }

  verDetalle(patente: string): void {

    this.router.navigate([
      '/remolques',
      patente
    ]);

  }

}