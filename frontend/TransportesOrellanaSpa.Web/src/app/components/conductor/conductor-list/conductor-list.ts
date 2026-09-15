import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Conductor } from '../../../core/models/conductor';

@Component({
  selector: 'app-conductor-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule
  ],
  templateUrl: './conductor-list.html',
  styleUrl: './conductor-list.scss'
})
export class ConductorList implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  conductores: Conductor[] = [];

  cargando = true;
  error = '';

  busqueda = '';

  ngOnInit(): void {

    this.api.getConductores().subscribe({

      next: conductores => {

        this.conductores = conductores;
        this.cargando = false;

      },

      error: error => {

        console.error(
          'Error al cargar conductores:',
          error
        );

        this.error =
          'No fue posible cargar los conductores.';

        this.cargando = false;

      }

    });

  }

  get conductoresFiltrados(): Conductor[] {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    if (!texto) {
      return this.conductores;
    }

    return this.conductores.filter(conductor => {

      const nombreCompleto = [
        conductor.nombres,
        conductor.apellidoPaterno,
        conductor.apellidoMaterno
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        conductor.rut
          .toLowerCase()
          .includes(texto) ||

        nombreCompleto
          .includes(texto) ||

        conductor.telefono
          .toLowerCase()
          .includes(texto) ||

        conductor.tipoLicencia
          .toLowerCase()
          .includes(texto)
      );

    });

  }

  get licenciasAlDia(): number {

    return this.conductores.filter(
      conductor => conductor.licenciaAlDia
    ).length;

  }

  get licenciasVencidas(): number {

    return this.conductores.filter(
      conductor => !conductor.licenciaAlDia
    ).length;

  }

  limpiarBusqueda(): void {

    this.busqueda = '';

  }

  hayBusqueda(): boolean {

    return this.busqueda.trim().length > 0;

  }

  verDetalle(rut: string): void {

    this.router.navigate([
      '/conductores',
      rut
    ]);

  }

}