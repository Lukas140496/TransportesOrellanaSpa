
import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Cliente } from '../../../core/models/cliente';
import { Viaje } from '../../../core/models/viaje';
import { PermissionService } from '../../../core/services/permission.service';

@Component({
  selector: 'app-viaje-list',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule
  ],
  templateUrl: './viaje-list.html',
  styleUrl: './viaje-list.scss'
})
export class ViajeList implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly permissionService = inject(PermissionService);

  viajes: Viaje[] = [];
  clientes: Cliente[] = [];

  cargando = true;
  exportando = false;
  error = '';

  // PAGINACIÓN
  paginaActual = 1;
  viajesPorPagina = 10;

  // FILTROS
  guia = '';
  fechaDesde = '';
  fechaHasta = '';
  clienteId: number | null = null;
  estadoPago = '';
  filtrosAbiertos = false;

  private guiaTimeout: ReturnType<typeof setTimeout> | null = null;

  private establecerFechasPorDefecto(): void {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const formatearFecha = (fecha: Date): string => {
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    };

    this.fechaDesde = formatearFecha(primerDiaMes);
    this.fechaHasta = formatearFecha(hoy);
  }

  ngOnInit(): void {
    this.establecerFechasPorDefecto();
    this.cargarClientes();
    this.cargarViajes();
  }

  nuevoViaje(): void {
    this.router.navigate(['/viajes/nuevo']);
  }

  private cargarClientes(): void {
    this.api.getClientes().subscribe({
      next: clientes => {
        this.clientes = clientes;
      },
      error: error => {
        console.error('Error al cargar clientes:', error);
      }
    });
  }

  cargarViajes(): void {
    this.cargando = true;
    this.error = '';

    this.api.getViajes(
      this.guia,
      this.fechaDesde || undefined,
      this.fechaHasta || undefined,
      this.clienteId ?? undefined,
      this.estadoPago || undefined
    ).subscribe({
      next: viajes => {
        this.viajes = viajes;
        this.paginaActual = 1;
        this.cargando = false;
      },
      error: error => {
        console.error('Error al cargar viajes:', error);
        this.error = 'No fue posible cargar los viajes.';
        this.cargando = false;
      }
    });
  }

  async exportarExcel(): Promise<void> {

    if (this.cargando || this.exportando || this.viajes.length === 0) {
      return;
    }

    this.exportando = true;

    try {
      const ExcelJSModule = await import('exceljs');
      const ExcelJS = ExcelJSModule.default ?? ExcelJSModule;
      const workbook = new ExcelJS.Workbook();

      workbook.creator = 'Flota360';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Viajes');

      worksheet.columns = [
        { header: 'Número de guía', key: 'guia', width: 20 },
        { header: 'Fecha', key: 'fecha', width: 15 },
        { header: 'Cliente', key: 'cliente', width: 30 },
        { header: 'RUT cliente', key: 'rutCliente', width: 17 },
        { header: 'Origen', key: 'origen', width: 22 },
        { header: 'Destino', key: 'destino', width: 22 },
        { header: 'Camión', key: 'camion', width: 15 },
        { header: 'Conductor', key: 'conductor', width: 32 },
        { header: 'Remolque', key: 'remolque', width: 15 },
        { header: 'Tipo de carga', key: 'tipoCarga', width: 22 },
        { header: 'Kilómetros', key: 'kilometros', width: 15 },
        { header: 'Litros combustible', key: 'litros', width: 20 },
        { header: 'Costo combustible', key: 'costoCombustible', width: 20 },
        { header: 'Tarifa', key: 'tarifa', width: 18 },
        { header: 'Estado viaje', key: 'estado', width: 18 },
        { header: 'Estado pago', key: 'estadoPago', width: 18 }
      ];

      const filas = this.viajes.map(viaje => {
        const partesNombre = [
          viaje.conductor?.nombres,
          viaje.conductor?.apellidoPaterno,
          viaje.conductor?.apellidoMaterno
        ].filter(Boolean);

        return {
          guia: viaje.numeroGuiaDespacho ?? '',
          fecha: viaje.fecha
            ? new Date(`${viaje.fecha.substring(0, 10)}T00:00:00`)
            : null,
          cliente: viaje.cliente?.nombre ?? '',
          rutCliente: viaje.cliente?.rut ?? '',
          origen: viaje.origen ?? '',
          destino: viaje.destino ?? '',
          camion: viaje.camion?.patente ?? '',
          conductor: partesNombre.join(' '),
          remolque: viaje.remolque?.patente ?? '',
          tipoCarga: viaje.tipoCarga ?? '',
          kilometros: viaje.kilometros ?? 0,
          litros: viaje.litrosCombustible ?? 0,
          costoCombustible: viaje.costoCombustible ?? 0,
          tarifa: viaje.tarifa ?? 0,
          estado: this.formatoEstadoViaje(viaje.estado),
          estadoPago: viaje.estadoPago ?? ''
        };
      });

      worksheet.addRows(filas);

      // ENCABEZADOS
      const encabezado = worksheet.getRow(1);
      encabezado.height = 28;

      encabezado.eachCell(cell => {
        cell.font = {
          bold: true,
          color: { argb: 'FFFFFFFF' },
          size: 11
        };

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF17365D' }
        };

        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        };

        cell.border = {
          bottom: {
            style: 'medium',
            color: { argb: 'FF4472C4' }
          }
        };
      });

      // FORMATOS
      worksheet.getColumn('fecha').numFmt = 'dd/mm/yyyy';
      worksheet.getColumn('kilometros').numFmt = '#,##0.00';
      worksheet.getColumn('litros').numFmt = '#,##0.00';
      worksheet.getColumn('costoCombustible').numFmt = '"$"#,##0';
      worksheet.getColumn('tarifa').numFmt = '"$"#,##0';

      // ALINEACIÓN
      worksheet.eachRow((row, numeroFila) => {
        if (numeroFila > 1) {
          row.alignment = {
            vertical: 'middle'
          };

          if (numeroFila % 2 === 0) {
            row.eachCell(cell => {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF2F6FC' }
              };
            });
          }
        }
      });

      // FILTROS EN ENCABEZADOS
      worksheet.autoFilter = {
        from: 'A1',
        to: 'P1'
      };

      // CONGELAR ENCABEZADO
      worksheet.views = [
        { state: 'frozen', ySplit: 1 }
      ];

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob(
        [buffer as BlobPart],
        {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      );

      const url = window.URL.createObjectURL(blob);
      const enlace = document.createElement('a');

      const hoy = new Date();
      const fechaArchivo = [
        hoy.getFullYear(),
        String(hoy.getMonth() + 1).padStart(2, '0'),
        String(hoy.getDate()).padStart(2, '0')
      ].join('-');

      enlace.href = url;
      enlace.download = `Viajes_Flota360_${fechaArchivo}.xlsx`;

      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error al exportar viajes a Excel:', error);
      this.error = 'No fue posible generar el archivo Excel.';
    } finally {
      this.exportando = false;
    }
  }

  get viajesPaginados(): Viaje[] {
    const inicio = (this.paginaActual - 1) * this.viajesPorPagina;
    const fin = inicio + this.viajesPorPagina;
    return this.viajes.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.viajes.length / this.viajesPorPagina);
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) this.paginaActual--;
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) this.paginaActual++;
  }

  get indiceInicio(): number {
    if (this.viajes.length === 0) return 0;
    return (this.paginaActual - 1) * this.viajesPorPagina + 1;
  }

  get indiceFin(): number {
    return Math.min(this.paginaActual * this.viajesPorPagina, this.viajes.length);
  }

  onGuiaChange(): void {
    if (this.guiaTimeout) clearTimeout(this.guiaTimeout);
    this.cerrarFiltrosResponsive();
    this.guiaTimeout = setTimeout(() => {
      this.cargarViajes();
    }, 300);
  }

  onFechaChange(): void {
    this.paginaActual = 1;
    this.cargarViajes();
    this.cerrarFiltrosResponsive();
  }

  onClienteChange(): void {
    this.paginaActual = 1;
    this.cargarViajes();
    this.cerrarFiltrosResponsive();
  }

  onEstadoPagoChange(): void {
    this.paginaActual = 1;
    this.cargarViajes();
    this.cerrarFiltrosResponsive();
  }

  limpiarFiltros(): void {
    if (this.guiaTimeout) {
      clearTimeout(this.guiaTimeout);
      this.guiaTimeout = null;
    }

    this.guia = '';
    this.establecerFechasPorDefecto();
    this.clienteId = null;
    this.estadoPago = '';
    this.paginaActual = 1;
    this.cargarViajes();
  }

  toggleFiltros(): void {
    this.filtrosAbiertos = !this.filtrosAbiertos;
  }

  private cerrarFiltrosResponsive(): void {
    if (window.innerWidth <= 1100) {
      this.filtrosAbiertos = false;
    }
  }

  verDetalle(id: number): void {
    this.router.navigate(['/viajes', id]);
  }

  formatoEstadoViaje(estado: string): string {
    switch (estado) {
      case 'EnCurso':
        return 'En Curso';
      default:
        return estado;
    }
  }
}
