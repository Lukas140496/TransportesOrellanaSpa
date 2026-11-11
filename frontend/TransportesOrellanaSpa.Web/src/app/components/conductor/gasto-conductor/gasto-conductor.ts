
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../core/services/api.service';
import { GastoConductorService } from '../../../core/services/gasto-conductor.service';
import { PermissionService } from '../../../core/services/permission.service';
import { Conductor } from '../../../core/models/conductor';
import { GastoConductor } from '../../../core/models/gasto-conductor';
import { CrearGastoConductor } from '../../../core/models/crear-gasto-conductor';

@Component({
  selector: 'app-gasto-conductor',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './gasto-conductor.html',
  styleUrl: './gasto-conductor.scss'
})
export class GastoConductorComponent implements OnInit {
  private readonly gastoService = inject(GastoConductorService);
  private readonly apiService = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly permissionService = inject(PermissionService);

  gastos: GastoConductor[] = [];
  conductores: Conductor[] = [];
  conductoresActivos: Conductor[] = [];

  cargando = true;
  errorCarga = '';
  exportando = false;

  busqueda = '';
  conductorFiltro = '';
  fechaDesde = this.fechaInicioMesActual();
  fechaHasta = this.fechaLocalHoy();
  tipoFiltro = '';

  paginaActual = 1;
  readonly tamanioPagina = 15;

  modalFormulario = false;
  modalConfirmacion = false;
  modalError = false;
  guardando = false;
  formularioEnviado = false;
  errorFormulario = '';
  mensajeError = '';

  gastoCreado: GastoConductor | null = null;

  nuevoGasto: CrearGastoConductor = this.formularioInicial();

  readonly tiposGasto = [
    { valor: 'sueldo', etiqueta: 'Sueldo' },
    { valor: 'finiquito', etiqueta: 'Finiquito' },
    { valor: 'adelanto', etiqueta: 'Adelanto' },
    { valor: 'bono', etiqueta: 'Bono' },
    { valor: 'afp', etiqueta: 'AFP' },
    { valor: 'salud', etiqueta: 'Salud' },
    { valor: 'seguro', etiqueta: 'Seguro' },
    { valor: 'otros', etiqueta: 'Otros' }
  ];

  ngOnInit(): void {
    this.cargarDatos();
  }

  private formularioInicial(): CrearGastoConductor {
    return {
      conductorId: 0,
      fecha: this.fechaLocalHoy(),
      tipoGasto: 'sueldo',
      descripcion: '',
      monto: 0,
      observaciones: null
    };
  }

  private fechaLocalHoy(): string {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private fechaInicioMesActual(): string {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');

    return `${anio}-${mes}-01`;
  }

  cargarDatos(): void {
    this.cargando = true;
    this.errorCarga = '';

    this.apiService.getConductores().subscribe({
      next: (conductores) => {
        this.conductores = conductores;
        this.conductoresActivos = conductores.filter(c => c.activo);
        this.cargarGastos();
      },
      error: () => {
        this.cargando = false;
        this.errorCarga = 'No fue posible cargar los conductores.';
        this.cdr.detectChanges();
      }
    });
  }


  async exportarExcel(): Promise<void> {
    if (this.exportando || this.gastosFiltrados.length === 0) {
      return;
    }

    this.exportando = true;

    try {
      const ExcelJS = await import('exceljs');

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Gastos Conductores');

      workbook.creator = 'Flota360';

      worksheet.columns = [
        { header: 'Fecha', key: 'fecha', width: 15 },
        { header: 'Conductor', key: 'conductor', width: 32 },
        { header: 'RUT', key: 'rut', width: 16 },
        { header: 'Tipo de gasto', key: 'tipoGasto', width: 20 },
        { header: 'Descripción', key: 'descripcion', width: 40 },
        { header: 'Observaciones', key: 'observaciones', width: 40 },
        { header: 'Monto (CLP)', key: 'monto', width: 18 }
      ];

      // Encabezado
      const encabezado = worksheet.getRow(1);

      encabezado.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };

      encabezado.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A5F' }
      };

      encabezado.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };

      encabezado.height = 25;

      // Agregamos todos los gastos filtrados.
      this.gastosFiltrados.forEach(gasto => {
        const [anio, mes, dia] = gasto.fecha.substring(0, 10).split('-');

        const conductor = this.conductores.find(
          c => c.id === gasto.conductorId
        );

        worksheet.addRow({
          fecha: new Date(Number(anio), Number(mes) - 1, Number(dia)),
          conductor: gasto.nombreConductor || this.nombreConductor(gasto.conductorId),
          rut: conductor?.rut ?? '',
          tipoGasto: this.etiquetaTipo(gasto.tipoGasto),
          descripcion: gasto.descripcion,
          observaciones: gasto.observaciones ?? '',
          monto: gasto.monto
        });
      });

      // Formato de fechas y montos.
      worksheet.getColumn('fecha').numFmt = 'dd/mm/yyyy';
      worksheet.getColumn('monto').numFmt = '#,##0';

      // Filas alternadas.
      for (let i = 2; i <= worksheet.rowCount; i++) {
        if (i % 2 === 0) {
          worksheet.getRow(i).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF1F5F9' }
          };
        }
      }

      // Filtro y encabezado congelado.
      worksheet.autoFilter = 'A1:G1';

      worksheet.views = [
        { state: 'frozen', ySplit: 1 }
      ];

      // Generamos y descargamos el archivo.
      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob(
        [buffer as BlobPart],
        {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      );

      const url = window.URL.createObjectURL(blob);
      const enlace = document.createElement('a');

      const fechaActual = new Date()
        .toISOString()
        .substring(0, 10);

      enlace.href = url;
      enlace.download = `Gastos_Conductores_Flota360_${fechaActual}.xlsx`;

      enlace.click();

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error al exportar los gastos de conductores a Excel:', error);
    } finally {
      this.exportando = false;
      this.cdr.markForCheck();
    }
  }

  private cargarGastos(): void {
    this.gastoService.getGastosConductor().subscribe({
      next: (gastos) => {
        console.log('Gastos recibidos de la API:', gastos.length, gastos);
        this.gastos = [...gastos].sort(
          (a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id
        );
        this.cargando = false;
        this.paginaActual = 1;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.errorCarga = 'No fue posible cargar los gastos de conductores.';
        this.cdr.detectChanges();
      }
    });
  }

  get gastosFiltrados(): GastoConductor[] {
    const texto = this.normalizar(this.busqueda);

    return this.gastos.filter(gasto => {
      const coincideTexto =
        !texto ||
        this.normalizar(gasto.nombreConductor).includes(texto) ||
        this.normalizar(gasto.descripcion).includes(texto) ||
        this.normalizar(gasto.observaciones ?? '').includes(texto) ||
        this.normalizar(this.etiquetaTipo(gasto.tipoGasto)).includes(texto);

      const coincideConductor =
        !this.conductorFiltro ||
        gasto.conductorId === Number(this.conductorFiltro);

      const fecha = gasto.fecha.substring(0, 10);
      const coincideDesde = !this.fechaDesde || fecha >= this.fechaDesde;
      const coincideHasta = !this.fechaHasta || fecha <= this.fechaHasta;
      const coincideTipo =
        !this.tipoFiltro || gasto.tipoGasto === this.tipoFiltro;

      return coincideTexto &&
        coincideConductor &&
        coincideDesde &&
        coincideHasta &&
        coincideTipo;
    });
  }

  private normalizar(valor: string): string {
    return valor
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.gastosFiltrados.length / this.tamanioPagina));
  }

  get gastosPaginados(): GastoConductor[] {
    const inicio = (this.paginaActual - 1) * this.tamanioPagina;
    return this.gastosFiltrados.slice(inicio, inicio + this.tamanioPagina);
  }

  get totalFiltrado(): number {
    return this.gastosFiltrados.reduce((total, gasto) => total + gasto.monto, 0);
  }

  get cantidadSueldos(): number {
    return this.gastosFiltrados.filter(g => g.tipoGasto === 'sueldo').length;
  }

  get montoSueldos(): number {
    return this.gastosFiltrados
      .filter(g => g.tipoGasto === 'sueldo')
      .reduce((total, gasto) => total + gasto.monto, 0);
  }

  get primerResultado(): number {
    return this.gastosFiltrados.length === 0
      ? 0
      : (this.paginaActual - 1) * this.tamanioPagina + 1;
  }

  get ultimoResultado(): number {
    return Math.min(
      this.paginaActual * this.tamanioPagina,
      this.gastosFiltrados.length
    );
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
  }

  aplicarFiltros(): void {
    this.paginaActual = 1;
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.conductorFiltro = '';
    this.fechaDesde = this.fechaInicioMesActual();
    this.fechaHasta = this.fechaLocalHoy();
    this.tipoFiltro = '';
    this.paginaActual = 1;
  }

  limpiarBusqueda(): void {
    this.busqueda = '';
    this.paginaActual = 1;
  }

  etiquetaTipo(tipo: string): string {
    return this.tiposGasto.find(t => t.valor === tipo)?.etiqueta ?? tipo;
  }

  nombreConductor(id: number): string {
    const conductor = this.conductores.find(c => c.id === id);

    if (!conductor) return 'Conductor no disponible';

    return `${conductor.nombres} ${conductor.apellidoPaterno} ${conductor.apellidoMaterno}`.trim();
  }

  abrirFormulario(): void {
    this.nuevoGasto = this.formularioInicial();
    this.formularioEnviado = false;
    this.errorFormulario = '';
    this.modalFormulario = true;
  }

  cerrarFormulario(): void {
    if (this.guardando) return;
    this.modalFormulario = false;
    this.errorFormulario = '';
  }

  campoInvalido(campo: 'conductorId' | 'fecha' | 'tipoGasto' | 'descripcion' | 'monto'): boolean {
    if (!this.formularioEnviado) return false;

    switch (campo) {
      case 'conductorId':
        return !this.nuevoGasto.conductorId ||
          !this.conductoresActivos.some(c => c.id === this.nuevoGasto.conductorId);
      case 'fecha':
        return !this.nuevoGasto.fecha;
      case 'tipoGasto':
        return !this.tiposGasto.some(t => t.valor === this.nuevoGasto.tipoGasto);
      case 'descripcion':
        return !this.nuevoGasto.descripcion.trim();
      case 'monto':
        return !Number.isFinite(this.nuevoGasto.monto) || this.nuevoGasto.monto <= 0;
    }
  }

  guardarGasto(): void {
    this.formularioEnviado = true;
    this.errorFormulario = '';

    if (
      this.campoInvalido('conductorId') ||
      this.campoInvalido('fecha') ||
      this.campoInvalido('tipoGasto') ||
      this.campoInvalido('descripcion') ||
      this.campoInvalido('monto')
    ) {
      return;
    }

    const payload: CrearGastoConductor = {
      ...this.nuevoGasto,
      descripcion: this.nuevoGasto.descripcion.trim(),
      observaciones: this.nuevoGasto.observaciones?.trim() || null,
      monto: Number(this.nuevoGasto.monto)
    };

    this.guardando = true;

    this.gastoService.crearGastoConductor(payload).subscribe({
      next: (gasto) => {
        this.guardando = false;
        this.modalFormulario = false;
        this.gastoCreado = gasto;
        this.modalConfirmacion = true;
        this.gastos = [gasto, ...this.gastos.filter(g => g.id !== gasto.id)]
          .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
        this.limpiarFiltros();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.guardando = false;
        this.errorFormulario =
          error?.error?.message ||
          error?.error?.title ||
          'No fue posible guardar el gasto. Verifica los datos e inténtalo nuevamente.';
        this.cdr.detectChanges();
      }
    });
  }

  cerrarConfirmacion(): void {
    this.modalConfirmacion = false;
    this.gastoCreado = null;
  }

  abrirModalError(): void {
    this.modalFormulario = false;
    this.modalError = true;
  }

  cerrarModalError(): void {
    this.modalError = false;
  }

  reintentarCarga(): void {
    this.cargarDatos();
  }
}
