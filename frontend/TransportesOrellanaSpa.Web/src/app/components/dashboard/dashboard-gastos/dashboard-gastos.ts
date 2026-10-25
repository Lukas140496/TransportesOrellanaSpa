
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';

import { GastoService } from '../../../core/services/gasto.service';
import { GastoRemolqueService } from '../../../core/services/gasto-remolque.service';
import { GastoConductorService } from '../../../core/services/gasto-conductor.service';

import { Gasto } from '../../../core/models/gasto';
import { GastoRemolque } from '../../../core/models/gasto-remolque';
import { GastoConductor } from '../../../core/models/gasto-conductor';

interface ResumenItem {
  nombre: string;
  monto: number;
  cantidad: number;
}

interface ResumenMensual {
  periodo: string;
  etiqueta: string;
  monto: number;
}

interface PeriodoDisponible {
  year: number;
  month: number;
  nombre: string;
}

@Component({
  selector: 'app-dashboard-gastos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-gastos.html',
  styleUrl: './dashboard-gastos.scss'
})
export class DashboardGastos implements OnInit {
  private readonly gastoService = inject(GastoService);
  private readonly gastoRemolqueService = inject(GastoRemolqueService);
  private readonly gastoConductorService = inject(GastoConductorService);
  private readonly cdr = inject(ChangeDetectorRef);

  gastosCamiones: Gasto[] = [];
  gastosRemolques: GastoRemolque[] = [];
  gastosConductores: GastoConductor[] = [];

  cargando = true;
  selectorAbierto = false;
  erroresCarga: string[] = [];
  ultimaActualizacion: Date | null = null;

  periodos: PeriodoDisponible[] = [];
  periodoSeleccionado!: PeriodoDisponible;

  ngOnInit(): void {
    this.inicializarPeriodos();
    this.cargarGastos();
  }

  private inicializarPeriodos(): void {
    const hoy = new Date();
  
    this.periodos = [];
  
    for (let i = 0; i < 12; i++) {
      const fecha = new Date(
        hoy.getFullYear(),
        hoy.getMonth() - i,
        1
      );
  
      const nombre = fecha.toLocaleDateString('es-CL', {
        month: 'long',
        year: 'numeric'
      });
  
      this.periodos.push({
        year: fecha.getFullYear(),
        month: fecha.getMonth() + 1,
        nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1)
      });
    }
  
    this.periodoSeleccionado = this.periodos[0];
  }

  private claveMes(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  
    return `${anio}-${mes}`;
  }

  private mesDeFecha(fecha: string | null | undefined): string {
    return fecha ? fecha.substring(0, 7) : '';
  }

  private montoValido(monto: number): number {
    return Number.isFinite(Number(monto)) ? Number(monto) : 0;
  }

  formatoMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(this.montoValido(valor));
  }

  formatoNumero(valor: number): string {
    return new Intl.NumberFormat('es-CL', {
      maximumFractionDigits: 1
    }).format(this.montoValido(valor));
  }

  cargarGastos(): void {
    this.cargando = true;
    this.erroresCarga = [];

    forkJoin({
      camiones: this.gastoService.getGastos().pipe(
        catchError(() => {
          this.erroresCarga.push(
            'No fue posible cargar los gastos de camiones.'
          );
          return of([] as Gasto[]);
        })
      ),

      remolques: this.gastoRemolqueService.getGastosRemolque().pipe(
        catchError(() => {
          this.erroresCarga.push(
            'No fue posible cargar los gastos de remolques.'
          );
          return of([] as GastoRemolque[]);
        })
      ),

      conductores: this.gastoConductorService.getGastosConductor().pipe(
        catchError(() => {
          this.erroresCarga.push(
            'No fue posible cargar los gastos de conductores.'
          );
          return of([] as GastoConductor[]);
        })
      )
    }).subscribe({
      next: resultado => {
        this.gastosCamiones = resultado.camiones;
        this.gastosRemolques = resultado.remolques;
        this.gastosConductores = resultado.conductores;

        this.cargando = false;
        this.cdr.detectChanges();
        this.ultimaActualizacion = new Date();
      },

      error: () => {
        this.cargando = false;
        this.erroresCarga = [
          'No fue posible cargar los gastos. Intenta nuevamente.'
        ];
        this.cdr.detectChanges();
      }
    });
  }

  toggleSelector(): void {
    this.selectorAbierto = !this.selectorAbierto;
  }

  seleccionarPeriodo(periodo: PeriodoDisponible): void {
    this.periodoSeleccionado = periodo;
    this.selectorAbierto = false;
  }

  private desplazarMes(periodo: PeriodoDisponible, cantidad: number): string {
    return this.claveMes(
      new Date(periodo.year, periodo.month - 1 + cantidad, 1)
    );
  }

  get periodoAnterior(): string {
    return this.desplazarMes(this.periodoSeleccionado, -1);
  }

  get etiquetaPeriodoSeleccionado(): string {
    return this.periodoSeleccionado?.nombre ?? '';
  }

  get etiquetaPeriodoAnterior(): string {
    const [anio, mes] = this.periodoAnterior.split('-').map(Number);
  
    const etiqueta = new Date(anio, mes - 1, 1).toLocaleDateString('es-CL', {
      month: 'long',
      year: 'numeric'
    });
  
    return etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1);
  }

  private gastosCamionesPeriodo(periodo: string): Gasto[] {
    return this.gastosCamiones.filter(
      g => this.mesDeFecha(g.fecha) === periodo
    );
  }

  private gastosRemolquesPeriodo(periodo: string): GastoRemolque[] {
    return this.gastosRemolques.filter(
      g => this.mesDeFecha(g.fecha) === periodo
    );
  }

  private gastosConductoresPeriodo(periodo: string): GastoConductor[] {
    return this.gastosConductores.filter(
      g => this.mesDeFecha(g.fecha) === periodo
    );
  }

  get camionesMes(): Gasto[] {
    return this.gastosCamionesPeriodo(
      this.claveMes(new Date(
        this.periodoSeleccionado.year,
        this.periodoSeleccionado.month - 1,
        1
      ))
    );
  }
  
  get remolquesMes(): GastoRemolque[] {
    return this.gastosRemolquesPeriodo(
      this.claveMes(new Date(
        this.periodoSeleccionado.year,
        this.periodoSeleccionado.month - 1,
        1
      ))
    );
  }
  
  get conductoresMes(): GastoConductor[] {
    return this.gastosConductoresPeriodo(
      this.claveMes(new Date(
        this.periodoSeleccionado.year,
        this.periodoSeleccionado.month - 1,
        1
      ))
    );
  }

  private sumarMontos(registros: { monto: number }[]): number {
    return registros.reduce(
      (total, registro) => total + this.montoValido(registro.monto),
      0
    );
  }

  get totalCamionesMes(): number {
    return this.sumarMontos(this.camionesMes);
  }

  get totalRemolquesMes(): number {
    return this.sumarMontos(this.remolquesMes);
  }

  get totalConductoresMes(): number {
    return this.sumarMontos(this.conductoresMes);
  }

  get totalGeneralMes(): number {
    return (
      this.totalCamionesMes +
      this.totalRemolquesMes +
      this.totalConductoresMes
    );
  }

  get cantidadGeneralMes(): number {
    return (
      this.camionesMes.length +
      this.remolquesMes.length +
      this.conductoresMes.length
    );
  }

  get promedioGeneralMes(): number {
    return this.cantidadGeneralMes > 0
      ? this.totalGeneralMes / this.cantidadGeneralMes
      : 0;
  }

  get totalGeneralAnterior(): number {
    return (
      this.sumarMontos(this.gastosCamionesPeriodo(this.periodoAnterior)) +
      this.sumarMontos(this.gastosRemolquesPeriodo(this.periodoAnterior)) +
      this.sumarMontos(this.gastosConductoresPeriodo(this.periodoAnterior))
    );
  }

  get variacionGeneral(): number | null {
    if (this.totalGeneralAnterior === 0) {
      return this.totalGeneralMes === 0 ? 0 : null;
    }

    return (
      ((this.totalGeneralMes - this.totalGeneralAnterior) /
        this.totalGeneralAnterior) *
      100
    );
  }

  get diferenciaGeneral(): number {
    return this.totalGeneralMes - this.totalGeneralAnterior;
  }

  variacionPeriodo(actual: number, anterior: number): number | null {
    if (anterior === 0) {
      return actual === 0 ? 0 : null;
    }

    return ((actual - anterior) / anterior) * 100;
  }

  get variacionCamiones(): number | null {
    return this.variacionPeriodo(
      this.totalCamionesMes,
      this.sumarMontos(this.gastosCamionesPeriodo(this.periodoAnterior))
    );
  }

  get variacionRemolques(): number | null {
    return this.variacionPeriodo(
      this.totalRemolquesMes,
      this.sumarMontos(this.gastosRemolquesPeriodo(this.periodoAnterior))
    );
  }

  get variacionConductores(): number | null {
    return this.variacionPeriodo(
      this.totalConductoresMes,
      this.sumarMontos(this.gastosConductoresPeriodo(this.periodoAnterior))
    );
  }

  private agrupar<T extends { monto: number }>(
    registros: T[],
    obtenerNombre: (registro: T) => string
  ): ResumenItem[] {
    const grupos = new Map<string, ResumenItem>();

    for (const registro of registros) {
      const nombre = obtenerNombre(registro) || 'Sin nombre';

      const item = grupos.get(nombre) ?? {
        nombre,
        monto: 0,
        cantidad: 0
      };

      item.monto += this.montoValido(registro.monto);
      item.cantidad++;

      grupos.set(nombre, item);
    }

    return [...grupos.values()].sort((a, b) => b.monto - a.monto);
  }

  get gastosPorTipo(): ResumenItem[] {
    const registros = [
      ...this.camionesMes,
      ...this.remolquesMes,
      ...this.conductoresMes
    ];

    return this.agrupar(
      registros,
      g => g.tipoGasto
    );
  }

  get gastosPorCamion(): ResumenItem[] {
    return this.agrupar(
      this.camionesMes,
      g => g.patenteCamion
    );
  }

  get gastosPorRemolque(): ResumenItem[] {
    return this.agrupar(
      this.remolquesMes,
      g => g.patenteRemolque
    );
  }

  get gastosPorConductor(): ResumenItem[] {
    return this.agrupar(
      this.conductoresMes,
      g => g.nombreConductor
    );
  }

  maximoMonto(items: ResumenItem[]): number {
    return Math.max(1, ...items.map(item => item.monto));
  }

  get evolucionMensual(): ResumenMensual[] {
    const { year: anio, month: mes } = this.periodoSeleccionado;
  
    return Array.from({ length: 12 }, (_, indice) => {
      const fecha = new Date(anio, mes - 1 - 11 + indice, 1);
      const periodo = this.claveMes(fecha);
  
      const etiqueta = fecha.toLocaleDateString('es-CL', {
        month: 'short',
        year: 'numeric'
      });
  
      const monto =
        this.sumarMontos(this.gastosCamionesPeriodo(periodo)) +
        this.sumarMontos(this.gastosRemolquesPeriodo(periodo)) +
        this.sumarMontos(this.gastosConductoresPeriodo(periodo));
  
      return {
        periodo,
        etiqueta: etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1),
        monto
      };
    });
  }

  get maximoMensual(): number {
    return Math.max(
      1,
      ...this.evolucionMensual.map(m => m.monto)
    );
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

  etiquetaTipo(tipo: string): string {
    const etiquetas: Record<string, string> = {
      combustible: 'Combustible',
      peajes: 'Peajes',
      mantención: 'Mantención',
      reparación: 'Reparación',
      neumáticos: 'Neumáticos',
      permisos: 'Permisos',
      seguros: 'Seguros',
      multas: 'Multas',
      lavado: 'Lavado',
      revision: 'Revisión',
      sueldo: 'Sueldo',
      finiquito: 'Finiquito',
      adelanto: 'Adelanto',
      bono: 'Bono',
      afp: 'AFP',
      salud: 'Salud',
      seguro: 'Seguro',
      otros: 'Otros'
    };

    return etiquetas[tipo] ?? tipo;
  }
}
