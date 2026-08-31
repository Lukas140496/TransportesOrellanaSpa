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

  getCamionById(id: number): Observable<Camion> {
    return this.http.get<Camion>(
      `${this.apiUrl}/camion/${id}`
    );
  }

  getConductores(): Observable<Conductor[]> {
    return this.http.get<Conductor[]>(
      `${this.apiUrl}/conductor`
    );
  }

  getConductorByRut(rut: string): Observable<Conductor> {
    return this.http.get<Conductor>(
      `${this.apiUrl}/conductor/${rut}`
    );
  }

  getRemolques(): Observable<Remolque[]> {
    return this.http.get<Remolque[]>(
      `${this.apiUrl}/remolque`
    );
  }

  getRemolqueByPatente(patente: string): Observable<Remolque> {
    return this.http.get<Remolque>(
      `${this.apiUrl}/remolque/${patente}`
    );
  }

  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(
      `${this.apiUrl}/cliente`
    );
  }

  getClienteById(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(
      `${this.apiUrl}/cliente/${id}`
    );
  }

  getViajes(): Observable<Viaje[]> {
    return this.http.get<Viaje[]>(
      `${this.apiUrl}/viaje`
    );
  }

  getViajeById(id: number): Observable<Viaje> {
    return this.http.get<Viaje>(
      `${this.apiUrl}/viaje/${id}`
    );
  }
}