import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { Camion } from '../models/camion';
import { Conductor } from '../models/conductor';
import { Remolque } from '../models/remolque';
import { Cliente } from '../models/cliente';
import { Viaje } from '../models/viaje';

import { DashboardResumen } from '../models/dashboard-resumen';
import { DashboardProduccionCamion } from '../models/dashboard-produccion-camion';
import { DashboardProduccionConductor } from '../models/dashboard-produccion-conductor';
import { CrearViaje } from '../models/crear-viaje';
import { DashboardProduccionCliente } from '../models/dashboard-produccion-cliente';
import { DashboardCostoCombustibleCamion } from '../models/dashboard-costo-combustible-camion';
import { ActualizarViaje } from '../models/actualizar-viaje';
import { CrearCamion } from '../models/crear-camion';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;

  // =========================
  // CAMIONES
  // =========================

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

  crearCamion(camion: CrearCamion): Observable<Camion> {
    return this.http.post<Camion>(
      `${this.apiUrl}/camion`,
      camion
    );
  }

  actualizarCamion(
    patente: string,
    camion: Camion
  ): Observable<Camion> {
    return this.http.put<Camion>(
      `${this.apiUrl}/camion/${patente}`,
      camion
    );
  }

  desactivarCamion(
    patente: string
  ): Observable<Camion> {
    return this.http.patch<Camion>(
      `${this.apiUrl}/camion/${patente}/desactivar`,
      {}
    );
  }
  
  activarCamion(
    patente: string
  ): Observable<Camion> {
    return this.http.patch<Camion>(
      `${this.apiUrl}/camion/${patente}/activar`,
      {}
    );
  }

  asignarRemolqueHabitual(
    patenteCamion: string,
    patenteRemolque: string
  ): Observable<{
    mensaje: string;
    camion: string;
    remolque: string;
  }> {
    return this.http.put<{
      mensaje: string;
      camion: string;
      remolque: string;
    }>(
      `${this.apiUrl}/camion/${patenteCamion}/remolque-habitual`,
      {
        patente: patenteRemolque
      }
    );
  }

  desasignarRemolquesHabituales(
    patenteCamion: string
  ): Observable<{
    mensaje: string;
    camion: string;
  }> {
    return this.http.delete<{
      mensaje: string;
      camion: string;
    }>(
      `${this.apiUrl}/camion/${patenteCamion}/remolque-habitual`
    );
  }

  asignarConductorHabitual(
    patenteCamion: string,
    rutConductor: string
  ): Observable<{
    mensaje: string;
    camion: Camion;
  }> {
    return this.http.put<{
      mensaje: string;
      camion: Camion;
    }>(
      `${this.apiUrl}/camion/${patenteCamion}/conductor-habitual`,
      {
        rut: rutConductor
      }
    );
  }

  desasignarConductorHabitual(
    patenteCamion: string,
    rutConductor: string
  ): Observable<{
    mensaje: string;
    camion: Camion;
    conductor: string;
  }> {
    return this.http.delete<{
      mensaje: string;
      camion: Camion;
      conductor: string;
    }>(
      `${this.apiUrl}/camion/${patenteCamion}/conductor-habitual/${rutConductor}`
    );
  }

  // =========================
  // CONDUCTORES
  // =========================

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

  // =========================
  // REMOLQUES
  // =========================

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

  asignarCamionHabitual(
    patenteRemolque: string,
    patenteCamion: string
  ): Observable<{
    mensaje: string;
    remolque: string;
    camion: string;
  }> {
    return this.http.put<{
      mensaje: string;
      remolque: string;
      camion: string;
    }>(
      `${this.apiUrl}/remolque/${patenteRemolque}/camion-habitual`,
      {
        patente: patenteCamion
      }
    );
  }

  desasignarCamionHabitual(
    patenteRemolque: string
  ): Observable<{
    mensaje: string;
    remolque: string;
  }> {
    return this.http.delete<{
      mensaje: string;
      remolque: string;
    }>(
      `${this.apiUrl}/remolque/${patenteRemolque}/camion-habitual`
    );
  }

  // =========================
  // CLIENTES
  // =========================

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

  crearCliente(cliente: Omit<Cliente, 'id'>): Observable<Cliente> {
    return this.http.post<Cliente>(
      `${this.apiUrl}/cliente`,
      cliente
    );
  }

  actualizarCliente(
    id: number,
    cliente: Omit<Cliente, 'id'>
  ): Observable<Cliente> {
    return this.http.put<Cliente>(
      `${this.apiUrl}/cliente/${id}`,
      cliente
    );
  }

  desactivarCliente(id: number): Observable<Cliente> {
    return this.http.put<Cliente>(
      `${this.apiUrl}/cliente/${id}/desactivar`,
      {}
    );
  }

  activarCliente(id: number): Observable<Cliente> {
    return this.http.put<Cliente>(
      `${this.apiUrl}/cliente/${id}/activar`,
      {}
    );
  }

  // =========================
  // VIAJES
  // =========================

  getViajes(
    guia?: string,
    fechaDesde?: string,
    fechaHasta?: string,
    clienteId?: number
  ): Observable<Viaje[]> {

    const params: Record<string, string> = {};

    if (guia?.trim()) {
      params['guia'] = guia.trim();
    }

    if (fechaDesde) {
      params['fechaDesde'] = fechaDesde;
    }

    if (fechaHasta) {
      params['fechaHasta'] = fechaHasta;
    }

    if (clienteId !== undefined) {
      params['clienteId'] = clienteId.toString();
    }

    return this.http.get<Viaje[]>(
      `${this.apiUrl}/viaje`,
      {
        params
      }
    );
  }

  getViajeById(id: number): Observable<Viaje> {
    return this.http.get<Viaje>(
      `${this.apiUrl}/viaje/${id}`
    );
  }

  crearViaje(viaje: CrearViaje): Observable<Viaje> {
    return this.http.post<Viaje>(
      `${this.apiUrl}/viaje`,
      viaje
    );
  }

  actualizarViaje(
    id: number,
    viaje: ActualizarViaje
  ): Observable<Viaje> {
    return this.http.put<Viaje>(
      `${this.apiUrl}/viaje/${id}`,
      viaje
    );
  }

  eliminarViaje(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/viaje/${id}`
    );
  }

  completarViaje(id: number): Observable<Viaje> {
    return this.http.patch<Viaje>(
      `${this.apiUrl}/viaje/${id}/completar`,
      {}
    );
  }

  pagarViaje(id: number): Observable<Viaje> {
    return this.http.patch<Viaje>(
      `${this.apiUrl}/viaje/${id}/pagar`,
      {}
    );
  }

  getViajesPendientesPago(
    clienteId?: number
  ): Observable<Viaje[]> {

    const params: Record<string, string> = {};

    if (clienteId !== undefined) {
      params['clienteId'] = clienteId.toString();
    }

    return this.http.get<Viaje[]>(
      `${this.apiUrl}/viaje/pendientes-pago`,
      {
        params
      }
    );
  }

  pagarViajesMasivo(
    numerosGuiaDespacho: string[]
  ): Observable<{
    cantidad: number;
    guias: string[];
    fechaPago: string;
  }> {

    return this.http.patch<{
      cantidad: number;
      guias: string[];
      fechaPago: string;
    }>(
      `${this.apiUrl}/viaje/pagar-masivo`,
      {
        numerosGuiaDespacho
      }
    );

  }

  // =========================
  // DASHBOARD
  // =========================

  getDashboardResumen(
    year?: number,
    month?: number
  ): Observable<DashboardResumen> {

    const params: Record<string, string> = {};

    if (year !== undefined) {
      params['year'] = year.toString();
    }

    if (month !== undefined) {
      params['month'] = month.toString();
    }

    return this.http.get<DashboardResumen>(
      `${this.apiUrl}/dashboard/resumen`,
      {
        params
      }
    );
  }

  getDashboardProduccionPorCamion(
    year?: number,
    month?: number
  ): Observable<DashboardProduccionCamion[]> {

    const params: Record<string, string> = {};

    if (year !== undefined) {
      params['year'] = year.toString();
    }

    if (month !== undefined) {
      params['month'] = month.toString();
    }

    return this.http.get<DashboardProduccionCamion[]>(
      `${this.apiUrl}/dashboard/produccion-por-camion`,
      {
        params
      }
    );
  }

  getDashboardProduccionPorConductor(
    year?: number,
    month?: number
  ): Observable<DashboardProduccionConductor[]> {

    const params: Record<string, string> = {};

    if (year !== undefined) {
      params['year'] = year.toString();
    }

    if (month !== undefined) {
      params['month'] = month.toString();
    }

    return this.http.get<DashboardProduccionConductor[]>(
      `${this.apiUrl}/dashboard/produccion-por-conductor`,
      {
        params
      }
    );
  }

  getProduccionPorCliente(
    year?: number,
    month?: number
  ): Observable<DashboardProduccionCliente[]> {

    const params: Record<string, string> = {};

    if (year !== undefined) {
      params['year'] = year.toString();
    }

    if (month !== undefined) {
      params['month'] = month.toString();
    }

    return this.http.get<DashboardProduccionCliente[]>(
      `${this.apiUrl}/dashboard/produccion-por-cliente`,
      {
        params
      }
    );
  }

  getCostoCombustiblePorCamion(
    year?: number,
    month?: number
  ): Observable<DashboardCostoCombustibleCamion[]> {

    const params: Record<string, string> = {};

    if (year !== undefined) {
      params['year'] = year.toString();
    }

    if (month !== undefined) {
      params['month'] = month.toString();
    }

    return this.http.get<DashboardCostoCombustibleCamion[]>(
      `${this.apiUrl}/dashboard/costo-combustible-por-camion`,
      {
        params
      }
    );
  }
}