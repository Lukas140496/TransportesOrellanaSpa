import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { GastoRemolque } from '../models/gasto-remolque';
import { CrearGastoRemolque } from '../models/crear-gasto-remolque';

@Injectable({
  providedIn: 'root'
})
export class GastoRemolqueService {

  private readonly api = inject(ApiService);

  getGastosRemolque(): Observable<GastoRemolque[]> {
    return this.api.getGastosRemolque();
  }

  getGastoRemolqueById(id: number): Observable<GastoRemolque> {
    return this.api.getGastoRemolqueById(id);
  }

  crearGastoRemolque(
    gasto: CrearGastoRemolque
  ): Observable<GastoRemolque> {
    return this.api.crearGastoRemolque(gasto);
  }
}
