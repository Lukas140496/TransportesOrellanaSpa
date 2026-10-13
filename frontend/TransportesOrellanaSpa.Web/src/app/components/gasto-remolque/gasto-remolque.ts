import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  DatePipe,
  DecimalPipe,
  TitleCasePipe
} from '@angular/common';

import { FormsModule } from '@angular/forms';

import { ApiService } from '../../core/services/api.service';
import { Remolque } from '../../core/models/remolque';

import { GastoRemolqueService } from '../../core/services/gasto-remolque.service';
import { GastoRemolque } from '../../core/models/gasto-remolque';
import { CrearGastoRemolque } from '../../core/models/crear-gasto-remolque';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-gasto-remolque',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    DecimalPipe,
    TitleCasePipe
  ],
  templateUrl: './gasto-remolque.html',
  styleUrl: './gasto-remolque.scss'
})
export class GastoRemolqueComponent implements OnInit {

  private readonly gastoRemolqueService =
    inject(GastoRemolqueService);

  private readonly apiService =
    inject(ApiService);

  private readonly cdr =
    inject(ChangeDetectorRef);

  readonly permissionService = inject(PermissionService);

  gastos: GastoRemolque[] = [];

  remolques: Remolque[] = [];

  paginaActual = 1;

  gastosPorPagina = 15;

  cargando = true;

  error = '';

  busqueda = '';

  filtroPatente = 'todos';

  filtroTipo = 'todos';

  fechaDesde = '';

  fechaHasta = '';

  // =====================================================
  // FORMULARIO NUEVO GASTO
  // =====================================================

  mostrarFormulario = false;

  guardando = false;

  errorFormulario = '';

  remolqueId = 0;

  fechaGasto = '';

  tipoGasto = 'mantención';

  descripcionGasto = '';

  montoGasto: number | null = null;

  observacionesGasto = '';

  tiposGasto = [
    'mantención',
    'reparación',
    'neumáticos',
    'permisos',
    'seguros',
    'revision',
    'multas',
    'lavado',
    'otros'
  ];

  camposTocadosGasto: Record<string, boolean> = {};

  // =====================================================
  // CONFIRMACIÓN Y ERROR DE CREACIÓN
  // =====================================================

  mostrarConfirmacionGasto = false;

  mostrarErrorGasto = false;

  gastoCreadoConfirmacion: {
    patenteRemolque: string;
    fecha: string;
    tipoGasto: string;
    descripcion: string;
    monto: number;
    observaciones: string;
  } | null = null;

  ngOnInit(): void {
    this.inicializarFechas();
    this.cargarRemolques();
    this.cargarGastos();
  }

  inicializarFechas(): void {
    const hoy = new Date();

    const primerDiaMes = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      1
    );

    this.fechaDesde =
      this.formatearFecha(primerDiaMes);

    this.fechaHasta =
      this.formatearFecha(hoy);
  }

  private formatearFecha(fecha: Date): string {
    const año = fecha.getFullYear();

    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      fecha.getDate()
    ).padStart(2, '0');

    return `${año}-${mes}-${dia}`;
  }

  cargarRemolques(): void {
    this.apiService.getRemolques().subscribe({
      next: remolques => {
        this.remolques = remolques
          .filter(remolque => remolque.activa)
          .sort((a, b) =>
            a.patente.localeCompare(b.patente)
          );

        this.cdr.markForCheck();
      },

      error: error => {
        console.error(
          'Error al cargar remolques para el filtro:',
          error
        );
      }
    });
  }

  cargarGastos(): void {
    this.cargando = true;
    this.error = '';

    this.gastoRemolqueService
      .getGastosRemolque()
      .subscribe({
        next: gastos => {
          this.gastos = gastos;
          this.cargando = false;
          this.paginaActual = 1;
          this.cdr.markForCheck();
        },

        error: error => {
          console.error(
            'Error al cargar gastos de remolques:',
            error
          );

          this.error =
            'No fue posible cargar los gastos de remolques.';

          this.cargando = false;
          this.cdr.markForCheck();
        }
      });
  }

  // =====================================================
  // APERTURA Y CIERRE DEL FORMULARIO
  // =====================================================

  abrirFormulario(): void {
    if (!this.permissionService.tienePermiso('GASTOS_CREAR')) {
      return;
    }
  
    if (this.guardando) {
      return;
    }
  
    this.reiniciarFormulario();
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    if (this.guardando) {
      return;
    }

    this.mostrarFormulario = false;
    this.errorFormulario = '';
  }

  private reiniciarFormulario(): void {
    this.remolqueId = 0;
    this.fechaGasto = this.formatearFecha(new Date());
    this.tipoGasto = 'mantención';
    this.descripcionGasto = '';
    this.montoGasto = null;
    this.observacionesGasto = '';
    this.camposTocadosGasto = {};
    this.errorFormulario = '';
  }

  // =====================================================
  // VALIDACIONES
  // =====================================================

  campoTocadoGasto(campo: string): boolean {
    return !!this.camposTocadosGasto[campo];
  }

  campoTieneErrorGasto(campo: string): boolean {
    if (!this.campoTocadoGasto(campo)) {
      return false;
    }

    switch (campo) {
      case 'remolqueId':
        return !this.remolqueId ||
          !this.remolques.some(
            remolque => remolque.id === Number(this.remolqueId)
          );

      case 'fecha':
        return !this.fechaGasto;

      case 'tipoGasto':
        return !this.tipoGasto;

      case 'descripcion':
        return !this.descripcionGasto.trim();

      case 'monto':
        return this.montoGasto === null ||
          this.montoGasto === undefined ||
          !Number.isFinite(Number(this.montoGasto)) ||
          Number(this.montoGasto) <= 0;

      default:
        return false;
    }
  }

  private validarFormulario(): boolean {
    const camposObligatorios = [
      'remolqueId',
      'fecha',
      'tipoGasto',
      'descripcion',
      'monto'
    ];

    camposObligatorios.forEach(campo => {
      this.camposTocadosGasto[campo] = true;
    });

    return !camposObligatorios.some(
      campo => this.campoTieneErrorGasto(campo)
    );
  }

  // =====================================================
  // GUARDAR GASTO
  // =====================================================

  guardarGasto(): void {
    if (this.guardando) {
      return;
    }

    this.errorFormulario = '';

    if (!this.validarFormulario()) {
      return;
    }

    const remolqueSeleccionado = this.remolques.find(
      remolque => remolque.id === Number(this.remolqueId)
    );

    if (!remolqueSeleccionado) {
      this.errorFormulario =
        'Selecciona un remolque activo válido.';
      return;
    }

    const nuevoGasto: CrearGastoRemolque = {
      remolqueId: Number(this.remolqueId),
      fecha: this.fechaGasto,
      tipoGasto: this.tipoGasto,
      descripcion: this.descripcionGasto.trim(),
      monto: Number(this.montoGasto),
      observaciones: this.observacionesGasto.trim() || null
    };

    this.guardando = true;

    this.gastoRemolqueService
      .crearGastoRemolque(nuevoGasto)
      .subscribe({
        next: gastoCreado => {
          this.gastoCreadoConfirmacion = {
            patenteRemolque:
              gastoCreado.patenteRemolque ||
              remolqueSeleccionado.patente,
            fecha: gastoCreado.fecha || this.fechaGasto,
            tipoGasto: gastoCreado.tipoGasto,
            descripcion: gastoCreado.descripcion,
            monto: gastoCreado.monto,
            observaciones:
              gastoCreado.observaciones || ''
          };

          this.guardando = false;
          this.mostrarFormulario = false;

          this.reiniciarFormulario();

          this.mostrarConfirmacionGasto = true;

          // Recarga la lista sin modificar los filtros seleccionados.
          this.cargarGastos();

          this.cdr.markForCheck();
        },

        error: error => {
          console.error(
            'Error al crear gasto de remolque:',
            error
          );

          this.guardando = false;
          this.mostrarErrorGasto = true;

          this.cdr.markForCheck();
        }
      });
  }

  cerrarConfirmacionGasto(): void {
    this.mostrarConfirmacionGasto = false;
    this.gastoCreadoConfirmacion = null;
  }

  cerrarErrorGasto(): void {
    this.mostrarErrorGasto = false;
  }

  volverAlFormulario(): void {
    this.mostrarErrorGasto = false;
    this.errorFormulario = '';
    this.mostrarFormulario = true;
  }

  formatearFechaConfirmacion(fecha: string): string {
    if (!fecha) {
      return '';
    }

    const fechaSoloDia = fecha.substring(0, 10);
    const partes = fechaSoloDia.split('-');

    if (partes.length !== 3) {
      return fechaSoloDia;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  // =====================================================
  // FILTROS, TABLA Y PAGINACIÓN EXISTENTES
  // =====================================================

  get gastosFiltrados(): GastoRemolque[] {
    const texto = this.busqueda
      .trim()
      .toLowerCase();

    return this.gastos.filter(gasto => {
      const coincideBusqueda =
        !texto ||
        gasto.patenteRemolque
          .toLowerCase()
          .includes(texto) ||
        gasto.descripcion
          .toLowerCase()
          .includes(texto);

      const coincidePatente =
        this.filtroPatente === 'todos' ||
        gasto.patenteRemolque === this.filtroPatente;

      const coincideTipo =
        this.filtroTipo === 'todos' ||
        gasto.tipoGasto === this.filtroTipo;

      const fechaGasto =
        gasto.fecha.substring(0, 10);

      const coincideFechaDesde =
        !this.fechaDesde ||
        fechaGasto >= this.fechaDesde;

      const coincideFechaHasta =
        !this.fechaHasta ||
        fechaGasto <= this.fechaHasta;

      return (
        coincideBusqueda &&
        coincidePatente &&
        coincideTipo &&
        coincideFechaDesde &&
        coincideFechaHasta
      );
    });
  }

  get gastosPaginados(): GastoRemolque[] {
    const inicio =
      (this.paginaActual - 1) *
      this.gastosPorPagina;

    const fin =
      inicio + this.gastosPorPagina;

    return this.gastosFiltrados.slice(
      inicio,
      fin
    );
  }

  get totalPaginas(): number {
    return Math.ceil(
      this.gastosFiltrados.length /
      this.gastosPorPagina
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

    return (
      (this.paginaActual - 1) *
      this.gastosPorPagina
    ) + 1;
  }

  get indiceFin(): number {
    return Math.min(
      this.paginaActual *
      this.gastosPorPagina,
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

  get cantidadMantencion(): number {
    return this.gastosFiltrados.filter(
      gasto => gasto.tipoGasto === 'mantención'
    ).length;
  }

  get montoMantencion(): number {
    return this.gastosFiltrados
      .filter(
        gasto => gasto.tipoGasto === 'mantención'
      )
      .reduce(
        (total, gasto) => total + gasto.monto,
        0
      );
  }

  cambiarFiltroPatente(): void {
    this.paginaActual = 1;
  }

  cambiarFiltroTipo(tipo: string): void {
    this.filtroTipo = tipo;
    this.paginaActual = 1;
  }

  cambiarBusqueda(): void {
    this.paginaActual = 1;
  }

  cambiarFiltrosFecha(): void {
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
