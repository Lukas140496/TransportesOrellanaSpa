import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { Cliente } from '../models/cliente';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private readonly api = inject(ApiService);

  getClientes(): Observable<Cliente[]> {
    return this.api.getClientes();
  }

  getClienteById(id: number): Observable<Cliente> {
    return this.api.getClienteById(id);
  }

  crearCliente(cliente: Omit<Cliente, 'id'>): Observable<Cliente> {
    return this.api.crearCliente(cliente);
  }

  actualizarCliente(
    id: number,
    cliente: Omit<Cliente, 'id'>
  ): Observable<Cliente> {
    return this.api.actualizarCliente(id, cliente);
  }
}