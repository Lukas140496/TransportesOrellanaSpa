import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { Gasto } from '../models/gasto';
import { CrearGasto } from '../models/crear-gasto';

@Injectable({
  providedIn: 'root'
})
export class GastoService {

  private readonly api = inject(ApiService);

  getGastos(): Observable<Gasto[]> {
    return this.api.getGastos();
  }

  getGastoById(id: number): Observable<Gasto> {
    return this.api.getGastoById(id);
  }

  crearGasto(gasto: CrearGasto): Observable<Gasto> {
    return this.api.crearGasto(gasto);
  }
}