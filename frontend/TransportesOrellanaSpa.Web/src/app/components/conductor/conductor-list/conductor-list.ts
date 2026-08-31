import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api';
import { Conductor } from '../../../core/models/conductor';

@Component({
  selector: 'app-conductor-list',
  imports: [DatePipe],
  templateUrl: './conductor-list.html',
  styleUrl: './conductor-list.scss'
})
export class ConductorList implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  conductores: Conductor[] = [];
  cargando = true;
  error = '';

  ngOnInit(): void {
    this.api.getConductores().subscribe({
      next: conductores => {
        this.conductores = conductores;
        this.cargando = false;
      },
      error: error => {
        console.error('Error al cargar conductores:', error);

        this.error = 'No fue posible cargar los conductores.';
        this.cargando = false;
      }
    });
  }

  verDetalle(rut: string): void {
    this.router.navigate(['/conductores', rut]);
  }
}