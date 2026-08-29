import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { Camion } from '../models/camion';
import { Conductor } from '../models/conductor';
import { Remolque } from '../models/remolque';
import { Cliente } from '../models/cliente';
import { Viaje } from '../models/viaje';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;

  getCamiones(): Observable<Camion[]> {
    return this.http.get<Camion[]>(
      `${this.apiUrl}/camion`
    );
  }

  getConductores(): Observable<Conductor[]> {
    return this.http.get<Conductor[]>(
      `${this.apiUrl}/conductor`
    );
  }

  getRemolques(): Observable<Remolque[]> {
    return this.http.get<Remolque[]>(
      `${this.apiUrl}/remolque`
    );
  }

  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(
      `${this.apiUrl}/cliente`
    );
  }

  getViajes(): Observable<Viaje[]> {
    return this.http.get<Viaje[]>(
      `${this.apiUrl}/viaje`
    );
  }
}