
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { Remolque } from '../../../core/models/remolque';
import { PermissionService } from '../../../core/services/permission.service';

@Component({
  selector: 'app-remolque-list',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './remolque-list.html',
  styleUrl: './remolque-list.scss'
})
export class RemolqueList implements OnInit {

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly permissionService = inject(PermissionService);

  remolques: Remolque[] = [];

  cargando = true;
  exportando = false;
  error = '';

  busqueda = '';

  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'todos';

  ngOnInit(): void {

    this.api.getRemolques().subscribe({

      next: remolques => {

        this.remolques = remolques;
        this.cargando = false;

      },

      error: error => {

        console.error(
          'Error al cargar remolques:',
          error
        );

        this.error =
          'No fue posible cargar los remolques.';

        this.cargando = false;

      }

    });

  }

  get remolquesFiltrados(): Remolque[] {

    const texto =
      this.busqueda
        .trim()
        .toLowerCase();

    return this.remolques.filter(remolque => {

      const patenteCamion =
        remolque.camionHabitual?.patente
          ?.toLowerCase() ?? '';

      const coincideBusqueda =
        !texto ||
        remolque.patente
          .toLowerCase()
          .includes(texto) ||

        remolque.marca
          .toLowerCase()
          .includes(texto) ||

        remolque.modelo
          .toLowerCase()
          .includes(texto) ||

        remolque.tipo
          .toLowerCase()
          .includes(texto) ||

        patenteCamion.includes(texto);

      const coincideEstado =
        this.filtroEstado === 'todos' ||

        (
          this.filtroEstado === 'activos' &&
          remolque.activa
        ) ||

        (
          this.filtroEstado === 'inactivos' &&
          !remolque.activa
        );

      return coincideBusqueda && coincideEstado;

    });

  }

  get remolquesActivos(): number {

    return this.remolques.filter(
      remolque => remolque.activa
    ).length;

  }

  get remolquesInactivos(): number {

    return this.remolques.filter(
      remolque => !remolque.activa
    ).length;

  }

  get remolquesSinCamion(): number {

    return this.remolques.filter(
      remolque => !remolque.camionHabitual
    ).length;

  }

  cambiarFiltroEstado(
    filtro: 'todos' | 'activos' | 'inactivos'
  ): void {

    this.filtroEstado = filtro;

  }

  limpiarBusqueda(): void {

    this.busqueda = '';

  }

  hayBusqueda(): boolean {

    return this.busqueda.trim().length > 0;

  }

  hayFiltrosAplicados(): boolean {

    return (
      this.busqueda.trim().length > 0 ||
      this.filtroEstado !== 'todos'
    );

  }

  limpiarFiltros(): void {

    this.busqueda = '';
    this.filtroEstado = 'todos';

  }

  async exportarExcel(): Promise<void> {

    if (this.exportando || this.remolquesFiltrados.length === 0) {
      return;
    }

    this.exportando = true;

    try {

      const ExcelJSModule = await import('exceljs');

      const ExcelJS = ExcelJSModule.default ?? ExcelJSModule;

      const workbook = new ExcelJS.Workbook();

      workbook.creator = 'Flota360';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Remolques');

      worksheet.columns = [
        { header: 'Patente', key: 'patente', width: 16 },
        { header: 'Marca', key: 'marca', width: 20 },
        { header: 'Modelo', key: 'modelo', width: 20 },
        { header: 'Año', key: 'ano', width: 10 },
        { header: 'Tipo', key: 'tipo', width: 20 },
        { header: 'Capacidad (Ton)', key: 'capacidad', width: 18 },
        { header: 'Camión habitual', key: 'camionHabitual', width: 20 },

        { header: 'Vencimiento permiso circulación', key: 'fechaPermiso', width: 28 },
        { header: 'Estado permiso circulación', key: 'estadoPermiso', width: 25 },
        { header: 'Días restantes permiso', key: 'diasPermiso', width: 23 },

        { header: 'Vencimiento seguro', key: 'fechaSeguro', width: 22 },
        { header: 'Estado seguro', key: 'estadoSeguro', width: 18 },
        { header: 'Días restantes seguro', key: 'diasSeguro', width: 22 },

        { header: 'Vencimiento revisión técnica', key: 'fechaRevision', width: 27 },
        { header: 'Estado revisión técnica', key: 'estadoRevision', width: 24 },
        { header: 'Días restantes revisión', key: 'diasRevision', width: 23 },

        { header: 'Estado remolque', key: 'estado', width: 18 }
      ];

      const convertirFecha = (fecha: string | null): Date | null => {

        if (!fecha) {
          return null;
        }

        const fechaTexto = fecha.substring(0, 10);

        const fechaConvertida = new Date(`${fechaTexto}T00:00:00`);

        return Number.isNaN(fechaConvertida.getTime())
          ? null
          : fechaConvertida;

      };

      const textoEstadoDocumento = (estado: string): string => {

        switch (estado) {
          case 'AlDia':
            return 'Al día';

          case 'PorVencer':
            return 'Por vencer';

          case 'Vencido':
            return 'Vencido';

          case 'SinRegistro':
          default:
            return 'Sin registro';
        }

      };

      this.remolquesFiltrados.forEach(remolque => {

        worksheet.addRow({

          patente: remolque.patente,
          marca: remolque.marca,
          modelo: remolque.modelo,
          ano: remolque.ano,
          tipo: remolque.tipo,
          capacidad: remolque.capacidadToneladas,

          camionHabitual:
            remolque.camionHabitual?.patente ?? 'Sin asignar',

          fechaPermiso: convertirFecha(remolque.fechaPermisoCirculacion),
          estadoPermiso: textoEstadoDocumento(remolque.permisoCirculacion.estado),
          diasPermiso: remolque.permisoCirculacion.diasRestantes,

          fechaSeguro: convertirFecha(remolque.fechaSeguro),
          estadoSeguro: textoEstadoDocumento(remolque.seguro.estado),
          diasSeguro: remolque.seguro.diasRestantes,

          fechaRevision: convertirFecha(remolque.fechaRevisionTecnica),
          estadoRevision: textoEstadoDocumento(remolque.revisionTecnica.estado),
          diasRevision: remolque.revisionTecnica.diasRestantes,

          estado: remolque.activa
            ? 'Activo'
            : 'Inactivo'

        });

      });

      // Encabezado
      const header = worksheet.getRow(1);

      header.height = 24;

      header.eachCell(cell => {

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E3A5F' }
        };

        cell.font = {
          name: 'Arial',
          size: 10,
          bold: true,
          color: { argb: 'FFFFFFFF' }
        };

        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        };

        cell.border = {
          bottom: {
            style: 'medium',
            color: { argb: 'FF16304F' }
          }
        };

      });

      // Filas y formatos
      worksheet.eachRow((row, rowNumber) => {

        if (rowNumber > 1) {

          row.height = 21;

          row.eachCell(cell => {

            cell.font = {
              name: 'Arial',
              size: 10,
              color: { argb: 'FF334155' }
            };

            cell.alignment = {
              vertical: 'middle'
            };

            if (rowNumber % 2 === 0) {

              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF1F5F9' }
              };

            }

          });

        }

      });

      // Formato de fechas
      [
        'H',
        'K',
        'N'
      ].forEach(columna => {

        worksheet.getColumn(columna).numFmt = 'dd/mm/yyyy';

      });

      // Formato de capacidad
      worksheet.getColumn('F').numFmt = '0.00';

      // Filtros y encabezado fijo
      worksheet.autoFilter = 'A1:Q1';

      worksheet.views = [
        {
          state: 'frozen',
          ySplit: 1
        }
      ];

      // Descargar archivo
      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob(
        [buffer],
        {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      );

      const url = window.URL.createObjectURL(blob);

      const enlace = document.createElement('a');

      enlace.href = url;
      enlace.download = `Remolques_Flota360_${new Date().toISOString().slice(0, 10)}.xlsx`;

      enlace.click();

      window.URL.revokeObjectURL(url);

    } catch (error) {

      console.error('Error al exportar remolques:', error);

    } finally {

      this.exportando = false;

    }

  }

  verDetalle(patente: string): void {

    this.router.navigate([
      '/remolques',
      patente
    ]);

  }

  nuevoRemolque(): void {

    this.router.navigate([
      '/remolques/nuevo'
    ]);

  }

}
