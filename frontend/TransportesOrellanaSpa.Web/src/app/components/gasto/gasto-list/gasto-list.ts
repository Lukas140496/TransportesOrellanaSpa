import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  DatePipe,
  DecimalPipe
} from '@angular/common';

import { FormsModule } from '@angular/forms';

import { GastoService } from '../../../core/services/gasto.service';
import { Gasto } from '../../../core/models/gasto';
import { ApiService } from '../../../core/services/api.service';
import { Camion } from '../../../core/models/camion';

@Component({
  selector: 'app-gasto-list',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    DecimalPipe
  ],
  templateUrl: './gasto-list.html',
  styleUrl: './gasto-list.scss'
})
export class GastoList implements OnInit {

  private readonly gastoService = inject(GastoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiService = inject(ApiService);

  camiones: Camion[] = [];
  filtroPatente = 'todos';

  gastos: Gasto[] = [];

  paginaActual = 1;
  gastosPorPagina = 15;

  cargando = true;
  error = '';

  busqueda = '';
  filtroTipo = 'todos';

  fechaDesde = '';
  fechaHasta = '';

  ngOnInit(): void {
    this.inicializarFechas();
    this.cargarGastos();
    this.cargarCamiones();
  }

  cargarCamiones(): void {
    this.apiService.getCamiones().subscribe({
      next: camiones => {
        this.camiones = camiones
          .filter(camion => camion.activo)
          .sort((a, b) =>
            a.patente.localeCompare(b.patente)
          );

        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Error al cargar camiones:', error);
      }
    });
  }

  inicializarFechas(): void {
    const hoy = new Date();

    const primerDiaMes = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      1
    );

    this.fechaDesde = this.formatearFecha(primerDiaMes);
    this.fechaHasta = this.formatearFecha(hoy);
  }

  private formatearFecha(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${año}-${mes}-${dia}`;
  }

  cargarGastos(): void {
    this.cargando = true;
    this.error = '';

    this.gastoService.getGastos().subscribe({
      next: gastos => {
        this.gastos = gastos;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Error al cargar gastos:', error);

        this.error = 'No fue posible cargar los gastos.';
        this.cargando = false;

        this.cdr.markForCheck();
      }
    });
  }

  get gastosFiltrados(): Gasto[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.gastos.filter(gasto => {
      const coincideBusqueda =
        !texto ||
        gasto.patenteCamion.toLowerCase().includes(texto) ||
        gasto.descripcion.toLowerCase().includes(texto) ||
        (gasto.numeroGuiaDespacho ?? '').toLowerCase().includes(texto);

      const coincidePatente =
        this.filtroPatente === 'todos' ||
        gasto.patenteCamion === this.filtroPatente;

      const coincideTipo =
        this.filtroTipo === 'todos' ||
        gasto.tipoGasto === this.filtroTipo ||
        (
          this.filtroTipo === 'otros' &&
          ![
            'combustible',
            'peajes',
            'mantención',
            'reparación'
          ].includes(gasto.tipoGasto)
        );

      const fechaGasto = gasto.fecha.substring(0, 10);

      const coincideFechaDesde =
        !this.fechaDesde || fechaGasto >= this.fechaDesde;

      const coincideFechaHasta =
        !this.fechaHasta || fechaGasto <= this.fechaHasta;

      return (
        coincideBusqueda &&
        coincidePatente &&
        coincideTipo &&
        coincideFechaDesde &&
        coincideFechaHasta
      );
    });
  }

  get gastosPaginados(): Gasto[] {
    const inicio = (this.paginaActual - 1) * this.gastosPorPagina;
    const fin = inicio + this.gastosPorPagina;

    return this.gastosFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(
      this.gastosFiltrados.length / this.gastosPorPagina
    );
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  get indiceInicio(): number {
    if (this.gastosFiltrados.length === 0) {
      return 0;
    }

    return ((this.paginaActual - 1) * this.gastosPorPagina) + 1;
  }

  get indiceFin(): number {
    return Math.min(
      this.paginaActual * this.gastosPorPagina,
      this.gastosFiltrados.length
    );
  }

  get cantidadTotal(): number {
    return this.gastosFiltrados.length;
  }

  get montoTotal(): number {
    return this.gastosFiltrados.reduce(
      (total, gasto) => total + gasto.monto,
      0
    );
  }

  get cantidadCombustible(): number {
    return this.gastosFiltrados.filter(
      gasto => gasto.tipoGasto === 'combustible'
    ).length;
  }

  get montoCombustible(): number {
    return this.gastosFiltrados
      .filter(gasto => gasto.tipoGasto === 'combustible')
      .reduce(
        (total, gasto) => total + gasto.monto,
        0
      );
  }

  cambiarFiltroTipo(tipo: string): void {
    this.filtroTipo = tipo;
    this.paginaActual = 1;
  }

  cambiarFiltroPatente(): void {
    this.paginaActual = 1;
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroPatente = 'todos';
    this.filtroTipo = 'todos';

    this.inicializarFechas();

    this.paginaActual = 1;
  }

  limpiarBusqueda(): void {
    this.busqueda = '';
    this.paginaActual = 1;
  }

  hayFiltrosAplicados(): boolean {
    return (
      this.busqueda.trim().length > 0 ||
      this.filtroPatente !== 'todos' ||
      this.filtroTipo !== 'todos' ||
      this.fechaDesde !== this.obtenerPrimerDiaMes() ||
      this.fechaHasta !== this.obtenerFechaActual()
    );
  }

  private obtenerPrimerDiaMes(): string {
    const hoy = new Date();

    return this.formatearFecha(
      new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        1
      )
    );
  }

  private obtenerFechaActual(): string {
    return this.formatearFecha(new Date());
  }
}
