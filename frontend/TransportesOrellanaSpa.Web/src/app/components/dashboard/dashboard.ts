import { Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { ApiService } from '../../core/services/api.service';
import { DashboardProduccionCamion } from '../../core/models/dashboard-produccion-camion';
import { DashboardProduccionConductor } from '../../core/models/dashboard-produccion-conductor';
import { DashboardResumen } from '../../core/models/dashboard-resumen';
import { DashboardProduccionCliente } from '../../core/models/dashboard-produccion-cliente';
import { DashboardCostoCombustibleCamion } from '../../core/models/dashboard-costo-combustible-camion';

interface PeriodoDashboard {
  year: number;
  month: number;
  nombre: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  private readonly api = inject(ApiService);

  resumen: DashboardResumen | null = null;

  produccionCamiones: DashboardProduccionCamion[] = [];

  produccionConductores: DashboardProduccionConductor[] = [];

  produccionClientes: DashboardProduccionCliente[] = [];

  costoCombustibleCamiones: DashboardCostoCombustibleCamion[] = [];

  // Carga inicial del dashboard
  cargando = true;

  // Cambio de período después de que el dashboard ya cargó
  cambiandoPeriodo = false;

  error = '';

  selectorAbierto = false;

  periodos: PeriodoDashboard[] = [];

  periodoSeleccionado!: PeriodoDashboard;


  ngOnInit(): void {

    this.inicializarPeriodos();

    this.cargarDashboardInicial();
  }


  private inicializarPeriodos(): void {

    const fechaActual = new Date();

    const anioActual = fechaActual.getFullYear();

    const mesActual = fechaActual.getMonth() + 1;

    this.periodos = [];

    for (let i = 0; i < 12; i++) {

      const fecha = new Date(
        anioActual,
        mesActual - 1 - i,
        1
      );

      const year = fecha.getFullYear();

      const month = fecha.getMonth() + 1;

      const nombreMes = fecha.toLocaleDateString(
        'es-CL',
        {
          month: 'long'
        }
      );

      const nombre = `${nombreMes} ${year}`;

      this.periodos.push({
        year,
        month,
        nombre
      });
    }

    this.periodoSeleccionado = this.periodos[0];
  }


  private cargarDashboardInicial(): void {

    this.cargando = true;

    this.cambiandoPeriodo = false;

    this.cargarDatosPeriodo(
      this.periodoSeleccionado.year,
      this.periodoSeleccionado.month,
      true
    );
  }


  seleccionarPeriodo(periodo: PeriodoDashboard): void {

    if (
      periodo.year === this.periodoSeleccionado.year &&
      periodo.month === this.periodoSeleccionado.month
    ) {
      this.selectorAbierto = false;
      return;
    }

    // Actualizamos inmediatamente el período mostrado
    this.periodoSeleccionado = periodo;

    // Cerramos el selector
    this.selectorAbierto = false;

    // Activamos la transición suave
    this.cambiandoPeriodo = true;

    this.cargarDatosPeriodo(
      periodo.year,
      periodo.month,
      false
    );
  }


  toggleSelector(): void {

    this.selectorAbierto = !this.selectorAbierto;
  }


  private cargarDatosPeriodo(
    year: number,
    month: number,
    cargaInicial: boolean
  ): void {

    if (cargaInicial) {
      this.cargando = true;
    }

    this.error = '';

    let resumenCargado = false;

    let camionesCargados = false;

    let conductoresCargados = false;

    let clientesCargados = false;

    let costoCombustibleCargado = false;


    const finalizarTransicion = (): void => {

      if (
        resumenCargado &&
        camionesCargados &&
        conductoresCargados &&
        clientesCargados &&
        costoCombustibleCargado
      ) {

        if (cargaInicial) {

          this.cargando = false;

        } else {

          /*
           * Pequeña pausa para que la animación
           * de entrada tenga tiempo de ejecutarse.
           */
          setTimeout(() => {
            this.cambiandoPeriodo = false;
          }, 80);
        }
      }
    };


    this.api.getDashboardResumen(
      year,
      month
    ).subscribe({

      next: resumen => {

        this.resumen = resumen;

        resumenCargado = true;

        finalizarTransicion();
      },

      error: error => {

        console.error(
          'ERROR DASHBOARD RESUMEN:',
          error
        );

        this.error =
          'No fue posible cargar la información del dashboard.';

        resumenCargado = true;

        finalizarTransicion();
      }
    });


    this.api.getDashboardProduccionPorCamion(
      year,
      month
    ).subscribe({

      next: produccion => {

        this.produccionCamiones = produccion;

        camionesCargados = true;

        finalizarTransicion();
      },

      error: error => {

        console.error(
          'ERROR PRODUCCIÓN CAMIONES:',
          error
        );

        camionesCargados = true;

        finalizarTransicion();
      }
    });


    this.api.getDashboardProduccionPorConductor(
      year,
      month
    ).subscribe({

      next: produccion => {

        this.produccionConductores = produccion;

        conductoresCargados = true;

        finalizarTransicion();
      },

      error: error => {

        console.error(
          'ERROR PRODUCCIÓN CONDUCTORES:',
          error
        );

        conductoresCargados = true;

        finalizarTransicion();
      }
    });

    this.api.getProduccionPorCliente(
      year,
      month
    ).subscribe({
    
      next: produccion => {
    
        this.produccionClientes = produccion;
    
        clientesCargados = true;
    
        finalizarTransicion();
      },
    
      error: error => {
    
        console.error(
          'ERROR PRODUCCIÓN CLIENTES:',
          error
        );
    
        clientesCargados = true;
    
        finalizarTransicion();
      }
    });

    this.api.getCostoCombustiblePorCamion(
      year,
      month
    ).subscribe({
    
      next: costos => {
    
        this.costoCombustibleCamiones = costos;
    
        costoCombustibleCargado = true;
    
        finalizarTransicion();
      },
    
      error: error => {
    
        console.error(
          'ERROR COSTO COMBUSTIBLE CAMIONES:',
          error
        );
    
        costoCombustibleCargado = true;
    
        finalizarTransicion();
      }
    });
  }


  formatoMoneda(valor: number): string {

    return new Intl.NumberFormat(
      'es-CL',
      {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0
      }
    ).format(valor);
  }


  formatoNumero(valor: number): string {

    return new Intl.NumberFormat(
      'es-CL',
      {
        maximumFractionDigits: 0
      }
    ).format(valor);
  }


  obtenerPorcentajeCamion(
    produccion: number
  ): number {

    if (!this.produccionCamiones.length) {
      return 0;
    }

    const produccionMaxima = Math.max(
      ...this.produccionCamiones.map(
        camion => camion.produccion
      )
    );

    if (produccionMaxima === 0) {
      return 0;
    }

    return (
      produccion / produccionMaxima
    ) * 100;
  }


  obtenerPorcentajeConductor(
    produccion: number
  ): number {

    if (!this.produccionConductores.length) {
      return 0;
    }

    const produccionMaxima = Math.max(
      ...this.produccionConductores.map(
        conductor => conductor.produccion
      )
    );

    if (produccionMaxima === 0) {
      return 0;
    }

    return (
      produccion / produccionMaxima
    ) * 100;
  }

  obtenerPorcentajeCliente(
    produccion: number
  ): number {
  
    if (!this.produccionClientes.length) {
      return 0;
    }
  
    const produccionMaxima = Math.max(
      ...this.produccionClientes.map(
        cliente => cliente.produccion
      )
    );
  
    if (produccionMaxima === 0) {
      return 0;
    }
  
    return (
      produccion / produccionMaxima
    ) * 100;
  }

  obtenerPorcentajeCostoCombustible(
    costo: number
  ): number {
  
    if (!this.costoCombustibleCamiones.length) {
      return 0;
    }
  
    const costoMaximo = Math.max(
      ...this.costoCombustibleCamiones.map(
        camion => camion.costoCombustible
      )
    );
  
    if (costoMaximo === 0) {
      return 0;
    }
  
    return (
      costo / costoMaximo
    ) * 100;
  }
}