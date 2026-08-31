import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService } from '../../../core/services/api';
import { Remolque } from '../../../core/models/remolque';

@Component({
  selector: 'app-remolque-detail',
  imports: [],
  templateUrl: './remolque-detail.html',
  styleUrl: './remolque-detail.scss'
})
export class RemolqueDetail implements OnInit {

  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  remolque: Remolque | null = null;

  cargando = true;
  error = '';

  ngOnInit(): void {

    const patente = this.route.snapshot.paramMap.get('patente');

    if (!patente) {
      this.error = 'No se especificó una patente.';
      this.cargando = false;
      return;
    }

    this.api.getRemolqueByPatente(patente).subscribe({
      next: remolque => {
        this.remolque = remolque;
        this.cargando = false;
      },
      error: error => {
        console.error('Error al cargar remolque:', error);

        this.error = 'No fue posible cargar la información del remolque.';
        this.cargando = false;
      }
    });

  }

  volver(): void {
    this.router.navigate(['/remolques']);
  }

}