import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';

import { ApiService } from '../../../core/services/api';
import { Conductor } from '../../../core/models/conductor';

@Component({
  selector: 'app-conductor-detail',
  imports: [DatePipe],
  templateUrl: './conductor-detail.html',
  styleUrl: './conductor-detail.scss'
})
export class ConductorDetail implements OnInit {

  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  conductor: Conductor | null = null;

  cargando = true;
  error = '';

  ngOnInit(): void {

    const rut = this.route.snapshot.paramMap.get('rut');

    if (!rut) {
      this.error = 'No se especificó un RUT.';
      this.cargando = false;
      return;
    }

    this.api.getConductorByRut(rut).subscribe({
      next: conductor => {
        this.conductor = conductor;
        this.cargando = false;
      },
      error: error => {
        console.error('Error al cargar conductor:', error);

        this.error = 'No fue posible cargar la información del conductor.';
        this.cargando = false;
      }
    });

  }

  volver(): void {
    this.router.navigate(['/conductores']);
  }

}