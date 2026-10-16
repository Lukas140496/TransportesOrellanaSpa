
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { GastoConductor } from '../models/gasto-conductor';
import { CrearGastoConductor } from '../models/crear-gasto-conductor';

@Injectable({
  providedIn: 'root'
})
export class GastoConductorService {

  private readonly api = inject(ApiService);

  getGastosConductor(): Observable<GastoConductor[]> {
    return this.api.getGastosConductor();
  }

  getGastoConductorById(id: number): Observable<GastoConductor> {
    return this.api.getGastoConductorById(id);
  }

  crearGastoConductor(
    gasto: CrearGastoConductor
  ): Observable<GastoConductor> {
    return this.api.crearGastoConductor(gasto);
  }
}
