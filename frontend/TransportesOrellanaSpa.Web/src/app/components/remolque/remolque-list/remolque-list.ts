import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api';
import { Remolque } from '../../../core/models/remolque';

@Component({
  selector: 'app-remolque-list',
  imports: [],
  templateUrl: './remolque-list.html',
  styleUrl: './remolque-list.scss'
})
export class RemolqueList implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  remolques: Remolque[] = [];
  cargando = true;
  error = '';

  ngOnInit(): void {

    this.api.getRemolques().subscribe({

      next: remolques => {
        this.remolques = remolques;
        this.cargando = false;
      },

      error: error => {
        console.error('Error al cargar remolques:', error);

        this.error = 'No fue posible cargar los remolques.';
        this.cargando = false;
      }

    });

  }

  verDetalle(patente: string): void {
    this.router.navigate(['/remolques', patente]);
  }

}