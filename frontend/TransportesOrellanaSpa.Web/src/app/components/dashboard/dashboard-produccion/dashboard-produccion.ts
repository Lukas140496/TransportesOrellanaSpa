
import { Component, OnInit, inject } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api.service';

import { DashboardProduccionCamion } from '../../../core/models/dashboard-produccion-camion';
import { DashboardProduccionConductor } from '../../../core/models/dashboard-produccion-conductor';
import { DashboardProduccionCliente } from '../../../core/models/dashboard-produccion-cliente';

interface PeriodoDashboard {
  year: number;
  month: number;
  nombre: string;
}

interface ProduccionMensual {
  year: number;
  month: number;
  nombre: string;
  produccion: number | null;
  viajes: number | null;
  kilometros: number | null;
  litrosCombustible: number | null;
  costoCombustible: number | null;
}

@Component({
  selector: 'app-dashboard-produccion',
  imports: [],
  templateUrl: './dashboard-produccion.html',
  styleUrl: './dashboard-produccion.scss'
})
export class DashboardProduccion implements OnInit {

  private readonly api = inject(ApiService);

  produccionCamiones: DashboardProduccionCamion[] = [];
  produccionConductores: DashboardProduccionConductor[] = [];
  produccionClientes: DashboardProduccionCliente[] = [];

  historialProduccion: ProduccionMensual[] = [];

  cargando = true;
  cambiandoPeriodo = false;
  historialCargando = false;
  historialDisponible = true;
  error = '';

  selectorAbierto = false;
  periodos: PeriodoDashboard[] = [];
  periodoSeleccionado!: PeriodoDashboard;

  ultimaActualizacion: Date | null = null;

  ngOnInit(): void {
    this.inicializarPeriodos();

    this.cargarDatosPeriodo(
      this.periodoSeleccionado.year,
      this.periodoSeleccionado.month,
      true
    );
  }

  private inicializarPeriodos(): void {
    const actual = new Date();

    for (let i = 0; i < 12; i++) {
      const fecha = new Date(
        actual.getFullYear(),
        actual.getMonth() - i,
        1
      );

      this.periodos.push(this.crearPeriodo(fecha));
    }

    this.periodoSeleccionado = this.periodos[0];
  }

  private crearPeriodo(fecha: Date): PeriodoDashboard {
    const year = fecha.getFullYear();
    const month = fecha.getMonth() + 1;

    const nombreMes = fecha.toLocaleDateString('es-CL', {
      month: 'long'
    });

    return {
      year,
      month,
      nombre: `${nombreMes} ${year}`
    };
  }

  seleccionarPeriodo(periodo: PeriodoDashboard): void {
    if (
      periodo.year === this.periodoSeleccionado.year &&
      periodo.month === this.periodoSeleccionado.month
    ) {
      this.selectorAbierto = false;
      return;
    }

    this.periodoSeleccionado = periodo;
    this.selectorAbierto = false;

    this.cargarDatosPeriodo(periodo.year, periodo.month, false);
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
    } else {
      this.cambiandoPeriodo = true;
    }

    this.error = '';

    let pendientes = 3;
    let fallo = false;

    const finalizar = (): void => {
      pendientes--;

      if (pendientes === 0) {
        this.cargando = false;
        this.cambiandoPeriodo = false;

        if (fallo) {
          this.error =
            'No fue posible cargar toda la información de producción.';
        } else {
          this.ultimaActualizacion = new Date();
        }
      }
    };

    this.api.getDashboardProduccionPorCamion(year, month)
      .subscribe({
        next: datos => {
          this.produccionCamiones = datos;
          finalizar();
        },
        error: err => {
          console.error('ERROR PRODUCCIÓN POR CAMIÓN:', err);
          this.produccionCamiones = [];
          fallo = true;
          finalizar();
        }
      });

    this.api.getDashboardProduccionPorConductor(year, month)
      .subscribe({
        next: datos => {
          this.produccionConductores = datos;
          finalizar();
        },
        error: err => {
          console.error('ERROR PRODUCCIÓN POR CONDUCTOR:', err);
          this.produccionConductores = [];
          fallo = true;
          finalizar();
        }
      });

    this.api.getProduccionPorCliente(year, month)
      .subscribe({
        next: datos => {
          this.produccionClientes = datos;
          finalizar();
        },
        error: err => {
          console.error('ERROR PRODUCCIÓN POR CLIENTE:', err);
          this.produccionClientes = [];
          fallo = true;
          finalizar();
        }
      });

    this.cargarHistorial(year, month);
  }

  private cargarHistorial(year: number, month: number): void {
    this.historialCargando = true;
    this.historialDisponible = true;

    const periodos: PeriodoDashboard[] = [];

    for (let i = 11; i >= 0; i--) {
      periodos.push(
        this.crearPeriodo(new Date(year, month - 1 - i, 1))
      );
    }

    const consultas = periodos.map(periodo =>
      this.api.getDashboardProduccionPorCamion(
        periodo.year,
        periodo.month
      ).pipe(
        map(datos => ({
          year: periodo.year,
          month: periodo.month,
          nombre: periodo.nombre,

          produccion: datos.reduce(
            (total, camion) => total + camion.produccion,
            0
          ),

          viajes: datos.reduce(
            (total, camion) => total + camion.viajes,
            0
          ),

          kilometros: datos.reduce(
            (total, camion) => total + camion.kilometros,
            0
          ),

          litrosCombustible: datos.reduce(
            (total, camion) => total + camion.litrosCombustible,
            0
          ),

          costoCombustible: datos.reduce(
            (total, camion) => total + camion.costoCombustible,
            0
          )
        })),
        catchError(err => {
          console.error(
            `ERROR HISTORIAL DE PRODUCCIÓN ${periodo.nombre}:`,
            err
          );

          return of({
            year: periodo.year,
            month: periodo.month,
            nombre: periodo.nombre,
            produccion: null,
            viajes: null,
            kilometros: null,
            litrosCombustible: null,
            costoCombustible: null
          });
        })
      )
    );

    forkJoin(consultas).subscribe({
      next: historial => {
        this.historialProduccion = historial;
        this.historialDisponible = historial.every(
          periodo => periodo.produccion !== null
        );
        this.historialCargando = false;
      },
      error: err => {
        console.error('ERROR CARGANDO HISTORIAL:', err);
        this.historialDisponible = false;
        this.historialCargando = false;
        this.historialProduccion = [];
      }
    });
  }

  get produccionTotal(): number {
    return this.produccionCamiones.reduce(
      (total, camion) => total + camion.produccion,
      0
    );
  }

  get viajesTotales(): number {
    return this.produccionCamiones.reduce(
      (total, camion) => total + camion.viajes,
      0
    );
  }

  get kilometrosTotales(): number {
    return this.produccionCamiones.reduce(
      (total, camion) => total + camion.kilometros,
      0
    );
  }

  get litrosTotales(): number {
    return this.produccionCamiones.reduce(
      (total, camion) => total + camion.litrosCombustible,
      0
    );
  }

  get costoCombustibleTotal(): number {
    return this.produccionCamiones.reduce(
      (total, camion) => total + camion.costoCombustible,
      0
    );
  }

  get produccionPromedioViaje(): number {
    return this.viajesTotales > 0
      ? this.produccionTotal / this.viajesTotales
      : 0;
  }

  get rendimientoPromedio(): number {
    return this.litrosTotales > 0
      ? this.kilometrosTotales / this.litrosTotales
      : 0;
  }

  get periodoMesAnterior(): ProduccionMensual | null {
    const fechaAnterior = new Date(
      this.periodoSeleccionado.year,
      this.periodoSeleccionado.month - 2,
      1
    );

    return this.historialProduccion.find(periodo =>
      periodo.year === fechaAnterior.getFullYear() &&
      periodo.month === fechaAnterior.getMonth() + 1
    ) ?? null;
  }

  get produccionMesAnterior(): number | null {
    return this.periodoMesAnterior?.produccion ?? null;
  }

  get viajesMesAnterior(): number | null {
    return this.periodoMesAnterior?.viajes ?? null;
  }

  get kilometrosMesAnterior(): number | null {
    return this.periodoMesAnterior?.kilometros ?? null;
  }

  get produccionPromedioViajeMesAnterior(): number | null {
    const anterior = this.periodoMesAnterior;

    if (
      anterior === null ||
      anterior.produccion === null ||
      anterior.viajes === null ||
      anterior.viajes <= 0
    ) {
      return null;
    }

    return anterior.produccion / anterior.viajes;
  }

  private calcularVariacion(
    actual: number,
    anterior: number | null
  ): number | null {
    if (anterior === null || anterior <= 0) {
      return null;
    }

    return ((actual - anterior) / anterior) * 100;
  }

  get variacionProduccion(): number | null {
    return this.calcularVariacion(
      this.produccionTotal,
      this.produccionMesAnterior
    );
  }

  get variacionViajes(): number | null {
    return this.calcularVariacion(
      this.viajesTotales,
      this.viajesMesAnterior
    );
  }

  get variacionKilometros(): number | null {
    return this.calcularVariacion(
      this.kilometrosTotales,
      this.kilometrosMesAnterior
    );
  }

  get variacionProduccionPorViaje(): number | null {
    return this.calcularVariacion(
      this.produccionPromedioViaje,
      this.produccionPromedioViajeMesAnterior
    );
  }

  get litrosMesAnterior(): number | null {
    return this.periodoMesAnterior?.litrosCombustible ?? null;
  }

  get costoCombustibleMesAnterior(): number | null {
    return this.periodoMesAnterior?.costoCombustible ?? null;
  }

  get rendimientoMesAnterior(): number | null {
    const anterior = this.periodoMesAnterior;

    if (
      anterior === null ||
      anterior.kilometros === null ||
      anterior.litrosCombustible === null ||
      anterior.litrosCombustible <= 0
    ) {
      return null;
    }

    return anterior.kilometros / anterior.litrosCombustible;
  }

  get variacionLitros(): number | null {
    return this.calcularVariacion(
      this.litrosTotales,
      this.litrosMesAnterior
    );
  }

  get variacionCostoCombustible(): number | null {
    return this.calcularVariacion(
      this.costoCombustibleTotal,
      this.costoCombustibleMesAnterior
    );
  }

  get variacionRendimiento(): number | null {
    return this.calcularVariacion(
      this.rendimientoPromedio,
      this.rendimientoMesAnterior
    );
  }

  get puntosGrafico(): string {
    const datos = this.historialProduccion;
    const valores = datos
      .map(periodo => periodo.produccion)
      .filter((valor): valor is number => valor !== null);

    if (datos.length < 2 || valores.length === 0) {
      return '';
    }

    const maximo = Math.max(...valores) || 1;
    const minimo = Math.min(0, ...valores);
    const rango = maximo - minimo || 1;

    return datos
      .map((periodo, indice) => {
        if (periodo.produccion === null) {
          return null;
        }

        const x = 36 + indice * (648 / (datos.length - 1));
        const y = 160 - (
          ((periodo.produccion - minimo) / rango) * 125
        );

        return `${x},${y}`;
      })
      .filter((punto): punto is string => punto !== null)
      .join(' ');
  }

  coordenadaXGrafico(indice: number): number {
    return 36 + indice * (648 / 11);
  }

  coordenadaYGrafico(produccion: number): number {
    const valores = this.historialProduccion
      .map(periodo => periodo.produccion)
      .filter((valor): valor is number => valor !== null);

    const maximo = Math.max(...valores, 1);
    const minimo = Math.min(0, ...valores);
    const rango = maximo - minimo || 1;

    return 160 - ((produccion - minimo) / rango) * 125;
  }

  get camionesOrdenados(): DashboardProduccionCamion[] {
    return [...this.produccionCamiones].sort(
      (a, b) => b.produccion - a.produccion
    );
  }

  get conductoresOrdenados(): DashboardProduccionConductor[] {
    return [...this.produccionConductores].sort(
      (a, b) => b.produccion - a.produccion
    );
  }

  get clientesOrdenados(): DashboardProduccionCliente[] {
    return [...this.produccionClientes].sort(
      (a, b) => b.produccion - a.produccion
    );
  }

  formatoMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(valor);
  }

  formatoNumero(valor: number): string {
    return new Intl.NumberFormat('es-CL', {
      maximumFractionDigits: 0
    }).format(valor);
  }

  formatoDecimal(valor: number): string {
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }).format(valor);
  }

  formatoVariacion(valor: number): string {
    const signo = valor > 0 ? '+' : '';
    return `${signo}${this.formatoDecimal(valor)}%`;
  }

  obtenerPorcentajeProduccionCamion(produccion: number): number {
    return this.produccionTotal > 0
      ? (produccion / this.produccionTotal) * 100
      : 0;
  }

  obtenerPorcentajeProduccionConductor(produccion: number): number {
    const total = this.produccionConductores.reduce(
      (suma, conductor) => suma + conductor.produccion,
      0
    );

    return total > 0 ? (produccion / total) * 100 : 0;
  }

  obtenerPorcentajeProduccionCliente(produccion: number): number {
    const total = this.produccionClientes.reduce(
      (suma, cliente) => suma + cliente.produccion,
      0
    );

    return total > 0 ? (produccion / total) * 100 : 0;
  }

  obtenerPorcentajeCamion(produccion: number): number {
    const maximo = Math.max(
      0,
      ...this.produccionCamiones.map(camion => camion.produccion)
    );

    return maximo > 0 ? (produccion / maximo) * 100 : 0;
  }

  obtenerPorcentajeConductor(produccion: number): number {
    const maximo = Math.max(
      0,
      ...this.produccionConductores.map(conductor => conductor.produccion)
    );

    return maximo > 0 ? (produccion / maximo) * 100 : 0;
  }

  obtenerPorcentajeCliente(produccion: number): number {
    const maximo = Math.max(
      0,
      ...this.produccionClientes.map(cliente => cliente.produccion)
    );

    return maximo > 0 ? (produccion / maximo) * 100 : 0;
  }

  nombreMesCorto(nombre: string): string {
    return nombre.split(' ')[0]?.slice(0, 3) ?? nombre.slice(0, 3);
  }

  get fechaActualizacionTexto(): string {
    if (!this.ultimaActualizacion) {
      return 'Actualizando información';
    }

    return this.ultimaActualizacion.toLocaleString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private get valoresProduccion(): number[] {
    return this.historialProduccion
      .map(p => p.produccion)
      .filter((v): v is number => v !== null);
  }

  get maxProduccion(): number {
    const valores = this.valoresProduccion;
    return valores.length ? Math.max(...valores) : 0;
  }

  get minProduccion(): number {
    const valores = this.valoresProduccion;
    return valores.length ? Math.min(...valores) : 0;
  }

  get tresQuartosProduccion(): number {
    return this.minProduccion + (this.maxProduccion - this.minProduccion) * 0.75;
  }

  get unQuartoProduccion(): number {
    return this.minProduccion + (this.maxProduccion - this.minProduccion) * 0.25;
  }
}
