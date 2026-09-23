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
import { DashboardKilometrosCamion } from '../models/dashboard-kilometros-camion';
import { DashboardEstadoPagos } from '../models/dashboard-estado-pagos';

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

  crearConductor(conductor: {
    rut: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    fechaNacimiento: string;
    edad: number;
    fechaIngreso: string;
    telefono: string;
    tipoLicencia: string;
    fechaControlLicencia: string;
    licenciaAlDia: boolean;
  }): Observable<Conductor> {
    return this.http.post<Conductor>(
      `${this.apiUrl}/conductor`,
      conductor
    );
  }

  actualizarConductor(
    rut: string,
    conductor: Conductor
  ): Observable<void> {
  
    return this.http.put<void>(
      `${this.apiUrl}/conductor/${rut}`,
      conductor
    );
  
  }

  activarConductor(
    rut: string
  ): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/conductor/${rut}/activar`,
      {}
    );
  }

  desactivarConductor(
    rut: string
  ): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/conductor/${rut}/desactivar`,
      {}
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

  crearRemolque(remolque: {
    patente: string;
    marca: string;
    modelo: string;
    ano: number;
    tipo: string;
    capacidadToneladas: number;
    activa: boolean;
    camionHabitualId: number | null;
  }): Observable<Remolque> {
    return this.http.post<Remolque>(
      `${this.apiUrl}/remolque`,
      remolque
    );
  }

  actualizarRemolque(
    patente: string,
    remolque: {
      marca: string;
      modelo: string;
      ano: number;
      tipo: string;
      capacidadToneladas: number;
      activa: boolean;
      camionHabitualId: number | null;
    }
  ): Observable<Remolque> {
    return this.http.put<Remolque>(
      `${this.apiUrl}/remolque/${patente}`,
      remolque
    );
  }

  desactivarRemolque(
    patente: string
  ): Observable<Remolque> {
    return this.http.patch<Remolque>(
      `${this.apiUrl}/remolque/${patente}/desactivar`,
      {}
    );
  }

  activarRemolque(
    patente: string
  ): Observable<Remolque> {
    return this.http.patch<Remolque>(
      `${this.apiUrl}/remolque/${patente}/activar`,
      {}
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
    clienteId?: number,
    estadoPago?: string
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
  
    if (estadoPago) {
      params['estadoPago'] = estadoPago;
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

  getKilometrosPorCamion(
    year?: number,
    month?: number
  ): Observable<DashboardKilometrosCamion[]> {

    const params: Record<string, string> = {};

    if (year !== undefined) {
      params['year'] = year.toString();
    }

    if (month !== undefined) {
      params['month'] = month.toString();
    }

    return this.http.get<DashboardKilometrosCamion[]>(
      `${this.apiUrl}/dashboard/kilometros-por-camion`,
      {
        params
      }
    );
  }


  getEstadoPagosDashboard(
    year?: number,
    month?: number
  ): Observable<DashboardEstadoPagos> {

    const params: Record<string, string> = {};

    if (year !== undefined) {
      params['year'] = year.toString();
    }

    if (month !== undefined) {
      params['month'] = month.toString();
    }

    return this.http.get<DashboardEstadoPagos>(
      `${this.apiUrl}/dashboard/estado-pagos`,
      {
        params
      }
    );
  }
}