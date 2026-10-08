import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  private readonly api = inject(ApiService);

  private permisos: string[] = [];

  cargarPermisos(): Observable<string[]> {
    return this.api.getMisPermisos().pipe(
      tap(permisos => {
        this.permisos = permisos;
      })
    );
  }

  tienePermiso(permiso: string): boolean {
    return this.permisos.includes(permiso);
  }

  limpiarPermisos(): void {
    this.permisos = [];
  }

  obtenerPermisos(): string[] {
    return [...this.permisos];
  }
}